# SKILL: Pragma — Glassmorphism Design Reference

Referencia visual del sistema de diseño del proyecto Pragma.
Inspirado en el estilo "Starline" — glassmorphism con fondo gradiente y paneles translúcidos.

Siempre que construyas UI en este proyecto, respetá estos tokens y patrones exactos.
No inventes colores, radios ni efectos distintos a los listados acá.

---

## Stack tecnológico

- Next.js 14 + App Router + TypeScript
- Tailwind CSS (clases utilitarias)
- Fuente: Inter (Google Fonts) — si no disponible, usar system-ui, sans-serif

---

## Concepto visual: Glassmorphism

Toda la UI se basa en paneles semi-transparentes con backdrop-blur sobre un fondo con gradiente suave. Esto crea profundidad sin sombras duras.

Principios clave:
1. Los paneles NUNCA son opacos blancos. Siempre tienen transparencia.
2. El fondo general tiene gradiente con toques de color sutiles.
3. Los bordes son blancos con muy baja opacidad (o inexistentes).
4. La profundidad se logra con blur + opacidad, no con box-shadow pesados.

---

## Fondo general de la app

El fondo NO es un color plano. Es un gradiente con toques iridiscentes sutiles.

```css
/* Fondo base */
background-color: #D5D4DC;

/* Gradiente con toques de color (mesh gradient simulado) */
background:
  radial-gradient(ellipse at 15% 80%, rgba(200, 230, 76, 0.12) 0%, transparent 50%),
  radial-gradient(ellipse at 85% 20%, rgba(200, 180, 220, 0.15) 0%, transparent 50%),
  radial-gradient(ellipse at 80% 85%, rgba(180, 220, 210, 0.12) 0%, transparent 50%),
  radial-gradient(ellipse at 50% 50%, rgba(215, 210, 220, 0.3) 0%, transparent 70%),
  linear-gradient(135deg, #D8D6DE 0%, #CDCBD5 50%, #D2D0D8 100%);

/* Color base si el gradiente no renderiza */
background-color: #D5D4DC;
```

Tailwind equivalente:
```jsx
// Usar un div wrapper con clases custom o style inline para el mesh gradient
// El color base se puede aproximar con bg-[#D5D4DC]
```

REGLA: el fondo NUNCA es blanco, NUNCA es gris plano, NUNCA es un color sólido sin gradiente.

---

## Paleta de colores

### Colores de marca

```js
// Acento principal — verde lima / chartreuse (para items activos, CTAs)
accent          = "#C8E64C"
accentHover     = "#B8D63C"
accentText      = "#2A3300"   // texto oscuro sobre fondo lima

// Texto
textPrimary     = "#1A1A2E"   // casi negro azulado — headings y texto principal
textSecondary   = "#6B7080"   // gris medio — texto secundario, labels
textTertiary    = "#9CA3AF"   // gris claro — placeholders, texto deshabilitado

// Superficies glass
glassBg         = "rgba(255, 255, 255, 0.55)"   // fondo de cards y paneles
glassBgHover    = "rgba(255, 255, 255, 0.65)"   // hover en cards interactivos
glassBorder     = "rgba(255, 255, 255, 0.60)"   // borde sutil de paneles
glassShadow     = "0 8px 32px rgba(0, 0, 0, 0.06)"

// Sidebar
sidebarBg       = "rgba(255, 255, 255, 0.45)"   // sidebar translúcido
sidebarText     = "#1A1A2E"                       // texto de items inactivos
sidebarTextMuted= "#6B7080"                       // texto secundario sidebar
```

### Colores de acento para stat cards (pasteles suaves)

