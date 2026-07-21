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

## Quinta tarea: Grilla interactiva ítems × meses

Reemplaza el placeholder "Grilla en construcción" con la grilla real en
`app/obras/[id]/planificacion/page.tsx`. Componente `Grilla` interno + página.

### Fix del header (pendiente de tarea 4)
- El header mostraba `Obra 9b62d7e0` (id truncado). Ahora muestra el nombre real.
- Se agregó `obra_nombre: string` a `PlanificacionResponse` (`types/index.ts`).
- El endpoint `GET /api/planificacion/[obraId]` ahora hace `select("id, nombre, plazo_meses, fecha_inicio")` y devuelve `obra_nombre`. La página lo lee con `datos?.obra_nombre` (mismo criterio que Presupuesto con `datos.obra.nombre`).

### Estructura de la grilla
- Una sola `<table>` dentro de un contenedor `overflow-auto` (glass card, `maxHeight: calc(100vh - 200px)`). Con una sola tabla, encabezado y columnas fijas quedan siempre alineados.
- **Filas:** ítems agrupados por rubro, en el orden que trae el endpoint. Cabecera de rubro colapsable (toggle ▼) + filas de ítem debajo.
- **Columnas:** `Mes 1 … Mes plazo_meses` (índice relativo, sin fechas). Si `plazo_meses` es null/0, no se dibuja grilla: se muestra una tarjeta pidiendo configurar el plazo en Presupuesto → Gastos Generales.
- Columna izquierda por ítem: descripción + línea chica con `cantidad unidad · subtotal costo-costo`.

### Autosave (cómo quedó)
- **Evento:** se guarda al salir de la celda (`onBlur`) o al apretar **Enter** (que hace `blur()`). Nunca en cada tecla — mientras el usuario tipea solo se actualiza el estado local `valores`.
- **Contrato con backend:** `commit()` parsea el texto a número (`''` → 0) y llama `guardarCelda(item_id, mes, pct)` del hook (tarea 4 → `POST /api/planificacion`). Un `0`/vacío hace que el endpoint borre la fila (contrato de tarea 3). Si el valor no cambió respecto del último persistido, no se pega al server (se normaliza el texto y listo).
- **Feedback por celda (individual, no global):** estado en `Record<clave, 'guardando'|'guardado'|'error'>` con `clave = item_id::mes`.
  - `guardando`: punto ámbar en la celda.
  - `guardado`: ring verde suave + punto verde, se auto-limpia a los 1.3 s (`setTimeout`, todos los timers se limpian al desmontar).
  - `error`: ring rojo persistente + punto rojo + `title` explicativo, hasta que un reintento guarde bien. El error de una celda NO sube como mensaje global.
- **Optimista pero honesto:** el valor tipeado se muestra al instante; si falla el guardado, queda el ring rojo sí o sí (no se revierte el texto, para que el usuario reintente).
- **Validación local:** `pct < 0` o `> 100` marca error sin pegarle al server.
- **Re-siembra segura:** `guardarCelda` hace refetch → `datos` cambia → un `useEffect` re-siembra `valores`/`guardados` desde el server (autoritativo), pero preserva el borrador de la celda con foco (`focoRef`) y de las celdas en `error`, para no pisar lo que el usuario está editando.
- El error general de carga de página (hook `error`) se sigue mostrando arriba, según convención del proyecto.

### Cálculos en vivo (frontend, en `useMemo`)
- **Plata de una celda** = `(pct / 100) × subtotal_costo_costo del ítem`. Todo a costo-costo.
- **Plata total de un mes** = suma de las platas de todas las celdas de esa columna. Se muestra en el `tfoot` "Plata por mes" (fila más importante), recalculada en vivo con cada edición porque deriva de `valores`, no de `datos`.
- **Total por fila** = suma de `pct` del ítem a lo largo de los meses. Color de validación blanda: verde si ≈100%, ámbar si falta, rojo si se pasó. Es aviso visual, nunca bloquea ni impide guardar.
- **Subtotal de rubro por mes** = suma de las platas de sus ítems. Se muestra en la cabecera de rubro (siempre, útil sobre todo cuando está colapsado) + total del rubro a la derecha.
- **Gran total** en la esquina inferior derecha.

### Columnas / encabezado fijos (sticky)
- Todo con `position: sticky` sobre la misma tabla:
  - Encabezado de meses: `top: 0` (fijo al scrollear vertical).
  - Columna de ítems (izq): `left: 0` (fija al scrollear horizontal).
  - Columna Total (der): `right: 0`.
  - Fila de totales: `bottom: 0` (siempre visible).
- **z-index** en capas: esquinas (cruce sticky+sticky) 30, encabezado/footer 20, columnas laterales del cuerpo 10, celdas normales 0.
- Las celdas sticky usan fondos casi opacos (`rgba(...,0.96–0.98)`) porque flotan sobre el contenido que scrollea y tienen que taparlo; el resto respeta el glass translúcido de la skill.

### Colapsar / expandir rubros
- Estado `colapsados: Record<rubro_id, boolean>`. El toggle en la cabecera de rubro rota la flecha y oculta las filas de ítem, pero deja visible la cabecera con los subtotales de rubro por mes + total. Permite contraer lo que no se está tocando y reducir scroll.

### Archivos tocados — Tarea 5
- `types/index.ts` — `obra_nombre` en `PlanificacionResponse`.
- `app/api/planificacion/[obraId]/route.ts` — select + devuelve `obra_nombre`.
- `app/obras/[id]/planificacion/page.tsx` — reescrito: componente `Grilla` + `Celda` + página con barra de contexto.
- Hook `usePlanificacion` sin cambios (se usó `guardarCelda` tal cual).

### Criterios cumplidos — Tarea 5
- ✅ Grilla de ítems agrupados por rubro × 10 columnas de mes.
- ✅ Cargo %, salgo de la celda, guarda solo con feedback por celda; al recargar el valor persiste.
- ✅ Fila "Plata por mes" en vivo; los números cierran (`% × subtotal`).
- ✅ Total por fila avisa cuando no da 100% sin bloquear.
- ✅ Columna de ítems fija en scroll horizontal; encabezado de meses fijo en scroll vertical.
- ✅ Rubros colapsables/expandibles con subtotal visible al colapsar.
- ✅ Header muestra "Edificio Holanda" (nombre real), no el id.
- ✅ Otras pestañas intactas; `npm run build` OK.

## Lo que quedó pendiente
- La migración de BD debe ejecutarse manualmente en Supabase SQL Editor (pendiente desde tarea 1) — sin esto, `guardarCelda` fallará (marca de error por celda) porque la tabla `planificacion` no existe.
- **Tarea 6 (próxima):**
  1. **Incidencia:** aprovechar `incidencia_pct` que ya trae el endpoint (columna o indicador por ítem).
  2. **Configuración de meses con fecha:** editar `plazo_meses` y `fecha_inicio` desde esta pantalla (el hook ya tiene `guardarConfiguracion`), y encabezar columnas con el mes calendario real (ej. "Ago 26") en vez del índice relativo.
  3. **Curva acumulada:** avance/plata acumulada mes a mes (curva S) a partir de los totales por mes que ya se calculan.

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
