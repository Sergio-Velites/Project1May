-- ============================================================
-- WeddingBoy — RSVP table
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS rsvp (
  user_id       UUID        PRIMARY KEY REFERENCES wedding_users(id) ON DELETE CASCADE,
  player_name   TEXT        NOT NULL,
  companion     TEXT,                          -- NULL = viaja solo
  children      INT         NOT NULL DEFAULT 0,
  allergies     TEXT,                          -- NULL = sin alergias
  bus_outbound  BOOLEAN     NOT NULL DEFAULT false,
  bus_return    TEXT        NOT NULL DEFAULT 'none',  -- 'none' | '23:00' | '1:45'
  preboda       BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;

-- Función helper para upsert de RSVP
CREATE OR REPLACE FUNCTION upsert_rsvp(
  p_user_id      UUID,
  p_player_name  TEXT,
  p_companion    TEXT,
  p_children     INT,
  p_allergies    TEXT,
  p_bus_outbound BOOLEAN,
  p_bus_return   TEXT,
  p_preboda      BOOLEAN
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO rsvp (user_id, player_name, companion, children, allergies, bus_outbound, bus_return, preboda, updated_at)
  VALUES (p_user_id, p_player_name, p_companion, p_children, p_allergies, p_bus_outbound, p_bus_return, p_preboda, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    player_name   = EXCLUDED.player_name,
    companion     = EXCLUDED.companion,
    children      = EXCLUDED.children,
    allergies     = EXCLUDED.allergies,
    bus_outbound  = EXCLUDED.bus_outbound,
    bus_return    = EXCLUDED.bus_return,
    preboda       = EXCLUDED.preboda,
    updated_at    = NOW();
$$;