```js
// Fondos de íconos en stat cards (círculos o badges de color)
pastelYellow    = "#FFF3D0"   // Revenue, dinero
pastelYellowIcon= "#F5A623"   // ícono sobre fondo amarillo

pastelPurple    = "#F0E6FF"   // Orders, pedidos
pastelPurpleIcon= "#8B5CF6"   // ícono sobre fondo violeta

pastelCyan      = "#D5F5F0"   // Customers, personas
pastelCyanIcon  = "#14B8A6"   // ícono sobre fondo cyan

pastelPink      = "#FFE4EC"   // alternativa para cards
pastelPinkIcon  = "#EC4899"
```

### Colores semánticos / de estado

```js
success         = "#22C55E"   // verde — ventas completadas, positivo
successLight    = "#DCFCE7"
warning         = "#F59E0B"   // naranja — cotizaciones pendientes
warningLight    = "#FEF3C7"
error           = "#EF4444"   // rojo — errores
errorLight      = "#FEE2E2"
info            = "#3B82F6"   // azul — informativo
infoLight       = "#DBEAFE"

// Texto de status (usado en tablas)
statusGreen     = "#22C55E"   // "Sales Order"
statusOrange    = "#F59E0B"   // "Quotation Sent"
```

### Colores para gráficos

```js
chartOrange     = "#F5A623"   // línea de Orders
chartPurple     = "#8B5CF6"   // línea de Profit
chartCyan       = "#14B8A6"   // donut: Returned
chartGreen      = "#22C55E"   // donut: Completed
chartYellow     = "#F5A623"   // donut: Distributed
```

---

## Tipografía

### Familia

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Escala de tamaños y pesos

```
// Headings
h1:    32px / weight 700 / lineHeight 1.2  / color textPrimary
h2:    24px / weight 700 / lineHeight 1.25 / color textPrimary
h3:    20px / weight 600 / lineHeight 1.3  / color textPrimary
h4:    18px / weight 600 / lineHeight 1.35 / color textPrimary

// Números grandes (stat cards)
statNumber: 32-36px / weight 700 / lineHeight 1.1 / color textPrimary

// Body
bodyLg:   16px / weight 400 / lineHeight 1.6 / color textPrimary
body:     14px / weight 400 / lineHeight 1.5 / color textSecondary
bodySm:   13px / weight 400 / lineHeight 1.4 / color textSecondary

// Captions y labels
caption:  12px / weight 500 / lineHeight 1.3 / color textSecondary
label:    12px / weight 600 / lineHeight 1.3 / color textTertiary / uppercase / tracking-wide

// Tabla
tableHeader: 13px / weight 600 / color textSecondary
tableCell:   14px / weight 400 / color textPrimary

// Porcentajes de tendencia
trendUp:   13px / weight 600 / color success
trendDown: 13px / weight 600 / color error
```

---

## Bordes y radios

```js
// Radios — este diseño usa esquinas MUY redondeadas
borderRadius.sm:    8px     // botones pequeños, badges
borderRadius.md:    12px    // inputs, items de sidebar
borderRadius.lg:    16px    // cards principales, paneles
borderRadius.xl:    20px    // cards grandes, sidebar completo
borderRadius.full:  9999px  // pills, avatares, badges circulares

// Bordes
borderGlass:  "1px solid rgba(255, 255, 255, 0.60)"   // borde de paneles glass
borderSubtle: "1px solid rgba(0, 0, 0, 0.06)"          // separadores de tabla
borderInput:  "1px solid rgba(0, 0, 0, 0.12)"          // inputs
```

REGLA: los radios mínimos para cards y paneles son 16px. Nunca menos.

---

## Efectos Glass (el corazón del diseño)

### Panel / Card glass estándar

```css
.glass-card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.60);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}
```

Tailwind:
```jsx
className="bg-white/55 backdrop-blur-[20px] border border-white/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
```

### Variante hover (cards interactivos)

```css
.glass-card:hover {
  background: rgba(255, 255, 255, 0.65);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.10);
  transform: translateY(-1px);
  transition: all 0.2s ease;
}
```

### Variante elevada (sidebar, modals)

