-- ================================================================
-- 003_rls.sql — Row Level Security por usuario
-- Ejecutar en Supabase SQL Editor
-- ================================================================

-- ── 1. Agregar user_id a tablas raíz ────────────────────────────

ALTER TABLE obras    ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE insumos  ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE recetas  ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- ── 2. Activar RLS en todas las tablas ──────────────────────────

ALTER TABLE obras           ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE receta_insumos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubros          ENABLE ROW LEVEL SECURITY;
ALTER TABLE items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE mediciones      ENABLE ROW LEVEL SECURITY;

-- ── 3. Políticas para obras ──────────────────────────────────────

CREATE POLICY "obras_select" ON obras FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "obras_insert" ON obras FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "obras_update" ON obras FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "obras_delete" ON obras FOR DELETE USING (auth.uid() = user_id);

-- ── 4. Políticas para insumos ────────────────────────────────────

CREATE POLICY "insumos_select" ON insumos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insumos_insert" ON insumos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "insumos_update" ON insumos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "insumos_delete" ON insumos FOR DELETE USING (auth.uid() = user_id);

-- ── 5. Políticas para recetas ────────────────────────────────────

CREATE POLICY "recetas_select" ON recetas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recetas_insert" ON recetas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recetas_update" ON recetas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recetas_delete" ON recetas FOR DELETE USING (auth.uid() = user_id);

-- ── 6. Políticas para receta_insumos (vía recetas) ──────────────

CREATE POLICY "receta_insumos_select" ON receta_insumos FOR SELECT USING (
  EXISTS (SELECT 1 FROM recetas WHERE recetas.id = receta_insumos.receta_id AND recetas.user_id = auth.uid())
);
CREATE POLICY "receta_insumos_insert" ON receta_insumos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM recetas WHERE recetas.id = receta_insumos.receta_id AND recetas.user_id = auth.uid())
);
CREATE POLICY "receta_insumos_delete" ON receta_insumos FOR DELETE USING (
  EXISTS (SELECT 1 FROM recetas WHERE recetas.id = receta_insumos.receta_id AND recetas.user_id = auth.uid())
);

-- ── 7. Políticas para rubros (vía obras) ────────────────────────

CREATE POLICY "rubros_select" ON rubros FOR SELECT USING (
  EXISTS (SELECT 1 FROM obras WHERE obras.id = rubros.obra_id AND obras.user_id = auth.uid())
);
CREATE POLICY "rubros_insert" ON rubros FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM obras WHERE obras.id = rubros.obra_id AND obras.user_id = auth.uid())
);
CREATE POLICY "rubros_update" ON rubros FOR UPDATE USING (
  EXISTS (SELECT 1 FROM obras WHERE obras.id = rubros.obra_id AND obras.user_id = auth.uid())
);
CREATE POLICY "rubros_delete" ON rubros FOR DELETE USING (
  EXISTS (SELECT 1 FROM obras WHERE obras.id = rubros.obra_id AND obras.user_id = auth.uid())
);

-- ── 8. Políticas para items (vía rubros → obras) ─────────────────

CREATE POLICY "items_select" ON items FOR SELECT USING (
  EXISTS (SELECT 1 FROM rubros JOIN obras ON obras.id = rubros.obra_id WHERE rubros.id = items.rubro_id AND obras.user_id = auth.uid())
);
CREATE POLICY "items_insert" ON items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM rubros JOIN obras ON obras.id = rubros.obra_id WHERE rubros.id = items.rubro_id AND obras.user_id = auth.uid())
);
CREATE POLICY "items_update" ON items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM rubros JOIN obras ON obras.id = rubros.obra_id WHERE rubros.id = items.rubro_id AND obras.user_id = auth.uid())
);
CREATE POLICY "items_delete" ON items FOR DELETE USING (
  EXISTS (SELECT 1 FROM rubros JOIN obras ON obras.id = rubros.obra_id WHERE rubros.id = items.rubro_id AND obras.user_id = auth.uid())
);

-- ── 9. Políticas para mediciones (vía items → rubros → obras) ────

CREATE POLICY "mediciones_select" ON mediciones FOR SELECT USING (
  EXISTS (SELECT 1 FROM items JOIN rubros ON rubros.id = items.rubro_id JOIN obras ON obras.id = rubros.obra_id WHERE items.id = mediciones.item_id AND obras.user_id = auth.uid())
);
CREATE POLICY "mediciones_insert" ON mediciones FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM items JOIN rubros ON rubros.id = items.rubro_id JOIN obras ON obras.id = rubros.obra_id WHERE items.id = mediciones.item_id AND obras.user_id = auth.uid())
);
CREATE POLICY "mediciones_update" ON mediciones FOR UPDATE USING (
  EXISTS (SELECT 1 FROM items JOIN rubros ON rubros.id = items.rubro_id JOIN obras ON obras.id = rubros.obra_id WHERE items.id = mediciones.item_id AND obras.user_id = auth.uid())
);
CREATE POLICY "mediciones_delete" ON mediciones FOR DELETE USING (
  EXISTS (SELECT 1 FROM items JOIN rubros ON rubros.id = items.rubro_id JOIN obras ON obras.id = rubros.obra_id WHERE items.id = mediciones.item_id AND obras.user_id = auth.uid())
);
