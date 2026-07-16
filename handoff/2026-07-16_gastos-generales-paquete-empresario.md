# Handoff — Editores reales: Gastos Generales y Paquete Empresario

**Fecha:** 2026-07-16
**Sesión:** continuación

## Contexto
Con el esqueleto de 3 sub-pestañas ya armado ([[2026-07-16_presupuesto-tabs-resumen]]) y Costo-Costo funcionando, se pidió completar las otras dos pestañas ("Gastos Generales" y "Paquete Empresario") con sus editores reales, reemplazando los placeholders "En construcción".

## Lo que se hizo
- `hooks/usePresupuesto.ts`: agregué `refrescar` (la función `cargar` extraída con `useCallback`, reutilizada en el efecto inicial y expuesta para refetch manual). Cada guardado exitoso en cualquier editor llama a `refrescar()`, que vuelve a traer `/api/presupuesto/[obraId]` completo — así el panel de resumen y ambas pestañas siempre muestran el recálculo del servidor, sin lógica de recálculo en el cliente.
- **Pestaña "Gastos Generales"** (`TabGastosGenerales` en `app/obras/[id]/presupuesto/page.tsx`):
  - Campo "Plazo de la obra (meses)" arriba de todo, editable, que hace `PUT /api/obras/[id]` con `plazo_meses` (mandando también nombre/cliente/direccion/fecha_inicio/estado actuales porque el endpoint los exige). Nota aclaratoria de que es el default para gastos mensuales.
  - Gastos agrupados por categoría en orden fijo GGDOO → GGDOE → GGI, con el nombre completo como encabezado de cada grupo.
  - `GastoGeneralRow`: descripción editable (blur), modalidad como toggle pill (mensual/único, guarda al click), monto editable, meses editable solo si es mensual, y el total ya viene calculado por el servidor (`gasto.total`, de `GastoGeneralCalculado`) — no se recalcula en cliente.
  - "+ Agregar gasto" por categoría (crea con esa categoría, modalidad único, monto 0). Eliminar pide confirmación con `window.confirm`.
  - Pie del editor: total de gastos generales y porcentaje sobre costo-costo, ambos leídos directo de `datos.gastos_generales` (el sistema los calcula, nunca se cargan a mano).
- **Pestaña "Paquete Empresario"** (`TabPaqueteEmpresario`):
  - 4 campos numéricos libres (Costo Financiero, Beneficio, IVA, Rentas), seedeados desde `datos.cierre`, que guardan con `PUT /api/paquete-empresario/[obraId]` al perder foco.
  - Debajo, la cascada completa explicada renglón por renglón (Costo-Costo → + Gastos Generales → Subtotal 1 → + Costo Financiero → Subtotal 2 → + Beneficio → Subtotal 3 → + Impuestos (IVA + Rentas) → Precio de la Obra), y el Coeficiente de impactación con semáforo (verde 1,55–1,65, rojo fuera de rango) — mismo `colorCoeficiente` que usa el panel de resumen fijo.
- Quité `TabPlaceholder` (ya no se usa en ninguna pestaña).
- Verifiqué con `npm run build`: compila y tipa limpio, sin warnings.

## Lo que quedó pendiente
- **Mano de obra con cargas sociales**: el sistema actual no contempla un concepto separado de mano de obra con cargas sociales (aportes, contribuciones, ART, etc.) dentro del costo-costo ni de los gastos generales. Habría que definir con el ingeniero dónde vive ese concepto (¿insumo tipo `mano_de_obra` con recargo aparte? ¿una categoría nueva de gasto general? ¿un campo propio en el paquete empresario?) antes de modelarlo.
- No se verificó en browser real (sin credenciales de test disponibles); se confió en `npm run build`.
- El toggle de modalidad en `GastoGeneralRow` guarda inmediatamente al click (sin confirmación) — si se pasa de mensual a único con meses cargados, el backend nulea `meses` automáticamente; no hay aviso visual de que ese dato se pierde.

## Decisiones tomadas
- No hay recálculo en cliente en ningún editor: cada guardado dispara `refrescar()` y se confía 100% en la respuesta fresca de `/api/presupuesto/[obraId]`. Es más simple y evita divergencias entre el cálculo del cliente y el del servidor, a costa de un pequeño delay de red después de cada edición.
- El total y el porcentaje de gastos generales se muestran tal cual vienen de `datos.gastos_generales` (`GastosGeneralesResumen`), nunca recalculados a mano en el componente.

## Próximos pasos sugeridos
1. Definir con el ingeniero el modelado de mano de obra con cargas sociales.
2. Verificar en browser con un usuario de test una vez que haya credenciales disponibles.
3. Considerar feedback visual antes de perder `meses` al alternar modalidad de mensual a único.

## Archivos clave tocados
- `app/obras/[id]/presupuesto/page.tsx` (agregadas `TabGastosGenerales`, `GastoGeneralRow`, `TabPaqueteEmpresario`, `CascadaLinea`)
- `hooks/usePresupuesto.ts` (agregado `refrescar`)