```css
.glass-elevated {
  background: rgba(255, 255, 255, 0.50);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.50);
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}
```

---

## Layout y estructura

### Sidenav

```css
width: 220px;
background: rgba(255, 255, 255, 0.45);
backdrop-filter: blur(24px);
height: calc(100vh - 32px);
margin: 16px;
margin-right: 0;             /* el contenido empieza justo al lado */
border-radius: 20px;
border: 1px solid rgba(255, 255, 255, 0.50);
padding: 16px 12px;
```

El sidebar "flota" igual que en Material Dashboard — con margen, no pegado al borde.

#### Logo / brand

```
Arriba del todo: ícono + nombre de la app
Tamaño ícono: 28-32px
Nombre: 16px / weight 700 / color textPrimary
Margen inferior: 24px antes de los items del menú
```

#### Items del menú

```css
/* Item base */
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
  cursor: pointer;
  transition: background 0.15s ease;
}

/* Item activo — HIGHLIGHT VERDE LIMA */
.sidebar-item-active {
  background: #C8E64C;
  color: #2A3300;
  font-weight: 600;
}

/* Item hover (inactivo) */
.sidebar-item:hover {
  background: rgba(0, 0, 0, 0.04);
}
```

Tailwind:
```jsx
// Inactivo
className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#1A1A2E] hover:bg-black/[0.04] transition-colors"

// Activo
className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-[#C8E64C] text-[#2A3300]"
```

Íconos del sidebar: 20px, stroke-width 1.5-2, color hereda del texto.

### Área de contenido principal

```css
margin-left: 220px + 16px;   /* ancho sidebar + su margen izquierdo */
padding: 16px 24px;
```

### Top bar / Header

```
Layout: flex, justify-between, items-center
Izquierda: saludo "Welcome, [Nombre]" (h2) + subtítulo (body, textSecondary)
Derecha: íconos de acción (search, dark mode, notifications, calendar, avatar)
Margen inferior: 24px antes del contenido

Íconos del topbar: 20-22px, color textSecondary, hover color textPrimary
Badge de notificación: punto rojo/verde 8px, position absolute top-right
Avatar: 36px, border-radius full, border 2px solid accent
```

### Sub-navegación (tabs horizontales)

```css
/* Tab container */
display: flex;
gap: 24px;
border-bottom: none;   /* SIN línea inferior en el container */
margin-bottom: 20px;
padding: 0 4px;

/* Tab base */
font-size: 14px;
font-weight: 500;
color: #6B7080;        /* textSecondary */
padding-bottom: 8px;
cursor: pointer;

/* Tab activo */
color: #1A1A2E;        /* textPrimary */
font-weight: 600;
border-bottom: 2px solid #1A1A2E;
```

---

## Componentes

### Stat Cards (Dashboard)

Estructura: card glass con ícono pastel a la izquierda, número grande, label, y tendencia.

```jsx
<div className="glass-card p-5 flex flex-col gap-3">
  {/* Ícono con fondo pastel */}
  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
       style={{ backgroundColor: '#FFF3D0' }}>
    <Icon size={24} color="#F5A623" />
  </div>

  {/* Número grande */}
  <span className="text-3xl font-bold text-[#1A1A2E]">$85,500</span>

  {/* Label */}
  <span className="text-sm text-[#6B7080]">Total Revenue</span>

  {/* Tendencia */}
  <div className="flex items-center gap-1.5">
    <TrendUpIcon size={14} color="#22C55E" />
    <span className="text-sm font-semibold text-[#22C55E]">10.5%</span>
    <span className="text-sm text-[#9CA3AF]">From Last Day</span>
  </div>
</div>
```

Colores de íconos para cada tipo de stat:
- Revenue/dinero: fondo `#FFF3D0`, ícono `#F5A623`
- Orders/pedidos: fondo `#F0E6FF`, ícono `#8B5CF6`
- Customers/personas: fondo `#D5F5F0`, ícono `#14B8A6`

