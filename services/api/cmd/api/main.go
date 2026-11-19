package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"time"

	"agritech.local/api/internal/identity"
	"agritech.local/api/internal/payment"
	_ "github.com/lib/pq"
)

var escrowID = regexp.MustCompile("^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$")

func main() {
	db, err := sql.Open("postgres", requiredEnv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)

	auth := identity.Keycloak{
		Issuer: requiredEnv("KEYCLOAK_ISSUER"),
		InternalRealm: requiredEnv("KEYCLOAK_INTERNAL_REALM"),
		Secret: requiredEnv("KEYCLOAK_API_SECRET"),
		Client: &http.Client{Timeout: 5 * time.Second},
	}
	payments := payment.Service{Repository: payment.Postgres{DB: db}}
	mux := http.NewServeMux()
	registerDemandRoutes(mux, auth, db)
	registerLeaseRoutes(mux, auth, db)
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		if err := db.PingContext(r.Context()); err != nil {
			fail(w, http.StatusServiceUnavailable, "Database unavailable.")
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /v1/governance/session", require(auth, false, func(w http.ResponseWriter, _ *http.Request, user identity.Principal) {
		writeJSON(w, http.StatusOK, user)
	}))
	mux.HandleFunc("GET /v1/payments/escrows", require(auth, false, func(w http.ResponseWriter, r *http.Request, _ identity.Principal) {
		items, err := payments.List(r.Context())
		writePayment(w, items, err)
	}))
	mux.HandleFunc("POST /v1/payments/escrows", require(auth, true, func(w http.ResponseWriter, r *http.Request, user identity.Principal) {
		var body struct {
			Reference string `json:"reference"`
			AmountMinor int64 `json:"amountMinor"`
		}
		if !decode(w, r, &body) {
			return
		}
		item, err := payments.Hold(r.Context(), body.Reference, body.AmountMinor, user.Subject)
		writePayment(w, item, err)
	}))
	mux.HandleFunc("POST /v1/payments/escrows/{id}/close", require(auth, true, func(w http.ResponseWriter, r *http.Request, user identity.Principal) {
		id := r.PathValue("id")
		if !escrowID.MatchString(id) {
			fail(w, http.StatusNotFound, "Escrow not found.")
			return
		}
		var body struct {
			Status payment.Status `json:"status"`
		}
		if !decode(w, r, &body) {
			return
		}
		item, err := payments.Close(r.Context(), id, body.Status, user.Subject)
		writePayment(w, item, err)
	}))
	server := &http.Server{
		Addr: ":8081", Handler: mux, ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout: 10 * time.Second, WriteTimeout: 15 * time.Second, IdleTimeout: time.Minute,
	}
	log.Print("AgriTech API listening on :8081")
	log.Fatal(server.ListenAndServe())
}

type authenticator interface {
	Authenticate(ctx context.Context, authorization string) (identity.Principal, error)
}

func require(auth authenticator, adminOnly bool, next func(http.ResponseWriter, *http.Request, identity.Principal)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		user, err := auth.Authenticate(r.Context(), r.Header.Get("Authorization"))
		switch {
		case errors.Is(err, identity.ErrInvalidToken):
			w.Header().Set("WWW-Authenticate", "Bearer")
			fail(w, http.StatusUnauthorized, "Sign in to continue.")
		case err != nil:
			log.Printf("Identity service: %v", err)
			fail(w, http.StatusServiceUnavailable, "Identity service unavailable.")
		case user.HasRole(identity.SuperAdmin), !adminOnly && user.HasRole(identity.Auditor):
			next(w, r, user)
		default:
			fail(w, http.StatusForbidden, "Your role does not have access.")
		}
	}
}

func decode(w http.ResponseWriter, r *http.Request, body any) bool {
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(body); err != nil || decoder.Decode(new(any)) != io.EOF {
		fail(w, http.StatusBadRequest, "Invalid request body.")
		return false
	}
	return true
}

func writePayment(w http.ResponseWriter, data any, err error) {
	switch {
	case err == nil:
		writeJSON(w, http.StatusOK, data)
	case errors.Is(err, payment.ErrInvalid):
		fail(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, payment.ErrNotFound):
		fail(w, http.StatusNotFound, err.Error())
	case errors.Is(err, payment.ErrConflict):
		fail(w, http.StatusConflict, err.Error())
	default:
		log.Printf("Payment storage: %v", err)
		fail(w, http.StatusServiceUnavailable, "Payment storage unavailable.")
	}
}

func fail(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func requiredEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("Missing environment variable %s", key)
	}
	return value
}
