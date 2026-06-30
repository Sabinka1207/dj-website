-- Enable Row Level Security on all tables.
-- The backend connects via the postgres superuser (JDBC), which bypasses RLS,
-- so no policies are needed — this only blocks direct Supabase REST API access.
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE unavailable_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mix_play_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mix_download_events ENABLE ROW LEVEL SECURITY;
