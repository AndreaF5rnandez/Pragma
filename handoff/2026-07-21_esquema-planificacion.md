# Handoff — Esquema de Planificación de Obras (DB)

**Fecha:** 2026-07-21  
**Sesión:** primera del módulo de Planificación

## Contexto
Primera tarea del módulo de Planificación: preparar el esquema de base de datos para soportar la planificación a nivel de ítem. Cada ítem de cómputo recibirá un porcentaje de avance planificado por mes (ej: un ítem se ejecuta 20% en mes 1, 50% en mes 2, 30% en mes 3).

## Lo que se hizo
- **Migración `supabase/migrations/008_planificacion.sql`** (nueva):
  - Tabla `planificacion` con columnas: `id` (uuid pk), `item_id` (fk a items con CASCADE), `mes` (integer, índice relativo: 1=primer mes), `pct_plan` (numeric, 0-100%), timestamps de auditoría.
  - Restricción UNIQUE sobre `(item_id, mes)`: no hay dos filas para el mismo ítem en el mismo mes.
  - Validaciones: `mes > 0`, `pct_plan` entre 0 y 100.
  - Índice en `item_id` para búsquedas rápidas.
  - RLS desactivado, consistente con `items` y `mediciones` (ver CLAUDE.md).
  - Trigger `set_planificacion_updated_at` para mantener timestamp de actualización.
  - Garantiza que `obras.plazo_meses` exista (idempotente con `IF NOT EXISTS`), aunque ya estaba agregada en migración 006.

## Segunda tarea: Endpoint de lectura para Planificación

**Endpoint creado:** `GET /api/planificacion/[obraId]`

### Tipos TypeScript agregados
Nuevos tipos en `types/index.ts`:
- `Planificacion` — estructura de una fila de planificacion en la BD
- `PlanificacionItem` — ítem con su cantidad_total, subtotal_costo_costo, incidencia_pct y registros de planificacion
- `PlanificacionRubro` — rubro con su lista de items
- `PlanificacionResponse` — respuesta completa del endpoint

### Estructura de la respuesta
```typescript
{
  obra_id: string,
  plazo_meses: number | null,
  fecha_inicio: string,
  total_costo_costo: number,
  rubros: [
    {
      rubro_id: string,
      rubro_nombre: string,
      items: [
        {
          item_id: string,
          descripcion: string,
          unidad_medida: string,
          cantidad_total: number,
          subtotal_costo_costo: number,
          incidencia_pct: number,
          planificacion: [ { mes: number, pct_plan: number }, ... ]
        },
        ...
      ]
    },
    ...
  ]
}
```

### Lógica de cálculo reutilizada
- **subtotal_costo_costo**: se calcula usando la misma función `calcularPrecioReceta()` que el endpoint `/api/presupuesto/[obraId]`. Garantiza sincronización permanente entre ambos endpoints.
- **incidencia_pct**: (subtotal_costo_costo / total_costo_costo) × 100. Dividir por cero está manejado (retorna 0 si total es 0).
- **cantidad_total**: suma de `cantidad_calculada` de todas las mediciones del ítem (igual que en el cómputo).

### Criterios cumplidos
- ✅ Rubros e ítems ordenados según `orden` (rubro.orden, item.orden)
- ✅ Subtotal costo-costo reutiliza `calcularPrecioReceta()` → sincronizado con `/api/presupuesto`
- ✅ Incidencia coherente (suma ~100%, excepto error de redondeo)
- ✅ NO devuelve: plata por celda (mes × %pct_plan × subtotal) ni totales por mes
- ✅ Tipos TypeScript claros sin `any`
- ✅ Compilación exitosa (`npm run build`)

## Lo que quedó pendiente
- La migración de BD debe ejecutarse manualmente en Supabase SQL Editor (pendiente desde tarea 1).
- Hook `usePlanificacion` (ej: CRUD local similar a `useInsumos`, reutilizando este endpoint para lectura).
- Frontend de planificación (grilla ítems × meses, inputs editables para `pct_plan`).

## Decisiones tomadas
- `mes` es integer relativo (no fecha) para permitir que la planificación sea independiente de la fecha de inicio de la obra. La interfaz decidirá cómo traducir a calendarios.
- Índice solo en `item_id`, no composite; las búsquedas típicas filtran por ítem + tal vez mes, pero `item_id` es el camino caliente.
- Incluí validaciones (`CHECK`) en la migración para capturar errores en origen.

## Próximos pasos sugeridos
1. Ejecutar la migración 008 en Supabase SQL Editor (ver SQL abajo).
2. Crear hook `lib/usePlanificacion.ts` (CRUD local similar a `useInsumos`, usa `GET /api/planificacion/[obraId]` para lectura inicial).
3. Implementar endpoints CRUD posteriores: `POST /api/planificacion` (crear), `PUT /api/planificacion/[id]` (actualizar), `DELETE /api/planificacion/[id]` (eliminar).
4. Diseñar pantalla de planificación: grilla ítems × meses, inputs editables para `pct_plan`, validación de suma ~100% por ítem.

## Archivos tocados
- `supabase/migrations/008_planificacion.sql` (nuevo) — crea tabla `planificacion` y agrega `plazo_meses` a `obras`
- `types/index.ts` — nuevos tipos: `Planificacion`, `PlanificacionItem`, `PlanificacionRubro`, `PlanificacionResponse`
- `app/api/planificacion/[obraId]/route.ts` (nuevo) — endpoint GET con toda la lógica de lectura

## Sobre el cálculo de costo-costo
El endpoint reutiliza `lib/calculos.ts::calcularPrecioReceta()` (misma función que `/api/presupuesto`). Si ese helper cambia, ambos endpoints se actualizan automáticamente, garantizando sincronización permanente.

## SQL a ejecutar
Ver sección final con el SQL de la migración 008.
