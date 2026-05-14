-- ============================================================
-- WeddingBoy — Editor de Pokédex (descripciones en español)
-- Tabla de overrides para los textos de flavor de la Pokédex.
-- pokemon_id = índice 1..151 (Gen I).
-- Si un override es "" (cadena vacía) se considera "ocultar texto".
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS pokedex_flavor (
  pokemon_id   INT  PRIMARY KEY,
  flavor_es    TEXT NOT NULL DEFAULT '',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pokedex_flavor ENABLE ROW LEVEL SECURITY;

-- Lectura pública (el juego lo consume sin auth)
DROP POLICY IF EXISTS "pokedex_flavor_read_all" ON pokedex_flavor;
CREATE POLICY "pokedex_flavor_read_all" ON pokedex_flavor
  FOR SELECT USING (true);
