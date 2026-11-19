package payment

import (
	"context"
	"errors"
	"regexp"
	"time"
)

type Status string

const (
	Held Status = "held"
	Released Status = "released"
	Refunded Status = "refunded"
)

var (
	ErrInvalid = errors.New("use a 1–80 character reference (letters, numbers, hyphens, or underscores) and a valid amount in cents")
	ErrNotFound = errors.New("escrow not found")
	ErrConflict = errors.New("this reference or escrow already has a conflicting operation")
	referencePattern = regexp.MustCompile("^[A-Za-z0-9_-]{1,80}$")
)

type Escrow struct {
	ID string `json:"id"`
	Reference string `json:"reference"`
	AmountMinor int64 `json:"amountMinor"`
	Status Status `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	Events []Event `json:"events,omitempty"`
}

type Event struct {
	Status Status `json:"status"`
	Actor string `json:"actor"`
	OccurredAt time.Time `json:"occurredAt"`
}

type Repository interface {
	List(context.Context) ([]Escrow, error)
	Create(context.Context, string, int64, string) (Escrow, error)
	Transition(context.Context, string, Status, string) (Escrow, error)
}

type Service struct {
	Repository Repository
}

func (s Service) List(ctx context.Context) ([]Escrow, error) {
	return s.Repository.List(ctx)
}

func (s Service) Hold(ctx context.Context, reference string, amount int64, actor string) (Escrow, error) {
	if !referencePattern.MatchString(reference) || amount < 1 || amount > 100000000000 {
		return Escrow{}, ErrInvalid
	}
	return s.Repository.Create(ctx, reference, amount, actor)
}

func (s Service) Close(ctx context.Context, id string, status Status, actor string) (Escrow, error) {
	if status != Released && status != Refunded {
		return Escrow{}, ErrInvalid
	}
	return s.Repository.Transition(ctx, id, status, actor)
}
