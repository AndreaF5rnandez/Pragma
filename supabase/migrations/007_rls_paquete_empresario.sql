-- ================================================================
-- 007_rls_paquete_empresario.sql — Políticas RLS del Paquete Empresario
-- Ejecutar en Supabase SQL Editor
--
-- gastos_generales y paquete_empresario quedaron con RLS activo pero SIN
-- políticas, así que el usuario autenticado no podía insertar (error 42501).
-- Se replica EXACTAMENTE el mismo mecanismo que rubros (vía obras → user_id):
-- ambas tablas tienen obra_id directo, igual que rubros.
-- Solo políticas RLS: no toca tablas ni columnas.
-- ================================================================

-- ── Activar RLS (idempotente: si ya estaba activo, no cambia nada) ──
ALTER TABLE gastos_generales   ENABLE ROW LEVEL SECURITY;
ALTER TABLE paquete_empresario ENABLE ROW LEVEL SECURITY;

-- ── Políticas para gastos_generales (vía obras) ─────────────────
CREATE POLICY "gastos_generales_select" ON gastos_generales FOR SELECT USING (
  EXISTS (SELECT 1 FROM obras WHERE obras.id = gastos_generales.obra_id AND obras.user_id = auth.uid())
);
CREATE POLICY "gastos_generales_insert" ON gastos_generales FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM obras WHERE obras.id = gastos_generales.obra_id AND obras.user_id = auth.uid())
);
CREATE POLICY "gastos_generales_update" ON gastos_generales FOR UPDATE USING (
  EXISTS (SELECT 1 FROM obras WHERE obras.id = gastos_generales.obra_id AND obras.user_id = auth.uid())
);
CREATE POLICY "gastos_generales_delete" ON gastos_generales FOR DELETE USING (
  EXISTS (SELECT 1 FROM obras WHERE obras.id = gastos_generales.obra_id AND obras.user_id = auth.uid())
);

-- ── Políticas para paquete_empresario (vía obras) ───────────────
CREATE POLICY "paquete_empresario_select" ON paquete_empresario FOR SELECT USING (
  EXISTS (SELECT 1 FROM obras WHERE obras.id = paquete_empresario.obra_id AND obras.user_id = auth.uid())
);
CREATE POLICY "paquete_empresario_insert" ON paquete_empresario FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM obras WHERE obras.id = paquete_empresario.obra_id AND obras.user_id = auth.uid())
);
CREATE POLICY "paquete_empresario_update" ON paquete_empresario FOR UPDATE USING (
  EXISTS (SELECT 1 FROM obras WHERE obras.id = paquete_empresario.obra_id AND obras.user_id = auth.uid())
);
CREATE POLICY "paquete_empresario_delete" ON paquete_empresario FOR DELETE USING (
  EXISTS (SELECT 1 FROM obras WHERE obras.id = paquete_empresario.obra_id AND obras.user_id = auth.uid())
);
