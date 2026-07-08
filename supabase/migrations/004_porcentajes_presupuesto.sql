-- ─── Porcentajes de presupuesto configurables por obra ─────────────────────
-- Gastos generales, beneficio e impuestos dejan de estar hardcodeados en el
-- endpoint de presupuesto y pasan a vivir por obra, editables desde la UI.
-- Los defaults replican los valores que estaban fijos en el código.
ALTER TABLE obras
  ADD COLUMN IF NOT EXISTS gastos_generales_pct numeric(5, 2) NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS beneficio_pct         numeric(5, 2) NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS impuestos_pct         numeric(5, 2) NOT NULL DEFAULT 21;
