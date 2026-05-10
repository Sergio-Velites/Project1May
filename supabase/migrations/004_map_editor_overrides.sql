-- ============================================================
-- WeddingBoy — Map Editor: añadir columna `overrides` JSONB
-- Agrupa: texts, items, gifts, fences, grass, pokemonCenter, pc, store, recoverLocation
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

ALTER TABLE map_editor_data
  ADD COLUMN IF NOT EXISTS overrides JSONB NOT NULL DEFAULT '{}';
