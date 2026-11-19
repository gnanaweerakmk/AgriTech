package main

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"

	"agritech.local/api/internal/identity"
	"github.com/lib/pq"
)

type leaseRow struct {
	Plot string `json:"plot"`
	Location string `json:"location"`
	Farmer string `json:"farmer"`
	Start string `json:"start"`
	Status string `json:"status"`
	Owned bool `json:"owned"`
}

func registerLeaseRoutes(mux *http.ServeMux, auth authenticator, db *sql.DB) {
	handle := func(pattern string, next func(http.ResponseWriter, *http.Request, identity.Principal)) {
		mux.HandleFunc(pattern, func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Cache-Control", "no-store")
			user, err := auth.Authenticate(r.Context(), r.Header.Get("Authorization"))
			switch {
			case errors.Is(err, identity.ErrInvalidToken):
				fail(w, http.StatusUnauthorized, "Sign in to continue.")
			case err != nil:
				fail(w, http.StatusServiceUnavailable, "Identity service unavailable.")
			case user.HasRole("farmer"), user.HasRole("landowner"):
				next(w, r, user)
			default:
				fail(w, http.StatusForbidden, "A farmer or landowner role is required.")
			}
		})
	}

	handle("GET /v1/leasing/workspace", func(w http.ResponseWriter, r *http.Request, user identity.Principal) {
		rows, err := db.QueryContext(r.Context(), `
			SELECT p.id, p.location, COALESCE(l.farmer_subject, ''), COALESCE(l.starts_on::text, ''), COALESCE(l.status, ''), p.owner_subject = $1
			FROM lease_plots p LEFT JOIN lease_requests l ON l.plot_id = p.id AND
				(($2 AND p.owner_subject = $1) OR ($3 AND l.farmer_subject = $1))
			WHERE ($2 AND p.owner_subject = $1) OR ($3 AND p.owner_subject <> $1)
			ORDER BY p.id, l.starts_on, l.farmer_subject`, user.Subject, user.HasRole("landowner"), user.HasRole("farmer"))
		if err != nil {
			fail(w, http.StatusServiceUnavailable, "Leasing data unavailable.")
			return
		}
		defer rows.Close()
		items := []leaseRow{}
		for rows.Next() {
			var item leaseRow
			if err := rows.Scan(&item.Plot, &item.Location, &item.Farmer, &item.Start, &item.Status, &item.Owned); err != nil {
				fail(w, http.StatusServiceUnavailable, "Leasing data unavailable.")
				return
			}
			items = append(items, item)
		}
		if rows.Err() != nil {
			fail(w, http.StatusServiceUnavailable, "Leasing data unavailable.")
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"roles": user.Roles, "subject": user.Subject, "rows": items})
	})

	handle("POST /v1/leasing/workspace", func(w http.ResponseWriter, r *http.Request, user identity.Principal) {
		var body struct {
			Action string `json:"action"`
			Plot string `json:"plot"`
			Location string `json:"location"`
			Farmer string `json:"farmer"`
			Start string `json:"start"`
		}
		if !decode(w, r, &body) { return }
		body.Plot = strings.ToUpper(strings.TrimSpace(body.Plot))
		body.Location = strings.TrimSpace(body.Location)
		if body.Plot == "" || len(body.Plot) > 40 {
			fail(w, http.StatusBadRequest, "Enter a plot reference of up to 40 bytes.")
			return
		}
		var result sql.Result
		var err error
		switch {
		case body.Action == "Publish" && user.HasRole("landowner") && body.Location != "" && len(body.Location) <= 160:
			result, err = db.ExecContext(r.Context(), "INSERT INTO lease_plots (id, owner_subject, location) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", body.Plot, user.Subject, body.Location)
		case body.Action == "Request" && user.HasRole("farmer"):
			date, parseErr := time.Parse("2006-01-02", body.Start)
			if parseErr != nil {
				fail(w, http.StatusBadRequest, "Enter a valid start date.")
				return
			}
			result, err = db.ExecContext(r.Context(), `
				INSERT INTO lease_requests (plot_id, farmer_subject, starts_on)
				SELECT id, $2, $3 FROM lease_plots WHERE id = $1 AND owner_subject <> $2
				ON CONFLICT DO NOTHING`, body.Plot, user.Subject, date)
		case (body.Action == "Approved" || body.Action == "Rejected") && user.HasRole("landowner"):
			result, err = db.ExecContext(r.Context(), `
				UPDATE lease_requests l SET status = $4, decided_at = now()
				FROM lease_plots p WHERE p.id = l.plot_id AND p.id = $1 AND p.owner_subject = $2
					AND l.farmer_subject = $3 AND l.status = 'Pending'`, body.Plot, user.Subject, body.Farmer, body.Action)
		default:
			fail(w, http.StatusForbidden, "This action is unavailable for your role or input.")
			return
		}
		var conflict *pq.Error
		if errors.As(err, &conflict) && conflict.Code == "23505" {
			fail(w, http.StatusConflict, "A lease is already approved for this plot.")
			return
		}
		if err != nil {
			fail(w, http.StatusServiceUnavailable, "The lease change could not be saved.")
			return
		}
		count, err := result.RowsAffected()
		if err != nil || count != 1 {
			fail(w, http.StatusConflict, "The plot or request is unavailable, or the action was already recorded.")
			return
		}
		writeJSON(w, http.StatusOK, map[string]bool{"saved": true})
	})
}
