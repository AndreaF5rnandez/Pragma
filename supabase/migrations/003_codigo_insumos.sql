-- ─── Código de insumos ──────────────────────────────────────────────────────
-- Agrega un código identificatorio a cada insumo para poder filtrar/buscar más
-- fácilmente. Es texto libre y editable; el front sugiere un prefijo según el
-- tipo (M- material, MO- mano de obra, E- equipo) pero la categoría real sigue
-- viviendo en la columna `tipo`, no en el código.
ALTER TABLE insumos
  ADD COLUMN IF NOT EXISTS codigo text;

-- Índice para acelerar la búsqueda por código (case-insensitive).
CREATE INDEX IF NOT EXISTS idx_insumos_codigo ON insumos (lower(codigo));
