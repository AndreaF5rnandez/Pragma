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

### Criterios cumplidos — Tarea 2 (GET)
- ✅ Rubros e ítems ordenados según `orden` (rubro.orden, item.orden)
- ✅ Subtotal costo-costo reutiliza `calcularPrecioReceta()` → sincronizado con `/api/presupuesto`
- ✅ Incidencia coherente (suma ~100%, excepto error de redondeo)
- ✅ NO devuelve: plata por celda (mes × %pct_plan × subtotal) ni totales por mes
- ✅ Tipos TypeScript claros sin `any`
- ✅ Compilación exitosa

### Criterios cumplidos — Tarea 3 (POST / PUT)
- ✅ POST /api/planificacion crea un porcentaje nuevo
- ✅ POST /api/planificacion actualiza (UPSERT) si existe para ese item_id + mes
- ✅ Si pct_plan <= 0 o null/undefined, borra la fila (no guarda ceros)
- ✅ PUT /api/obras/[id] actualiza plazo_meses y fecha_inicio (existente, sin cambios)
- ✅ Validaciones claras: mes > 0, pct_plan en [0,100], errores HTTP 400
- ✅ Sin modificaciones a hooks ni frontend
- ✅ Compilación exitosa (`npm run build`)

## Tercera tarea: Endpoints de escritura para Planificación

**Endpoints creados/modificados:**
1. **POST /api/planificacion** (nuevo) — upsert/delete de celdas
2. **PUT /api/obras/[id]** — ya soporta plazo_meses y fecha_inicio, sin cambios

### POST /api/planificacion — Upsert/Delete de celdas

**Body esperado:**
```json
{
  "item_id": "uuid",
  "mes": 1,
  "pct_plan": 25
}
```

**Lógica:**
- Si `pct_plan > 0` (y válido): UPSERT sobre (item_id, mes) usando `.upsert(..., { onConflict: "item_id,mes" })` nativo de Supabase
- Si `pct_plan <= 0` o `null` o `undefined`: DELETE el registro (si existe)
- Regla: una celda vacía en la grilla = "sin registro" en la BD (no guarda ceros)

**Validaciones:**
- `item_id` obligatorio (string)
- `mes` obligatorio, debe ser entero > 0
- `pct_plan` debe estar en [0, 100] si está presente y > 0
- Errores devuelven JSON claro: `{ error: "mensaje" }` + status HTTP

**Respuestas:**
- 201: upsert exitoso, retorna el registro creado/actualizado
- 200: delete exitoso (registro eliminado)
- 400: validación fallida (mes inválido, pct_plan fuera de rango, etc.)
- 500: error del servidor

**Decisión de diseño:**
Se eligió POST porque es el endpoint que el frontend llamará repetidamente mientras el usuario edita la grilla. Cada celda editada = un POST con (item_id, mes, pct_plan). Internamente maneja create/update/delete en una sola llamada, simplificando la lógica del frontend.

### PUT /api/obras/[id] — Confirmado existente

Ya soporta:
- `plazo_meses` (integer >= 0)
- `fecha_inicio` (date)
- Validaciones completas, sin cambios necesarios

No se realizaron modificaciones en este endpoint.

## Cuarta tarea: Cáscara del frontend (Hook + Tabs + Página)

**Componentes creados:**
1. **Hook `hooks/usePlanificacion.ts`** (nuevo)
2. **Pestaña "Planificación"** agregada a `/app/obras/[id]/medicion/page.tsx` y `/app/obras/[id]/presupuesto/page.tsx`
3. **Página `/app/obras/[id]/planificacion/page.tsx`** (nueva, con placeholder)

### Hook `usePlanificacion(obraId)`

**Interfaz:**
```typescript
function usePlanificacion(obraId: string): {
  datos: PlanificacionResponse | null;
  cargando: boolean;
  error: string | null;
  guardarCelda(item_id: string, mes: number, pct_plan: number | null): Promise<void>;
  guardarConfiguracion(plazo_meses: number | null, fecha_inicio: string): Promise<void>;
}
```

**Estructura:**
- Sigue patrón de hooks existentes (`useRubros`, `useItems`, etc.)
- `datos`: respuesta completa de `GET /api/planificacion/[obraId]` (type: `PlanificacionResponse`)
- `cargando`: boolean durante fetch inicial
- `error`: string | null, mensaje de error si falla
- `guardarCelda(item_id, mes, pct_plan)`: POST a `/api/planificacion`, recarga datos automáticamente
- `guardarConfiguracion(plazo_meses, fecha_inicio)`: PUT a `/api/obras/[id]`, recarga datos automáticamente
- Sin `any`, tipos explícitos

### Pestaña "Planificación"

