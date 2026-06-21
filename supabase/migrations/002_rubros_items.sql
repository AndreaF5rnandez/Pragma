-- ─── Paso 1: Eliminar tabla mediciones actual ──────────────────────────────
-- CASCADE borra también sus índices y triggers
DROP TABLE IF EXISTS mediciones CASCADE;


-- ─── Paso 2: Tabla rubros ───────────────────────────────────────────────────
-- Categoría de trabajo dentro de una obra (ej: "Estructura", "Mampostería")
CREATE TABLE rubros (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id    uuid        NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nombre     text        NOT NULL,
  orden      integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- ─── Paso 3: Tabla items ────────────────────────────────────────────────────
-- Ítem de trabajo dentro de un rubro; apunta a la receta que define su precio
-- ON DELETE RESTRICT en receta_id: no se puede eliminar una receta con ítems activos
CREATE TABLE items (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rubro_id   uuid        NOT NULL REFERENCES rubros(id)   ON DELETE CASCADE,
  receta_id  uuid        NOT NULL REFERENCES recetas(id)  ON DELETE RESTRICT,
  descripcion text       NOT NULL,
  orden      integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- ─── Paso 4: Nueva tabla mediciones ────────────────────────────────────────
-- Fila de medición dentro de un ítem (estilo planilla de cómputo métrico)
-- cantidad_calculada = n × largo × ancho × alto (nullables reemplazados por 1)
CREATE TABLE mediciones (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id             uuid          NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  descripcion         text          NOT NULL,
  n                   numeric(14,4) NOT NULL DEFAULT 1,
  largo               numeric(14,4),
  ancho               numeric(14,4),
  alto                numeric(14,4),
  cantidad_calculada  numeric(18,4) GENERATED ALWAYS AS (
    n * COALESCE(largo, 1) * COALESCE(ancho, 1) * COALESCE(alto, 1)
  ) STORED,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now()
);


-- ─── Paso 5: Índices ────────────────────────────────────────────────────────
CREATE INDEX idx_rubros_obra_id     ON rubros(obra_id);
CREATE INDEX idx_items_rubro_id     ON items(rubro_id);
CREATE INDEX idx_items_receta_id    ON items(receta_id);
CREATE INDEX idx_mediciones_item_id ON mediciones(item_id);


-- ─── Triggers updated_at ────────────────────────────────────────────────────
-- set_updated_at() ya fue definida en 001_initial_schema.sql
CREATE TRIGGER set_rubros_updated_at
BEFORE UPDATE ON rubros
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_mediciones_updated_at
BEFORE UPDATE ON mediciones
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
