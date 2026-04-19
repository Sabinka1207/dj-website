CREATE TABLE mix_play_events (
    id BIGSERIAL PRIMARY KEY,
    mix_id BIGINT NOT NULL,
    visitor_id VARCHAR(64) NOT NULL,
    seconds_played INT NOT NULL,
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mix_download_events (
    id BIGSERIAL PRIMARY KEY,
    mix_id BIGINT NOT NULL,
    visitor_id VARCHAR(64) NOT NULL,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mix_play_events_mix_id ON mix_play_events(mix_id);
CREATE INDEX idx_mix_download_events_mix_id ON mix_download_events(mix_id);
