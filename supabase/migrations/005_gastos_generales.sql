-- Agregar costo financiero a obras (mismo patrón que los otros porcentajes)
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS costo_financiero_pct numeric(5, 2) NOT NULL DEFAULT 0;

-- Tabla de líneas de gastos generales por obra
CREATE TABLE gastos_generales (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id    uuid        NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  concepto   text        NOT NULL,
  monto      numeric(14, 2) NOT NULL DEFAULT 0 CHECK (monto >= 0),
  es_predefinido boolean NOT NULL DEFAULT false,
  orden      integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_gastos_generales_obra_id ON gastos_generales(obra_id);

CREATE TRIGGER set_gastos_generales_updated_at
BEFORE UPDATE ON gastos_generales
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
