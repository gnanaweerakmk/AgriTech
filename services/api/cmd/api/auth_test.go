package main

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"agritech.local/api/internal/identity"
)

type fixedAuth struct {
	principal identity.Principal
	err       error
}

func (f fixedAuth) Authenticate(context.Context, string) (identity.Principal, error) {
	return f.principal, f.err
}

func TestGovernanceRoleEnforcement(t *testing.T) {
	cases := []struct {
		name      string
		role      string
		adminOnly bool
		err       error
		want      int
	}{
		{name: "missing token", err: identity.ErrInvalidToken, want: http.StatusUnauthorized},
		{name: "provider unavailable", err: errors.New("provider offline"), want: http.StatusServiceUnavailable},
		{name: "stakeholder cannot read", role: "stakeholder", want: http.StatusForbidden},
		{name: "auditor can read", role: identity.Auditor, want: http.StatusNoContent},
		{name: "auditor cannot write", role: identity.Auditor, adminOnly: true, want: http.StatusForbidden},
		{name: "admin can write", role: identity.SuperAdmin, adminOnly: true, want: http.StatusNoContent},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			auth := fixedAuth{principal: identity.Principal{Roles: []string{tc.role}}, err: tc.err}
			handler := require(auth, tc.adminOnly, func(w http.ResponseWriter, _ *http.Request, _ identity.Principal) {
				w.WriteHeader(http.StatusNoContent)
			})
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/", nil))

			if response.Code != tc.want {
				t.Fatalf("got HTTP %d, want %d", response.Code, tc.want)
			}
		})
	}
}