### Cards con tinte de color (POS Machines)

Algunas cards tienen un tinte de color sutil además del glass. Patrón:

```css
/* Card con tinte amarillo */
background: linear-gradient(135deg, rgba(255,243,208,0.5) 0%, rgba(255,255,255,0.5) 100%);
backdrop-filter: blur(20px);

/* Card con tinte cyan */
background: linear-gradient(135deg, rgba(213,245,240,0.5) 0%, rgba(255,255,255,0.5) 100%);
backdrop-filter: blur(20px);

/* Card con tinte violeta */
background: linear-gradient(135deg, rgba(240,230,255,0.5) 0%, rgba(255,255,255,0.5) 100%);
backdrop-filter: blur(20px);
```

### Tabla

```css
/* Container de tabla — glass card */
.table-container {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.60);
  border-radius: 16px;
  overflow: hidden;
}

/* Header de tabla */
.table-header th {
  font-size: 13px;
  font-weight: 600;
  color: #6B7080;
  padding: 14px 16px;
  text-align: left;
  background: transparent;    /* NO tiene fondo distinto */
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

/* Filas */
.table-row td {
  font-size: 14px;
  font-weight: 400;
  color: #1A1A2E;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);  /* separador MUY sutil */
}

/* Hover en filas */
.table-row:hover {
  background: rgba(0, 0, 0, 0.02);
}

/* Última fila sin borde inferior */
.table-row:last-child td {
  border-bottom: none;
}
```

Status en tablas: texto coloreado sin fondo, `font-weight: 500`
```jsx
<span className="text-sm font-medium text-[#22C55E]">Sales Order</span>
<span className="text-sm font-medium text-[#F59E0B]">Quotation Sent</span>
```

### Paginación

```css
/* Container */
display: flex;
justify-content: center;
gap: 4px;
padding: 16px;

/* Botón de página */
.page-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #6B7080;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Página activa — VERDE LIMA */
.page-btn-active {
  background: #C8E64C;
  color: #2A3300;
  font-weight: 600;
}
```

### Botones

```css
/* Botón primario (outline con plus) — "Create New Order +" */
.btn-primary-outline {
  padding: 8px 20px;
  border: 1.5px solid #1A1A2E;
  border-radius: 9999px;       /* pill shape */
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
  background: transparent;
  cursor: pointer;
}

.btn-primary-outline:hover {
  background: rgba(0, 0, 0, 0.04);
}

/* Botón primario filled */
.btn-primary {
  padding: 10px 24px;
  background: #C8E64C;
  border: none;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 600;
  color: #2A3300;
  cursor: pointer;
}

.btn-primary:hover {
  background: #B8D63C;
}
```

### Inputs

```css
.input {
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  font-size: 14px;
  color: #1A1A2E;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  outline: none;
}

.input:focus {
  border-color: #C8E64C;
  box-shadow: 0 0 0 3px rgba(200, 230, 76, 0.2);
}

.input::placeholder {
  color: #9CA3AF;
}
```

### Select / Dropdown

```css
/* Mismo estilo que input + ícono chevron a la derecha */
.select {
  /* hereda de .input */
  appearance: none;
  padding-right: 36px;   /* espacio para el chevron */
}
```

### Ícono de edición (lápiz en cards)

```
Posición: absolute bottom-right del card, padding 16px
Tamaño: 18px
Color: #9CA3AF (textTertiary)
Hover: #6B7080 (textSecondary)
```

---

## Espaciado

Sistema de 4px base, pero predominan múltiplos de 8:

```
4px   — gaps mínimos (entre ícono de trend y texto)
8px   — padding interno de badges, gap entre elementos inline
12px  — gap en items de sidebar (ícono-texto), padding de items
16px  — padding de cards, margen del sidebar, gap entre cards en grid
20px  — padding de stat cards, gap entre secciones internas
24px  — gap entre cards en grid principal, margen entre secciones
32px  — margen entre grupos grandes de contenido
```