**Ubicación:** Agregado a ambas páginas
- `/app/obras/[id]/medicion/page.tsx` — tab inactivo (color `#6B7080`, font-medium)
- `/app/obras/[id]/presupuesto/page.tsx` — tab inactivo (color `#6B7080`, font-medium)
- `/app/obras/[id]/planificacion/page.tsx` — tab activo (color `#1A1A2E`, borderColor `#1A1A2E`, font-semibold)

**Estilo:** Idéntico a tabs existentes, respeta paleta pragma (colores `#1A1A2E`, `#6B7080`), transición de colores

### Página `/app/obras/[id]/planificacion/page.tsx`

**Estado:**
- Usa hook `usePlanificacion(obraId)`
- Renderiza header con nombre de obra y tabs (Planificación activo)
- Estados:
  - **Cargando:** texto "Cargando planificación..." con color pragma-textoClaro
  - **Error:** card glassmorphic roja con error visible en pantalla
  - **Éxito:** placeholder con datos de verificación

**Placeholder (para reemplazar en Tarea 5):**
- Título "Planificación — Grilla en construcción"
- Card glassmorphic con:
  - Total Costo-Costo (formato moneda ARS)
  - Cantidad de Rubros
  - Plazo (meses o "No configurado")
  - Fecha Inicio
  - Lista de rubros con cantidad de ítems cada uno

**Estilos:**
- Mesh gradient background (igual que presupuesto)
- Glass cards con blur(20px), transparencia, bordes sutiles
- Paleta pragma: colores `#1A1A2E` (texto), `#6B7080` (labels), `#7A6A5A` (carga)

## Lo que quedó pendiente
- La migración de BD debe ejecutarse manualmente en Supabase SQL Editor (pendiente desde tarea 1).
- **Tarea 5 (próxima):** Grilla interactiva ítems × meses, inputs editables para `pct_plan`, que llaman a `guardarCelda()` del hook.

## Decisiones tomadas
- `mes` es integer relativo (no fecha) para permitir que la planificación sea independiente de la fecha de inicio de la obra. La interfaz decidirá cómo traducir a calendarios.
- Índice solo en `item_id`, no composite; las búsquedas típicas filtran por ítem + tal vez mes, pero `item_id` es el camino caliente.
- Incluí validaciones (`CHECK`) en la migración para capturar errores en origen.

## Próximos pasos sugeridos

### Tarea 5 (siguiente): Grilla interactiva
1. Diseñar grilla ítems (filas) × meses (columnas)
2. Inputs editables para cada celda (item_id, mes)
3. onChange → llamar a `hook.guardarCelda(item_id, mes, pct_plan)`
4. Validación: mostrar suma de porcentajes por ítem (target ~100%)
5. Reemplazar el placeholder de la página con la grilla real

### Completar después
1. ✅ Ejecutar migración 008 en Supabase SQL Editor (ver SQL abajo) — **bloquea todas las tareas**
2. Configurador inline de plazo_meses y fecha_inicio (probablemente en un modal o en la página de planificación)

## Archivos tocados — Resumen completo

### Tarea 1: Esquema DB
- `supabase/migrations/008_planificacion.sql` (nuevo) — crea tabla `planificacion`, agrega `plazo_meses` a `obras`

### Tarea 2: Lectura (Endpoint GET)
- `types/index.ts` — nuevos tipos: `Planificacion`, `PlanificacionItem`, `PlanificacionRubro`, `PlanificacionResponse`
- `app/api/planificacion/[obraId]/route.ts` (nuevo) — GET: devuelve grilla completa

### Tarea 3: Escritura (Endpoints POST/PUT)
- `app/api/planificacion/route.ts` (nuevo) — POST: upsert/delete de celdas
- `app/api/obras/[id]/route.ts` — **sin cambios**, ya soporta plazo_meses y fecha_inicio

### Tarea 4: Frontend (Hook + Tabs + Página)
- `hooks/usePlanificacion.ts` (nuevo) — hook que integra GET /api/planificacion y POST/PUT de escritura
- `app/obras/[id]/medicion/page.tsx` (modificado) — tab Planificación agregado (inactivo)
- `app/obras/[id]/presupuesto/page.tsx` (modificado) — tab Planificación agregado (inactivo)
- `app/obras/[id]/planificacion/page.tsx` (nuevo) — página con cáscara, tab activo, placeholder con datos de verificación

## Sobre sincronización de cálculos
- **Lectura (GET /api/planificacion)**: reutiliza `lib/calculos.ts::calcularPrecioReceta()` (misma función que `/api/presupuesto`) → sincronizado.
- **Escritura (POST /api/planificacion)**: Supabase valida mediante CHECK en la BD (mes > 0, pct_plan [0-100]), endpoint valida además para errores claros.

## SQL a ejecutar
Ver sección final con el SQL de la migración 008.
