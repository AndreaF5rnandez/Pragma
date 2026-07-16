# Handoff — Optimistic updates en Gastos Generales y Paquete Empresario

**Fecha:** 2026-07-16
**Sesión:** continuación

## Contexto
Con los editores reales ya funcionando ([[2026-07-16_gastos-generales-paquete-empresario]]), cada edición tardaba 2-3 segundos en reflejarse porque la UI esperaba el PUT/POST y el refetch completo de `/api/presupuesto/[obraId]` antes de actualizar nada. Se pidió optimistic updates: la UI responde al instante, el guardado real viaja en paralelo.

## Lo que se hizo
- **`lib/calcularPresupuestoLocal.ts`** (nuevo): `calcularResumenLocal(costoCosto, gastosGenerales, paquete)`, función pura sin llamadas a red. El total por gasto replica línea por línea la lógica de `calcularTotalGasto` (mensual = monto × meses, único = monto); la cascada delega directamente en `calcularCierrePresupuesto` de `lib/calculos.ts` (no se tocó ese archivo, solo se importa) — así el resultado es idéntico al del servidor por construcción, no por copiar-pegar que podría divergir con el tiempo.
- **Estado optimista lifted a `PresupuestoPage`** (`app/obras/[id]/presupuesto/page.tsx`): `gastosLocal`, `paqueteLocal` y `resumenLocal` viven en la página, no en cada pestaña. Un `useEffect` sobre `datos` (el JSON del hook) los siembra al cargar y los concilia después de cada `refrescar()` en background:
  - `gastosLocal`/`paqueteLocal` siempre se resincronizan con el servidor (es la verdad final).
  - `resumenLocal` (lo que pinta el panel) solo se reemplaza si difiere en más de $1 de `precio_final` respecto al que ya se mostraba — evita parpadeo por redondeo cuando el cálculo local y el del servidor ya coinciden.
- Cada acción (`guardarGasto`, `agregarGasto`, `eliminarGasto`, `guardarPlazo`, `guardarPaquete`) sigue el mismo patrón: aplica el cambio a `gastosLocal`/`paqueteLocal` de inmediato, llama a `recalcular()` (que usa `calcularResumenLocal`) para actualizar `resumenLocal` al instante, dispara el fetch real en background, y si falla revierte el estado local al valor anterior y relanza el error para que la pestaña lo muestre en pantalla. Si tiene éxito, llama a `refrescar()` (no esperado) para reconciliar con el servidor sin bloquear la UI.
- `TabPaqueteEmpresario` ahora también lee `resumen` (optimista) en vez de `datos.cierre`, así la cascada explicada y el coeficiente de esa misma pestaña se actualizan al instante al tipear un porcentaje.
- **Agregar gasto sin recargar**: `agregarGasto` inserta un renglón optimista con id temporal (`tmp-...`) en `gastosLocal` antes de llamar a la API; cuando el POST responde, reemplaza ese id temporal por la fila real.
- **Modalidad como select**: se reemplazó el toggle-button por un `<select>` que itera `MODALIDADES` (`[{id:'unico', label:'Único'}, {id:'mensual', label:'Mensual'}]`), constante fácil de extender.
- **Borde superior en el total**: la card de "Total gastos generales" ahora tiene `borderTop: '2px solid rgba(0,0,0,0.10)'` para separarlo visualmente.
- **Propagación de plazo**: `guardarPlazo` identifica los gastos mensuales cuyo `meses` coincide con el plazo anterior (no editados a mano) y los actualiza al nuevo plazo, tanto local como vía `PUT /api/gastos-generales/[id]` en paralelo (`Promise.all`); los gastos con un `meses` distinto quedan intactos.
- Verifiqué onBlur/Enter para monto y meses: ya estaba implementado así desde la sesión anterior (el `onChange` solo actualiza el string local, el guardado ocurre en `onBlur`/Enter) — se mantuvo sin cambios.
- No se tocó la API ni `lib/calculos.ts`.
- Verifiqué con `npm run build`: compila y tipa limpio, sin warnings.

## Lo que quedó pendiente
- **Mano de obra con cargas sociales** sigue sin resolver (ver [[2026-07-16_gastos-generales-paquete-empresario]]).
- **Condición de carrera residual**: si el usuario dispara dos ediciones distintas muy rápido (antes de que el `refrescar()` de la primera resuelva), la reconciliación de la segunda podría pisarse con la respuesta de la primera, porque `gastosLocal`/`paqueteLocal` se resincronizan enteros con cada `datos` nuevo. Para un uso normal (un campo a la vez, blur entre ediciones) no debería notarse; si se vuelve un problema real, habría que trackear ediciones pendientes con un id/timestamp antes de aceptar una reconciliación.
- No se verificó en browser real (sin credenciales de test disponibles); se confió en `npm run build`.

## Decisiones tomadas
- `calcularResumenLocal` reutiliza `calcularCierrePresupuesto` de `lib/calculos.ts` en vez de reescribir la cascada desde cero: garantiza resultado idéntico al servidor para siempre (si `lib/calculos.ts` cambia, ambos lados se mueven juntos), en vez de arriesgar que una copia manual diverja con el tiempo.
- El umbral de reconciliación ($1) se aplica comparando `precio_final` porque es el número que más le importa al usuario ver estable; no se comparó campo por campo de la cascada para no complicar la lógica sin necesidad.
- `refrescar()` nunca se espera (`await`) dentro de las funciones de guardado: el spinner de cada campo se apaga apenas el PUT/POST específico responde, no cuando termina el refetch completo — así la sensación de "instantáneo" no depende de una segunda llamada de red.

## Próximos pasos sugeridos
1. Definir con el ingeniero el modelado de mano de obra con cargas sociales.
2. Verificar en browser con un usuario de test una vez que haya credenciales disponibles (confirmar visualmente que no hay parpadeo ni flash de valores incorrectos).
3. Si aparecen ediciones concurrentes reales en el uso diario, revisar la condición de carrera anotada arriba.

## Archivos clave tocados
- `lib/calcularPresupuestoLocal.ts` (nuevo)
- `app/obras/[id]/presupuesto/page.tsx` (estado optimista lifted a la página, select de modalidad, alta optimista de gasto, propagación de plazo, borde del total)
