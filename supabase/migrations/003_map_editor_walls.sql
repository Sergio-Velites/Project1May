-- ============================================================
-- WeddingBoy — Map Editor: añadir soporte de walls
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

ALTER TABLE map_editor_data
  ADD COLUMN IF NOT EXISTS walls JSONB NOT NULL DEFAULT '{}';
