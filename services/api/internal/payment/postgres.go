package payment

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
)

type Postgres struct {
	DB *sql.DB
}

const fields = "id, reference, amount_minor, status, created_at"

func (p Postgres) List(ctx context.Context) ([]Escrow, error) {
	rows, err := p.DB.QueryContext(ctx, `
		SELECT `+fields+`, COALESCE((
			SELECT jsonb_agg(jsonb_build_object('status', e.status, 'actor', e.actor,
				'occurredAt', e.occurred_at) ORDER BY e.id)
			FROM payment.events e WHERE e.escrow_id = s.id
		), '[]'::jsonb)
		FROM payment.escrows s ORDER BY created_at DESC, id DESC LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Escrow, 0)
	for rows.Next() {
		var item Escrow
		var events []byte
		if err := rows.Scan(&item.ID, &item.Reference, &item.AmountMinor, &item.Status, &item.CreatedAt, &events); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(events, &item.Events); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (p Postgres) Create(ctx context.Context, reference string, amount int64, actor string) (Escrow, error) {
	tx, err := p.DB.BeginTx(ctx, nil)
	if err != nil {
		return Escrow{}, err
	}
	defer tx.Rollback()

	row := tx.QueryRowContext(ctx, `
		INSERT INTO payment.escrows (reference, amount_minor, status, created_by)
		VALUES ($1, $2, 'held', $3) ON CONFLICT (reference) DO NOTHING RETURNING `+fields, reference, amount, actor)
	item, err := scanEscrow(row)
	if errors.Is(err, sql.ErrNoRows) {
		row = tx.QueryRowContext(ctx, "SELECT "+fields+" FROM payment.escrows WHERE reference = $1 AND amount_minor = $2 AND created_by = $3", reference, amount, actor)
		item, err = scanEscrow(row)
		if errors.Is(err, sql.ErrNoRows) {
			return Escrow{}, ErrConflict
		}
	} else if err == nil {
		err = insertEvent(ctx, tx, item.ID, Held, actor)
	}
	if err != nil {
		return Escrow{}, err
	}
	return item, tx.Commit()
}

func (p Postgres) Transition(ctx context.Context, id string, target Status, actor string) (Escrow, error) {
	tx, err := p.DB.BeginTx(ctx, nil)
	if err != nil {
		return Escrow{}, err
	}
	defer tx.Rollback()

	row := tx.QueryRowContext(ctx, "SELECT "+fields+" FROM payment.escrows WHERE id = $1 FOR UPDATE", id)
	item, err := scanEscrow(row)
	if errors.Is(err, sql.ErrNoRows) {
		return Escrow{}, ErrNotFound
	}
	if err != nil {
		return Escrow{}, err
	}
	if item.Status == target {
		return item, tx.Commit()
	}
	if item.Status != Held {
		return Escrow{}, ErrConflict
	}
	if _, err := tx.ExecContext(ctx, "UPDATE payment.escrows SET status = $2 WHERE id = $1", id, target); err != nil {
		return Escrow{}, err
	}
	if err := insertEvent(ctx, tx, id, target, actor); err != nil {
		return Escrow{}, err
	}

	item.Status = target
	return item, tx.Commit()
}

func scanEscrow(row *sql.Row) (Escrow, error) {
	var item Escrow
	err := row.Scan(&item.ID, &item.Reference, &item.AmountMinor, &item.Status, &item.CreatedAt)
	return item, err
}

func insertEvent(ctx context.Context, tx *sql.Tx, id string, status Status, actor string) error {
	_, err := tx.ExecContext(ctx, "INSERT INTO payment.events (escrow_id, status, actor) VALUES ($1, $2, $3)", id, status, actor)
	return err
}
