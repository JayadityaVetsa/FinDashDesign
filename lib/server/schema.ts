// Idempotent schema initialization is serialized across Vercel cold starts.
export const schemaStatements = [
  `SELECT pg_advisory_xact_lock(76042026)`,
  `CREATE TABLE IF NOT EXISTS findash_users (
    id text PRIMARY KEY, email text NOT NULL UNIQUE, password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS findash_profiles (
    id text PRIMARY KEY REFERENCES findash_users(id) ON DELETE CASCADE,
    finnhub_key text, theme text NOT NULL DEFAULT 'dark', sidebar_collapsed boolean NOT NULL DEFAULT false,
    active_dashboard_id text, onboarding_completed boolean NOT NULL DEFAULT false,
    portfolio_holdings jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS findash_dashboards (
    id text PRIMARY KEY, user_id text NOT NULL REFERENCES findash_users(id) ON DELETE CASCADE,
    name text NOT NULL, widgets jsonb NOT NULL DEFAULT '[]'::jsonb, position integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS findash_dashboards_user ON findash_dashboards(user_id)`,
  `CREATE TABLE IF NOT EXISTS findash_sessions (
    token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES findash_users(id) ON DELETE CASCADE,
    expires_at bigint NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS findash_sessions_expiry ON findash_sessions(expires_at)`,
  `CREATE TABLE IF NOT EXISTS findash_auth_attempts (
    email text PRIMARY KEY, count integer NOT NULL, window_start bigint NOT NULL
  )`,
  `CREATE OR REPLACE FUNCTION findash_initialize_workspace(uid text, seeds jsonb, api_key text DEFAULT NULL)
    RETURNS SETOF findash_dashboards LANGUAGE plpgsql SET search_path = public AS $$
    DECLARE board jsonb; idx integer := 0; active text;
    BEGIN
      PERFORM 1 FROM findash_profiles WHERE id=uid FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found.'; END IF;
      IF NOT EXISTS (SELECT 1 FROM findash_dashboards WHERE user_id=uid) THEN
        FOR board IN SELECT value FROM jsonb_array_elements(seeds) LOOP
          INSERT INTO findash_dashboards(id,user_id,name,widgets,position)
            VALUES (gen_random_uuid()::text,uid,board->>'name',board->'widgets',idx);
          idx := idx + 1;
        END LOOP;
      END IF;
      SELECT id INTO active FROM findash_dashboards WHERE user_id=uid ORDER BY position,created_at,id LIMIT 1;
      IF active IS NULL THEN RAISE EXCEPTION 'Choose a starter dashboard.'; END IF;
      UPDATE findash_profiles p SET active_dashboard_id=CASE WHEN EXISTS (
        SELECT 1 FROM findash_dashboards d WHERE d.id=p.active_dashboard_id AND d.user_id=uid
      ) THEN p.active_dashboard_id ELSE active END,
        finnhub_key=coalesce(api_key,p.finnhub_key),
        onboarding_completed=CASE WHEN api_key IS NOT NULL THEN true ELSE p.onboarding_completed END,
        updated_at=now() WHERE p.id=uid;
      RETURN QUERY SELECT d.* FROM findash_dashboards d WHERE d.user_id=uid ORDER BY d.position,d.created_at,d.id;
    END; $$`,
  `CREATE OR REPLACE FUNCTION findash_delete_dashboard(uid text, board_id text)
    RETURNS boolean LANGUAGE plpgsql SET search_path = public AS $$
    DECLARE next_id text;
    BEGIN
      PERFORM 1 FROM findash_profiles WHERE id=uid FOR UPDATE;
      IF NOT EXISTS (SELECT 1 FROM findash_dashboards WHERE id=board_id AND user_id=uid) THEN
        RAISE EXCEPTION 'Dashboard not found.';
      END IF;
      SELECT id INTO next_id FROM findash_dashboards WHERE user_id=uid AND id<>board_id ORDER BY position,created_at,id LIMIT 1;
      IF next_id IS NULL THEN RAISE EXCEPTION 'Keep at least one dashboard.'; END IF;
      DELETE FROM findash_dashboards WHERE id=board_id AND user_id=uid;
      UPDATE findash_profiles SET active_dashboard_id=next_id,updated_at=now()
        WHERE id=uid AND active_dashboard_id=board_id;
      RETURN true;
    END; $$`,
];