### Grid del dashboard

```css
/* Grid de stat cards */
display: grid;
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
gap: 24px;

/* Grid de POS machines (2 columnas) */
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 24px;
```

---

## Sombras

```js
// Sombra de cards glass (sutil, NO pesada)
shadow.card    = "0 8px 32px rgba(0, 0, 0, 0.06)"
shadow.hover   = "0 8px 32px rgba(0, 0, 0, 0.10)"

// Sombra elevada (sidebar, modals, dropdowns)
shadow.elevated = "0 12px 40px rgba(0, 0, 0, 0.08)"

// Sombra de dropdowns / popovers
shadow.dropdown = "0 4px 16px rgba(0, 0, 0, 0.10)"

// Sin sombra (la mayoría de elementos dependen del blur + transparencia, no de sombra)
shadow.none     = "none"
```

REGLA: las sombras son MUY sutiles en este diseño. La profundidad la da el blur, no la sombra.

---

## Reglas de diseño — NO violar

1. El fondo SIEMPRE es el gradiente gris con toques iridiscentes. NUNCA un color plano.
2. Todas las cards y paneles usan `backdrop-filter: blur(20px)` + fondo semi-transparente. NUNCA fondo blanco sólido.
3. Los bordes de cards son `rgba(255,255,255,0.60)`, NUNCA grises opacos ni colores sólidos.
4. El radio mínimo de cards es `16px`. Items de menú y botones: `12px` mínimo.
5. El color de acento activo es `#C8E64C` (verde lima). Se usa para: item activo del sidebar, botones primarios filled, paginación activa, focus de inputs.
6. NUNCA usar sombras pesadas. El diseño es etéreo — se apoya en transparencia y blur.
7. Los headings son `#1A1A2E` (casi negro azulado). NUNCA negro puro `#000`.
8. El sidebar flota con `margin: 16px` por todos los lados excepto derecha.
9. Las tablas NO tienen bordes visibles en celdas. Solo separadores horizontales muy sutiles (`rgba(0,0,0,0.04)`).
10. Los botones de acción principales (Create New, Add) son pill-shaped (`border-radius: 9999px`), outline con borde oscuro.
11. Los stat cards usan íconos con fondo pastel (amarillo, violeta, cyan) — nunca iconos sueltos sin fondo.
12. Los porcentajes de tendencia siempre tienen ícono de flecha + color semántico (verde sube, rojo baja).

---

## Paleta completa de referencia rápida

| Token            | Valor                         | Uso                                          |
|------------------|-------------------------------|----------------------------------------------|
| accent           | #C8E64C                       | Item activo sidebar, CTAs, focus              |
| accentText       | #2A3300                       | Texto sobre fondo lima                        |
| textPrimary      | #1A1A2E                       | Headings, texto principal, cifras             |
| textSecondary    | #6B7080                       | Labels, texto secundario, headers de tabla    |
| textTertiary     | #9CA3AF                       | Placeholders, texto deshabilitado             |
| glassBg          | rgba(255,255,255,0.55)        | Fondo de cards y paneles                      |
| glassBorder      | rgba(255,255,255,0.60)        | Bordes de paneles glass                       |
| sidebarBg        | rgba(255,255,255,0.45)        | Fondo del sidebar                             |
| pastelYellow     | #FFF3D0                       | Fondo ícono revenue                           |
| pastelPurple     | #F0E6FF                       | Fondo ícono orders                            |
| pastelCyan       | #D5F5F0                       | Fondo ícono customers                         |
| success          | #22C55E                       | Estados positivos, tendencia up               |
| warning          | #F59E0B                       | Pendientes, cotizaciones                      |
| error            | #EF4444                       | Errores, tendencia down                       |
| bgBase           | #D5D4DC                       | Color base del fondo (fallback sin gradiente) |