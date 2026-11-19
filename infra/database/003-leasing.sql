CREATE TABLE IF NOT EXISTS lease_plots (
    id text PRIMARY KEY,
    owner_subject text NOT NULL,
    location text NOT NULL
);
CREATE TABLE IF NOT EXISTS lease_requests (
    plot_id text NOT NULL REFERENCES lease_plots(id),
    farmer_subject text NOT NULL,
    starts_on date NOT NULL,
    status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    decided_at timestamptz,
    PRIMARY KEY (plot_id, farmer_subject)
);
CREATE UNIQUE INDEX IF NOT EXISTS lease_one_approved_per_plot
    ON lease_requests(plot_id) WHERE status = 'Approved';
