CREATE TABLE error_log (
    id          BIGSERIAL PRIMARY KEY,
    occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
    error_type  VARCHAR(255) NOT NULL,
    message     TEXT,
    method      VARCHAR(10),
    uri         TEXT,
    ip          VARCHAR(64),
    user_agent  TEXT,
    stack_trace TEXT
);

CREATE INDEX idx_error_log_occurred_at ON error_log(occurred_at DESC);
