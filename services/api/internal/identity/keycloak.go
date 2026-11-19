package identity

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"time"
)

const (
	APIClient = "agritech-api"
	WebClient = "agritech-web"
	SuperAdmin = "super_admin"
	Auditor = "auditor"
)

var ErrInvalidToken = errors.New("invalid access token")

type Principal struct {
	Subject string `json:"sub"`
	Username string `json:"preferred_username"`
	Roles []string `json:"roles"`
}

func (p Principal) HasRole(role string) bool {
	return slices.Contains(p.Roles, role)
}

type Keycloak struct {
	Issuer string
	InternalRealm string
	Secret string
	Client *http.Client
}

func (k Keycloak) Authenticate(ctx context.Context, header string) (Principal, error) {
	scheme, token, ok := strings.Cut(header, " ")
	if !ok || !strings.EqualFold(scheme, "Bearer") || token == "" {
		return Principal{}, ErrInvalidToken
	}

	form := url.Values{"token": {token}, "token_type_hint": {"access_token"}}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, k.InternalRealm+"/protocol/openid-connect/token/introspect", strings.NewReader(form.Encode()))
	if err != nil {
		return Principal{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(APIClient, k.Secret)
	resp, err := k.Client.Do(req)
	if err != nil {
		return Principal{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return Principal{}, fmt.Errorf("identity provider returned %d", resp.StatusCode)
	}

	var claims struct {
		Active bool `json:"active"`
		Issuer string `json:"iss"`
		Subject string `json:"sub"`
		Username string `json:"preferred_username"`
		ClientID string `json:"client_id"`
		Type string `json:"typ"`
		Expires int64 `json:"exp"`
		RealmAccess struct {
			Roles []string `json:"roles"`
		} `json:"realm_access"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&claims); err != nil {
		return Principal{}, err
	}
	if !claims.Active || claims.Issuer != k.Issuer || claims.Subject == "" ||
		claims.ClientID != WebClient || claims.Type != "Bearer" || claims.Expires <= time.Now().Unix() {
		return Principal{}, ErrInvalidToken
	}

	roles := make([]string, 0, 3)
	for _, role := range claims.RealmAccess.Roles {
		switch role {
		case SuperAdmin, Auditor, "stakeholder", "farmer", "landowner":
			roles = append(roles, role)
		}
	}
	return Principal{Subject: claims.Subject, Username: claims.Username, Roles: roles}, nil
}
