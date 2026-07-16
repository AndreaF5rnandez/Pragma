# Handoff — Paquete Empresario (motor: datos + cálculo)

**Fecha:** 2026-07-15
**Sesión:** continuación

## Contexto
Se agregó toda la capa del "Paquete Empresario" a nivel de datos y cálculo
(sin tocar la interfaz). El costo directo (mediciones + recetas + insumos) NO
se modificó. Reemplaza el esquema anterior y simple de gastos generales.

## Lo que se hizo
- Migración `supabase/migrations/006_paquete_empresario.sql`: agrega `obras.plazo_meses`,
  rehace `gastos_generales` y crea `paquete_empresario`.
- `lib/paqueteEmpresario.ts`: `inicializarPaqueteEmpresario(supabase, obraId)` — idempotente,
  crea el paquete con defaults y siembra los gastos generales solo si no existía.
- `lib/calculos.ts`: nuevas funciones `calcularTotalGasto`, `resumirGastosGenerales`,
  `calcularCierrePresupuesto` (cascada). Las funciones viejas quedaron intactas.
- Reescritos `app/api/gastos-generales/route.ts` y `.../[id]/route.ts` al nuevo esquema.
- Nuevo `app/api/paquete-empresario/[obraId]/route.ts` (GET inicializa + devuelve; PUT upsert).
- `app/api/obras/route.ts` POST: ahora llama a `inicializarPaqueteEmpresario` (antes sembraba
  el esquema viejo). `app/api/obras/[id]/route.ts` PUT: acepta y guarda `plazo_meses`.
- Reescrito `app/api/presupuesto/[obraId]/route.ts`: ya no recibe porcentajes por query,
  lee todo de la base. Ver forma del JSON abajo.
- `types/index.ts`: `GastoGeneral` nuevo, `PaqueteEmpresario`, `plazo_meses` en `Obra`,
  y tipos de respuesta del presupuesto.

## Esquema final de las tres tablas
- `obras`: + `plazo_meses` (integer, nullable). Se conservan los `*_pct` legacy (ya no se usan).
- `gastos_generales`: id, obra_id (FK CASCADE), categoria ('GGDOO'|'GGDOE'|'GGI'),
  descripcion, modalidad ('mensual'|'unico'), monto (default 0), meses (int nullable), orden, created_at.
- `paquete_empresario`: id, obra_id (FK UNIQUE CASCADE), costo_financiero (5), beneficio (10),
  iva (21), rentas (2.75), created_at. RLS desactivado en ambas.

## Forma de GET /api/presupuesto/[obraId]
`{ obra, costo_directo:{ rubros:[{rubro_id,rubro_nombre,items:[...],subtotal}], costo_costo },`
`gastos_generales:{ lista:[{...gasto,total}], total, porcentaje_derivado },`
`cierre:{ costo_costo, gastos_generales, subtotal_1, costo_financiero_pct, costo_financiero_monto,`
`subtotal_2, beneficio_pct, beneficio_monto, subtotal_3, impuestos:{iva_pct,rentas_pct,monto},`
`precio_final, coeficiente } }`. Cascada validada con las funciones reales (coincide a mano).

## Rutas de APIs nuevas/cambiadas
- `GET/POST /api/gastos-generales` · `GET/PUT/DELETE /api/gastos-generales/[id]`
- `GET/PUT /api/paquete-empresario/[obraId]`
- `PUT /api/obras/[id]` acepta `plazo_meses`.

## Lo que quedó pendiente
- **Aplicar la migración 006 en el Supabase SQL Editor** (no se pudo aplicar DDL desde acá).
- Probar el endpoint contra una obra real: pendiente hasta aplicar la migración.
- Pantalla de presupuesto (`app/obras/[id]/presupuesto/page.tsx`) quedó desactualizada
  a propósito: usa el esquema viejo (`concepto`, `es_predefinido`) y NO compila con `next build`
  hasta que se reescriba en el próximo prompt. `next dev` + APIs funcionan.

## Decisiones tomadas
- `gastos_generales` se DROPea y recrea (las filas viejas eran semillas en 0, sin pérdida real).
- La inicialización se hizo como helper TypeScript (no función SQL), consistente con el proyecto
  y evitando RPC.
- La cascada aplica cada porcentaje sobre el subtotal acumulado anterior; impuestos = iva + rentas
  sobre subtotal_3. Divisores en cero devuelven 0 (coeficiente y porcentaje_derivado).

## Próximos pasos sugeridos
1. Aplicar `006_paquete_empresario.sql` en Supabase.
2. Correr el test del endpoint sobre una obra real.
3. Reescribir la pantalla de presupuesto con la nueva forma del JSON.

## Archivos clave tocados
- `supabase/migrations/006_paquete_empresario.sql`
- `lib/paqueteEmpresario.ts`, `lib/calculos.ts`, `types/index.ts`
- `app/api/gastos-generales/route.ts`, `app/api/gastos-generales/[id]/route.ts`
- `app/api/paquete-empresario/[obraId]/route.ts`
- `app/api/obras/route.ts`, `app/api/obras/[id]/route.ts`
- `app/api/presupuesto/[obraId]/route.ts`
