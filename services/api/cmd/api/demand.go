package main

import (
	"database/sql"
	"agritech.local/api/internal/identity"
	"net/http"
	"strings"
	"unicode/utf8"
)

type demandLimit struct {
	Region  string `json:"region"`
	Crop    string `json:"crop"`
	LimitKG int    `json:"limitKg"`
}

func registerDemandRoutes(mux *http.ServeMux, auth authenticator, db *sql.DB) {
	mux.HandleFunc("GET /v1/governance/demand-limits", require(auth, false, func(w http.ResponseWriter, r *http.Request, _ identity.Principal) {
		rows, err := db.QueryContext(r.Context(), "SELECT region, crop, limit_kg FROM regional_demand_limits ORDER BY region, crop")
		if err != nil {
			fail(w, http.StatusServiceUnavailable, "Demand limits unavailable.")
			return
		}
		defer rows.Close()
		limits := []demandLimit{}
		for rows.Next() {
			var item demandLimit
			if err := rows.Scan(&item.Region, &item.Crop, &item.LimitKG); err != nil {
				fail(w, http.StatusServiceUnavailable, "Demand limits unavailable.")
				return
			}
			limits = append(limits, item)
		}
		if rows.Err() != nil {
			fail(w, http.StatusServiceUnavailable, "Demand limits unavailable.")
			return
		}
		writeJSON(w, http.StatusOK, limits)
	}))
	mux.HandleFunc("POST /v1/governance/demand-limits", require(auth, true, func(w http.ResponseWriter, r *http.Request, user identity.Principal) {
		var body struct {
			Region string `json:"region"`
			Crop string `json:"crop"`
			LimitKG *int `json:"limitKg"`
		}
		if !decode(w, r, &body) {
			return
		}
		region := strings.ToLower(strings.TrimSpace(body.Region))
		crop := strings.ToLower(strings.TrimSpace(body.Crop))
		if region == "" || crop == "" || utf8.RuneCountInString(region) > 80 || utf8.RuneCountInString(crop) > 80 ||
			body.LimitKG == nil || *body.LimitKG < 0 || *body.LimitKG > 1000000000 {
			fail(w, http.StatusBadRequest, "Enter a region, crop, and limit between 0 and 1,000,000,000 kg.")
			return
		}
		_, err := db.ExecContext(r.Context(), `
			INSERT INTO regional_demand_limits (region, crop, limit_kg, updated_by)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (region, crop) DO UPDATE
			SET limit_kg = EXCLUDED.limit_kg, updated_by = EXCLUDED.updated_by, updated_at = now()`,
			region, crop, *body.LimitKG, user.Subject)
		if err != nil {
			fail(w, http.StatusServiceUnavailable, "Unable to save the demand limit.")
			return
		}
		writeJSON(w, http.StatusOK, demandLimit{Region: region, Crop: crop, LimitKG: *body.LimitKG})
	}))
}
