# Handoff — Rediseño visual completo

**Fecha:** 2026-06-22
**Sesión:** nueva

## Contexto
Sesión dedicada 100% a rediseño visual. Se aplicó el sistema de diseño de la skill `/diseño`
(paleta Umber, tipografía, sombras, radios) a todas las pantallas existentes sin tocar lógica.

## Lo que se hizo
- Corregido `tailwind.config.ts`: `pragma-fondo` de `#F8F4EE` a `#FAF8F5` (valor correcto del design system)
- Rediseñado `components/layout/Sidebar.tsx`: sidebar flotante con `m-4 rounded-xl`, íconos Unicode (◉ ◈ ◇), logo prominente, separador, footer "Pragma v1.0"
- Rediseñada `app/obras/page.tsx`: cards con sombra MD system, empty state con ícono ◻, botones modal con `justify-between`, errores con `bg-red-50 border-red-200 text-red-700`
- Rediseñada `app/insumos/page.tsx`: filtro tipo reemplazado por pills/chips bajo la barra, headers de tabla `uppercase tracking-wider`, filas alternadas, inputs de fila rápida sin borde en reposo (borde solo en focus), errores estilizados
- Rediseñada `app/recetas/page.tsx`: tabla consistente con insumos, filas alternadas, precio unitario en `text-pragma-totales font-mono`, modal de ingredientes con columnas "Unidad" y "Subtotal parcial" agregadas, total destacado, errores estilizados
- Rediseñada `app/obras/[id]/medicion/page.tsx`: tabs Cómputo/Presupuesto como borde inferior (no botones), rubros con `border-l-[3px] border-pragma-accent` para activo (sin fondo marrón lleno), inputs de medición sin borde en reposo, campos numéricos con `font-mono`, cantidad calculada `font-mono font-semibold`, errores estilizados, botones modal `justify-between`

## Lo que quedó pendiente
- Pantalla Presupuesto (`app/obras/[id]/presupuesto/page.tsx`) no existe todavía — ignorada
- Revisar visualmente en browser (no se pudo verificar en vivo)

## Decisiones tomadas
- Sidebar flotante: `m-4` + `h-[calc(100vh-32px)]` + `rounded-xl` + `box-shadow` inline — sin cambiar el layout.tsx
- Pills de filtro en insumos reemplazan el `<select>` — se eliminó el selector dropdown, más consistente con el diseño
- Inputs de tabla de mediciones: `border-transparent` en reposo, `border-pragma-superficie` en focus — planilla limpia
- Rubros activos: `border-l-[3px] border-pragma-accent + bg-white/40` en lugar de fondo lleno marrón — menos agresivo visualmente
- Botones modales: `justify-between` para separar Cancelar (izquierda) de Guardar (derecha)
- Recetas: se agregaron columnas Unidad y Subtotal al modal de ingredientes — es display read-only calculado, no cambia lógica

## Próximos pasos sugeridos
1. Verificar visualmente en browser que todo se vea bien (correr `npm run dev`)
2. Construir pantalla Presupuesto (`app/obras/[id]/presupuesto/page.tsx`)
3. Mejoras pendientes de insumos: Enter-to-next entre campos de la fila rápida

## Archivos clave tocados
- `tailwind.config.ts`
- `components/layout/Sidebar.tsx`
- `app/obras/page.tsx`
- `app/insumos/page.tsx`
- `app/recetas/page.tsx`
- `app/obras/[id]/medicion/page.tsx`
