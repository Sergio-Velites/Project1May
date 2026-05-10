-- ============================================================
-- WeddingBoy — bus_outbound de BOOLEAN a TEXT (parada de recogida)
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
--
-- Cambios:
--   - bus_outbound: BOOLEAN  →  TEXT  ('none' | 'club-tenis' | 'pio-xii' | 'ardoi')
--   - bus_return: ahora '01:30' sustituye al antiguo '1:45'
--   - upsert_rsvp: nueva firma con p_bus_outbound TEXT
-- ============================================================

-- 1. Convertir bus_outbound a TEXT
--    'true' → 'club-tenis' (heurística por defecto), 'false' → 'none'
ALTER TABLE rsvp
  ALTER COLUMN bus_outbound TYPE TEXT
  USING (CASE WHEN bus_outbound THEN 'club-tenis' ELSE 'none' END);

ALTER TABLE rsvp
  ALTER COLUMN bus_outbound SET DEFAULT 'none';

-- 2. Migrar valores antiguos de bus_return ('1:45' → '01:30')
UPDATE rsvp SET bus_return = '01:30' WHERE bus_return = '1:45';

-- 3. Reemplazar upsert_rsvp con la nueva firma (p_bus_outbound TEXT)
DROP FUNCTION IF EXISTS upsert_rsvp(UUID, TEXT, TEXT, INT, TEXT, BOOLEAN, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS upsert_rsvp(UUID, TEXT, TEXT, INT, TEXT, BOOLEAN, TEXT, BOOLEAN, BOOLEAN);

CREATE FUNCTION upsert_rsvp(
  p_user_id      UUID,
  p_player_name  TEXT,
  p_companion    TEXT,
  p_children     INT,
  p_allergies    TEXT,
  p_bus_outbound TEXT,
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
