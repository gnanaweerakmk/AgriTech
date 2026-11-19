CREATE TABLE IF NOT EXISTS regional_demand_limits (
    region text NOT NULL,
    crop text NOT NULL,
    limit_kg integer NOT NULL CHECK (limit_kg >= 0),
    updated_by text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (region, crop)
);
