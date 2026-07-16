-- ================================================================
-- 006_paquete_empresario.sql — Capa "Paquete Empresario"
-- Ejecutar en Supabase SQL Editor
--
-- Agrega el plazo de obra, rehace gastos_generales con el modelo
-- categoría / modalidad / meses, y crea paquete_empresario con los
-- porcentajes del cierre (costo financiero, beneficio, IVA, rentas).
-- ================================================================

-- ── 1. Plazo de obra en meses ───────────────────────────────────
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS plazo_meses integer;

-- ── 2. Rehacer gastos_generales con el modelo del Paquete Empresario
-- La tabla anterior (concepto/monto/es_predefinido) solo tenía filas
-- semilla en 0, así que se reconstruye sin pérdida real de datos.
DROP TABLE IF EXISTS gastos_generales CASCADE;

CREATE TABLE gastos_generales (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id     uuid           NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  categoria   text           NOT NULL CHECK (categoria IN ('GGDOO', 'GGDOE', 'GGI')),
  descripcion text           NOT NULL,
  modalidad   text           NOT NULL CHECK (modalidad IN ('mensual', 'unico')),
  monto       numeric(14, 2) NOT NULL DEFAULT 0 CHECK (monto >= 0),
  meses       integer,                              -- solo se usa si modalidad = 'mensual'
  orden       integer        NOT NULL DEFAULT 0,
  created_at  timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_gastos_generales_obra_id ON gastos_generales(obra_id);

-- RLS desactivado, igual que rubros / items / mediciones.
ALTER TABLE gastos_generales DISABLE ROW LEVEL SECURITY;

-- ── 3. Porcentajes del cierre empresario, una fila por obra ──────
-- Los porcentajes se guardan como enteros de porcentaje (5 = 5%),
-- no como fracciones.
CREATE TABLE paquete_empresario (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id          uuid          NOT NULL UNIQUE REFERENCES obras(id) ON DELETE CASCADE,
  costo_financiero numeric(6, 3) NOT NULL DEFAULT 5,
  beneficio        numeric(6, 3) NOT NULL DEFAULT 10,
  iva              numeric(6, 3) NOT NULL DEFAULT 21,
  rentas           numeric(6, 3) NOT NULL DEFAULT 2.75,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

-- RLS desactivado, igual que rubros / items / mediciones.
ALTER TABLE paquete_empresario DISABLE ROW LEVEL SECURITY;
