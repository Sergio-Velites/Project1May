-- ============================================================
-- WeddingBoy — Schema completo
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Usuarios anónimos (sin email, sin contraseña, sin PII)
CREATE TABLE IF NOT EXISTS wedding_users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

-- 2. Credenciales WebAuthn (una por dispositivo/passkey)
--    Un mismo usuario puede tener varios dispositivos registrados
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  credential_id  TEXT        PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES wedding_users(id) ON DELETE CASCADE,
  public_key     TEXT        NOT NULL,  -- COSE public key en base64url
  sign_count     BIGINT      NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON webauthn_credentials(user_id);

-- 3. Challenges WebAuthn temporales (expiran en 5 min, anti-replay)
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge   TEXT        NOT NULL UNIQUE,
  user_id     UUID        REFERENCES wedding_users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  used        BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_challenges_expires ON webauthn_challenges(expires_at);

-- 4. Partidas guardadas (una por usuario)
CREATE TABLE IF NOT EXISTS saves (
  user_id     UUID        PRIMARY KEY REFERENCES wedding_users(id) ON DELETE CASCADE,
  game_state  JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- Solo las Edge Functions (service_role) pueden acceder.
-- El cliente nunca llama a estas tablas directamente.
-- ============================================================

ALTER TABLE wedding_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_challenges  ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves                ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Función helper para upsert de partida
-- ============================================================

CREATE OR REPLACE FUNCTION upsert_save(
  p_user_id    UUID,
  p_game_state JSONB
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO saves (user_id, game_state, updated_at)
  VALUES (p_user_id, p_game_state, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    game_state = EXCLUDED.game_state,
    updated_at = NOW();
$$;

-- ============================================================
-- Limpieza de challenges expirados
-- En free tier se llama desde las Edge Functions.
-- En Pro tier se puede programar con pg_cron:
--   SELECT cron.schedule('cleanup', '*/15 * * * *', 'SELECT cleanup_webauthn_challenges()');
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_webauthn_challenges()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM webauthn_challenges
  WHERE expires_at < NOW() OR used = TRUE;
$$;
