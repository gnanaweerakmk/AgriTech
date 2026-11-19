CREATE SCHEMA IF NOT EXISTS payment;

CREATE TABLE payment.escrows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference varchar(80) NOT NULL UNIQUE,
    amount_minor bigint NOT NULL CHECK (amount_minor BETWEEN 1 AND 100000000000),
    status text NOT NULL CHECK (status IN ('held', 'released', 'refunded')),
    created_by text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payment.events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    escrow_id uuid NOT NULL REFERENCES payment.escrows(id),
    status text NOT NULL CHECK (status IN ('held', 'released', 'refunded')),
    actor text NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payment_events_escrow_idx ON payment.events (escrow_id, id);
