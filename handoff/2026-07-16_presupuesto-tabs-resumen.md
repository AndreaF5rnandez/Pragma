# Handoff — Rediseño Presupuesto: sub-pestañas + panel resumen

**Fecha:** 2026-07-16
**Sesión:** continuación

## Contexto
Con el motor ya arreglado ([[2026-07-16_fix-presupuesto-crash]]), se pidió rehacer `app/obras/[id]/presupuesto/page.tsx` con una estructura de 3 sub-pestañas internas y un panel de resumen siempre visible, respetando la skill de diseño glassmorphism.

## Lo que se hizo
- Creé `hooks/usePresupuesto.ts`: hook de solo lectura que trae `GET /api/presupuesto/[obraId]` y expone `{ lista, cargando, error }`, siguiendo el mismo patrón de `useRubros`/`useMediciones` (sin CRUD porque el presupuesto no se guarda).
- Reescribí `app/obras/[id]/presupuesto/page.tsx` desde cero:
  - Header superior (pestañas Cómputo/Presupuesto) sin cambios.
  - 3 sub-pestañas internas con los nombres pedidos: **Costo-Costo**, **Gastos Generales**, **Paquete Empresario** (estado local `tab`, sin tocar la URL).
  - `TabCostoCosto`: la tabla de rubros/ítems reutilizada de la versión anterior (agrupada por rubro, total al pie), ahora como componente propio, solo lectura, leyendo `datos.costo_directo.rubros`.
  - `TabPlaceholder`: componente genérico reutilizado para "Gastos Generales" y "Paquete Empresario" — título + "En construcción."
  - `ResumenCascada`: panel fijo con la cascada corta (Costo-Costo → Gastos Generales → Subtotal 1 → Costo Financiero → Subtotal 2 → Beneficio → Subtotal 3 → Impuestos → Precio Final) y el Coeficiente de impactación destacado. En desktop (`lg:` y superior) es una columna `sticky` a la derecha (`glass-elevated` per skill); en mobile es una barra `fixed bottom-0` con scroll horizontal de chips. Todos los valores salen directo de `datos.cierre` — no hay recálculo en cliente.
  - `colorCoeficiente(v)`: verde (`#22C55E`) si el coeficiente está entre 1,55 y 1,65, rojo de alerta (`#EF4444`) fuera de ese rango.
- Eliminé del componente toda la lógica de edición que tenía la versión anterior (`EditablePct`, `GastoGeneralRow`, guardado optimista contra `/api/paquete-empresario` y `/api/gastos-generales`): quedó fuera de alcance de este prompt porque "Gastos Generales" y "Paquete Empresario" son placeholders por ahora. Esa lógica se vuelve a construir cuando se completen esas pestañas.
- Actualicé `CLAUDE.md` (sección Hooks) para documentar `usePresupuesto`.
- Verifiqué con `npm run build`: compila y tipa limpio, sin warnings.

## Lo que quedó pendiente
- Contenido real de la pestaña "Gastos Generales" (tabla editable con categoría/modalidad/meses, como en la versión anterior pero usando `datos.gastos_generales.lista` del hook).
- Contenido real de la pestaña "Paquete Empresario" (edición de `costo_financiero`, `beneficio`, `iva`, `rentas` contra `PUT /api/paquete-empresario/[obraId]`).
- No se verificó en browser real (requiere login de Supabase Auth, sin credenciales de test disponibles; el usuario optó de nuevo por confiar solo en el build).
- Definir breakpoint exacto del corte desktop/mobile del panel si `lg` (1024px) no es el que se quiere en la práctica.

## Decisiones tomadas
- El panel de resumen no recalcula nada: lee `cierre` tal cual viene del JSON, porque en este prompt no hay edición posible (los porcentajes editables quedan para cuando se construya la pestaña Paquete Empresario).
- Se sacrificó la edición de gastos generales que ya existía (funcional) para dejar el placeholder pedido; se prioriza la instrucción explícita del prompt sobre no romper lo anterior, ya que el próximo prompt la reconstruye sobre la nueva estructura de pestañas.

## Próximos pasos sugeridos
1. Pestaña "Gastos Generales": tabla editable + alta/baja, usando `datos.gastos_generales.lista`.
2. Pestaña "Paquete Empresario": edición de porcentajes contra `/api/paquete-empresario/[obraId]`, con recálculo optimista del panel de resumen (probablemente reintroduciendo `calcularCierrePresupuesto` de `lib/calculos.ts` en el cliente).
3. Verificar en browser con un usuario de test una vez que haya credenciales disponibles.

## Archivos clave tocados
- `app/obras/[id]/presupuesto/page.tsx` (reescrito completo)
- `hooks/usePresupuesto.ts` (nuevo)
- `CLAUDE.md` (sección Hooks)
