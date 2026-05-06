-- ============================================================
-- WeddingBoy — Añadir campo attended a rsvp
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Añadir columna attended (default true = todos los RSVP previos asisten)
ALTER TABLE rsvp
  ADD COLUMN IF NOT EXISTS attended BOOLEAN NOT NULL DEFAULT true;

-- 2. Reemplazar upsert_rsvp con nueva firma que incluye p_attended
--    (PostgreSQL no permite añadir parámetros con CREATE OR REPLACE sin drop previo)
DROP FUNCTION IF EXISTS upsert_rsvp(UUID, TEXT, TEXT, INT, TEXT, BOOLEAN, TEXT, BOOLEAN);

CREATE FUNCTION upsert_rsvp(
  p_user_id      UUID,
  p_player_name  TEXT,
  p_companion    TEXT,
  p_children     INT,
  p_allergies    TEXT,
  p_bus_outbound BOOLEAN,
  p_bus_return   TEXT,
  p_preboda      BOOLEAN,
  p_attended     BOOLEAN DEFAULT true
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO rsvp (
    user_id, player_name, companion, children, allergies,
    bus_outbound, bus_return, preboda, attended, updated_at
  )
  VALUES (
    p_user_id, p_player_name, p_companion, p_children, p_allergies,
    p_bus_outbound, p_bus_return, p_preboda, p_attended, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    player_name   = EXCLUDED.player_name,
    companion     = EXCLUDED.companion,
    children      = EXCLUDED.children,
    allergies     = EXCLUDED.allergies,
    bus_outbound  = EXCLUDED.bus_outbound,
    bus_return    = EXCLUDED.bus_return,
    preboda       = EXCLUDED.preboda,
    attended      = EXCLUDED.attended,
    updated_at    = NOW();
$$;

-- ============================================================
-- QUERY DE LIMPIEZA TOTAL (¡PELIGRO! Borra TODOS los datos)
-- Ejecutar SOLO para resetear la base de datos desde cero:
-- ============================================================
-- DELETE FROM saves;
-- DELETE FROM rsvp;
-- DELETE FROM webauthn_credentials;
-- DELETE FROM webauthn_challenges;
-- DELETE FROM wedding_users;
