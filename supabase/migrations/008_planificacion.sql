-- ================================================================
-- 008_planificacion.sql — Esquema de Planificación de Obras
-- Ejecutar en Supabase SQL Editor
--
-- Agrega la tabla planificacion para registrar el avance porcentual
-- de cada ítem por mes, y asegura que obras tenga la columna plazo_meses.
-- ================================================================

-- ── 1. Garantizar que obras tenga plazo_meses (idempotente) ─────
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS plazo_meses integer;

-- ── 2. Tabla planificacion ──────────────────────────────────────
-- Registra qué porcentaje de avance planificado tiene cada ítem en cada mes.
-- mes es un índice relativo (1 = primer mes de la obra, 2 = segundo, etc.)
-- No es una fecha para permitir que la planificación sea independiente de cuándo se inicia.
CREATE TABLE planificacion (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid    NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  mes        integer NOT NULL,
  pct_plan   numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, mes),
  CHECK (mes > 0),
  CHECK (pct_plan >= 0 AND pct_plan <= 100)
);

-- ── Índice para búsquedas por item ──────────────────────────────
CREATE INDEX idx_planificacion_item_id ON planificacion(item_id);

-- ── RLS desactivado, igual que items y mediciones ────────────────
ALTER TABLE planificacion DISABLE ROW LEVEL SECURITY;

-- ── Trigger para updated_at ────────────────────────────────────
-- set_updated_at() ya fue definida en 001_initial_schema.sql
CREATE TRIGGER set_planificacion_updated_at
BEFORE UPDATE ON planificacion
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
