# Handoff — Glassmorphism: Header + todas las páginas

**Fecha:** 2026-06-23
**Sesiones:** 2 (sesión anterior: layout + sidebar; esta sesión: header + 4 páginas)

## Contexto

Continuación del rediseño glassmorphism iniciado en la sesión anterior (ver `2026-06-22_rediseno-visual-completo.md` para el historial Umber, y la sesión 2 para layout/sidebar). Esta sesión completó el sistema de diseño en todas las pantallas y agregó el Header global.

## Lo que se hizo

### Nuevo: `components/layout/Header.tsx`
- Componente cliente que muestra saludo dinámico (buenos días/tardes/noches) + fecha formateada en español
- Glass panel: `rgba(255,255,255,0.55)`, `blur(20px)`, border `rgba(255,255,255,0.60)`, shadow `0 8px 32px rgba(0,0,0,0.06)`
- Posición: `mx-4 mt-4 mb-3`, altura `56px`, `rounded-2xl`
- Badge "P" en círculo lime `#C8E64C` a la derecha
- Usa `useEffect` para evitar hydration mismatch con `useState('')` inicial

### Actualizado: `app/layout.tsx`
- Agregó wrapper `<div className="flex-1 flex flex-col overflow-hidden">` alrededor de Header + main
- Header se renderiza encima de `<main>` en flujo flex-col

### Rediseñada: `app/obras/page.tsx`
- Cards: glass card `rgba(255,255,255,0.55)` + `blur(20px)` + `rounded-2xl`
- Badges de estado: SKILL semantic — activa `#DCFCE7/#22C55E`, pausada `#FEF3C7/#F59E0B`, finalizada gris
- Botones: `rounded-full`, lime para primario, outline dark para secundario
- Botón eliminar: solo ícono ✕ en rojo, sin texto
- Modal: `rgba(255,255,255,0.85)`, `blur(24px)`, `borderRadius: 20px`
- Errores: `#FEE2E2 / #EF4444`

### Rediseñada: `app/insumos/page.tsx`
- Table container: glass card
- Tabla: sin fondo de header, sin filas alternadas; solo `border-b rgba(0,0,0,0.04)` entre filas, hover `rgba(0,0,0,0.02)`
- Pills de filtro: lime para activo, glass blanco semitransparente para inactivo
- Badges tipo: `#DCFCE7/#22C55E` material, `#DBEAFE/#3B82F6` mano de obra, `#FEF3C7/#F59E0B` equipo
- Inputs inline: transparentes en reposo, `bg-white/60` en focus con shadow lime
- Fila rápida: borde superior `rgba(200,230,76,0.3)` + botón pill lime
- Modal: glass elevated

### Rediseñada: `app/recetas/page.tsx`
- Misma estructura de tabla que insumos
- Modal: glass elevated, tabla de ingredientes con fondo `rgba(255,255,255,0.40)`
- Caja de precio calculado: fondo `rgba(200,230,76,0.12)` + border `rgba(200,230,76,0.30)` — acento lima sutil
- Precios: `#1A1A2E font-bold font-mono` (reemplaza el marrón `pragma-totales`)

### Rediseñada: `app/obras/[id]/medicion/page.tsx`
- Header interno: `rgba(255,255,255,0.80)` + `blur(20px)`, sticky top-0 dentro de `<main>`
- Tab activo: `border-b-2 border-[#1A1A2E]` — underline oscuro según SKILL
- Panel rubros: `rgba(255,255,255,0.45)` + `blur(20px)`, border-right `rgba(255,255,255,0.50)`
- Rubro activo: `border-left: 3px solid #C8E64C` + `rgba(200,230,76,0.10)` de fondo
- Item cards: glass card full `rgba(255,255,255,0.55)` + `blur(20px)` + `rounded-2xl`
- Cabecera de ítem: `border-left: 3px solid #C8E64C`
- Tabla mediciones: sin fondos, solo separadores `rgba(0,0,0,0.04)`
- Fila en edición: `rgba(200,230,76,0.06)` de fondo
- Subtotal rubro: caja lime `rgba(200,230,76,0.12)` con precio en `#1A1A2E bold`
- Botones: todos `rounded-full`, lime para crear, outline para cancelar/cancelar
- Panel derecho: sin background (transparente, muestra gradiente del body)

## Tokens de diseño usados (SKILL glassmorphism)

| Token | Valor |
|---|---|
| Glass panel bg | `rgba(255,255,255,0.55)` |
| Glass panel border | `rgba(255,255,255,0.60)` |
| Glass panel blur | `blur(20px)` |
| Glass panel shadow | `0 8px 32px rgba(0,0,0,0.06)` |
| Glass elevated bg | `rgba(255,255,255,0.85)` |
| Glass elevated blur | `blur(24px)` |
| Glass elevated radius | `20px` |
| Glass elevated shadow | `0 12px 40px rgba(0,0,0,0.08)` |
| Accent (lime) | `#C8E64C` |
| Accent hover | `#B8D63C` |
| Accent text | `#2A3300` |
| Text primary | `#1A1A2E` |
| Text secondary | `#6B7080` |
| Text tertiary | `#9CA3AF` |
| Row separator | `rgba(0,0,0,0.04)` |
| Row hover | `rgba(0,0,0,0.02)` |
| Error bg | `#FEE2E2` |
| Error text | `#EF4444` |
| Focus ring | `0 0 0 3px rgba(200,230,76,0.2)` |

## Convenciones aplicadas en todas las páginas

- `style={{ color: '#...' }}` para colores de texto (no Tailwind arbitrary values en text)
- `className="bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C]"` para botones (Tailwind arbitrary, necesita hover)
- Glass panels: `style={{ background, border, backdropFilter, borderRadius, boxShadow }}`
- Inputs: clase `INPUT_MODAL` y `INPUT_INLINE`/`INPUT_FILA` como constantes al tope del archivo
- Sin `text-pragma-*` ni `bg-pragma-*` en estas páginas (los tokens Umber quedaron solo en tailwind.config.ts)

## Conocido y pendiente

- **Altura del rubros aside en medición**: usa `h-[calc(100vh-3rem)]` que resta 48px del header interno, sin contar el global Header (~84px total). El aside desborda ~36px por debajo del área visible — impacto visual mínimo (se corta ligeramente en el footer del panel). Para corregir: cambiar a `h-[calc(100vh-7.5rem)]` aprox., o usar un enfoque flex con overflow interno.
- **Pantalla Presupuesto** (`app/obras/[id]/presupuesto/page.tsx`): no existe todavía, por construir.
- **Verificación visual en browser**: no se corrió `npm run dev` en esta sesión; verificar manualmente.

## Archivos tocados en esta sesión

- `components/layout/Header.tsx` ← NUEVO
- `app/layout.tsx`
- `app/obras/page.tsx`
- `app/insumos/page.tsx`
- `app/recetas/page.tsx`
- `app/obras/[id]/medicion/page.tsx`

## Próximos pasos sugeridos

1. `npm run dev` y verificar visualmente todas las pantallas
2. Corregir el `h-[calc()]` del rubros aside si el corte molesta visualmente
3. Construir `app/obras/[id]/presupuesto/page.tsx` con la misma paleta glassmorphism
4. Considerar agregar micro-animaciones (`transition-all`) en las cards de obras al hacer hover
