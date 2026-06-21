# SKILL: Pragma — Design Reference

Referencia visual del sistema de diseño del proyecto Pragma.
Estructura basada en Material Dashboard 2 React (Creative Tim), con paleta de colores Umber personalizada.

Siempre que construyas UI en este proyecto, respetá estos tokens exactos.
No inventes colores, radios ni sombras distintos a los listados acá.

---

## Stack tecnológico

- React + MUI (Material UI v5)
- Fuente: Roboto (Google Fonts)
- Sin Tailwind. Estilos vía MUI `sx` prop o `styled()`.

---

## Paleta de colores — Umber

### Tokens de marca (USAR ESTOS, no los defaults de MUI)

```js
pragma-sidebar     = "#3B302B"   // marrón oscuro — sidebar/sidenav
pragma-accent      = "#8B5E3C"   // marrón medio — botones, elementos activos, acento
pragma-fondo       = "#FAF8F5"   // crema muy suave — fondo general de la app
pragma-superficie  = "#E4DDCC"   // crema oscuro — superficies secundarias, paneles internos
pragma-totales     = "#5C3A1E"   // marrón oscuro — totales, cifras con énfasis
pragma-texto       = "#1C1410"   // casi negro — texto principal
pragma-textoClaro  = "#7A6A5A"   // marrón grisáceo — texto secundario, placeholders
```

### Mapeo a tokens de MUI (para el theme de MUI)

```js
background.default = "#FAF8F5"   // pragma-fondo
text.main          = "#7A6A5A"   // pragma-textoClaro
text.primary       = "#1C1410"   // pragma-texto

primary.main       = "#8B5E3C"   // pragma-accent
primary.focus      = "#7a5234"   // pragma-accent oscurecido

dark.main          = "#1C1410"   // pragma-texto (headings)
dark.focus         = "#3B302B"   // pragma-sidebar

secondary.main     = "#7A6A5A"   // pragma-textoClaro
secondary.focus    = "#5C3A1E"   // pragma-totales
```

### Colores semánticos (mantener los de Material Dashboard)

```js
info.main      = "#1A73E8"
info.focus     = "#1662C4"

success.main   = "#4CAF50"
success.focus  = "#67bb6a"

warning.main   = "#fb8c00"
warning.focus  = "#fc9d26"

error.main     = "#F44335"
error.focus    = "#f65f53"
```

### Gradientes Umber (para headers de stat cards)

```js
// Acento principal
gradients.accent:    #A0714F → #8B5E3C

// Totales / énfasis fuerte
gradients.totales:   #7A4A28 → #5C3A1E

// Sidebar oscuro
gradients.sidebar:   #4A3C36 → #3B302B

// Superficies neutras
gradients.superficie: #EDE6D6 → #E4DDCC
```

Aplicar con:
```js
background: `linear-gradient(195deg, #A0714F, #8B5E3C)`
```

### Sombras coloreadas Umber (para cards con header gradiente)

```js
coloredShadows.accent     = "#8B5E3C"
coloredShadows.totales    = "#5C3A1E"
coloredShadows.sidebar    = "#3B302B"
```

---

## Tipografía

### Familia tipográfica

```js
fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
```

### Pesos

```js
fontWeightLighter: 100
fontWeightLight:   300
fontWeightRegular: 400
fontWeightMedium:  600   // ojo: 600, no 500
fontWeightBold:    700
```

### Tamaños de fuente

```js
xxs: 10.4px
xs:  12px
sm:  14px
md:  16px
lg:  18px
xl:  20px
2xl: 24px
3xl: 30px
```

### Headings (color: pragma-texto #1C1410, bold)

```
h1: 48px / lineHeight 1.25
h2: 36px / lineHeight 1.30
h3: 30px / lineHeight 1.375
h4: 24px / lineHeight 1.375
h5: 20px / lineHeight 1.375
h6: 16px / lineHeight 1.625
```

### Body y utilidades

```
body1:    20px / weight 400 / lineHeight 1.625 / color pragma-texto
body2:    16px / weight 300 / lineHeight 1.6   / color pragma-texto
caption:  12px / weight 300 / lineHeight 1.25  / color pragma-textoClaro
button:   14px / weight 300 / uppercase        / lineHeight 1.5
subtitle2:16px / weight 300 / lineHeight 1.6   / color pragma-textoClaro
```

---

## Bordes y radios

```js
borderColor:      "#E4DDCC"   // pragma-superficie — más cálido que el gris neutro original
inputBorderColor: "#C8BFB0"   // variante más oscura para inputs

borderRadius.xs:      1.6px
borderRadius.sm:      2px
borderRadius.md:      6px
borderRadius.lg:      8px
borderRadius.xl:      12px    ← USAR ESTE para cards y sidenav
borderRadius.xxl:     16px
borderRadius.section: 160px   ← para elementos pill/capsule
```

---

## Sombras (box-shadow)

```js
xs:  "0 2px 9px -5px rgba(28,20,16,0.15)"
sm:  "0 5px 10px 0 rgba(28,20,16,0.12)"
md:  "0 4px 6px -1px rgba(28,20,16,0.08), 0 2px 4px -1px rgba(28,20,16,0.05)"   ← sombra de cards
lg:  "0 10px 15px -3px rgba(28,20,16,0.08), 0 4px 6px -2px rgba(28,20,16,0.04)"
xxl: "0 20px 27px 0 rgba(28,20,16,0.06)"   ← sombra de cards elevados / sidenav

// Sombra con color acento (para stat cards)
colored.accent:  "0 4px 20px 0 rgba(28,20,16,0.12), 0 7px 10px -5px rgba(139,94,60,0.4)"
colored.totales: "0 4px 20px 0 rgba(28,20,16,0.12), 0 7px 10px -5px rgba(92,58,30,0.4)"

// Navbar / topbar
navbarBoxShadow: "inset 0 0 1px 1px rgba(250,248,245,0.9), 0 20px 27px 0 rgba(28,20,16,0.06)"
```

---

## Layout y estructura

### Sidenav (barra lateral)

```js
width:           250px
backgroundColor: "#3B302B"   // pragma-sidebar — oscuro
height:          calc(100vh - 32px)
margin:          16px        // flota sobre el fondo, no toca los bordes
borderRadius:    12px (xl)
border:          none
boxShadow:       xxl
```

Texto e íconos dentro del sidenav:
```js
color activo:    "#FAF8F5"   // pragma-fondo (blanco cálido)
color inactivo:  "rgba(250,248,245,0.6)"
acento activo:   "#8B5E3C"   // pragma-accent (highlight del item seleccionado)
```

El sidenav "flota" — no va de borde a borde. Hay 16px de margen arriba y abajo.

### Fondo general

```js
backgroundColor: "#FAF8F5"   // pragma-fondo — NUNCA blanco puro, NUNCA gris neutro
```

### Cards

```js
backgroundColor: "#FFFFFF"   // blanco puro en card, contrasta con el fondo crema
borderRadius:    12px (xl)
boxShadow:       md
border:          none        // sin borde visible, la sombra define el contorno
overflow:        visible     // para que el header sobresalga
```

### Cards con header de color (stat cards — patrón del Material Dashboard)

```jsx
<Card>
  {/* Header que sobresale */}
  <Box
    sx={{
      background: "linear-gradient(195deg, #A0714F, #8B5E3C)",
      borderRadius: "12px",
      mt: -3,   // sube sobre la card
      mx: 2,
      py: 2,
      px: 2,
      boxShadow: "0 4px 20px 0 rgba(28,20,16,0.12), 0 7px 10px -5px rgba(139,94,60,0.4)",
    }}
  >
    {/* ícono o mini chart */}
  </Box>

  {/* Contenido */}
  <Box p={2}>
    <Typography variant="h6" color="#1C1410">Título</Typography>
    <Typography variant="button" color="#7A6A5A">Subtítulo</Typography>
  </Box>
</Card>
```

Para stat cards de totales/énfasis usar gradiente dark:
```js
background: "linear-gradient(195deg, #7A4A28, #5C3A1E)"
boxShadow:  "0 4px 20px 0 rgba(28,20,16,0.12), 0 7px 10px -5px rgba(92,58,30,0.4)"
```

### Superficies secundarias / paneles internos

```js
backgroundColor: "#E4DDCC"   // pragma-superficie
borderRadius:    8px (lg)
```

---

## Componentes estándar

### Botón primario

```jsx
<Button
  sx={{
    backgroundColor: "#8B5E3C",   // pragma-accent
    color: "#FAF8F5",
    "&:hover": { backgroundColor: "#7a5234" },
    borderRadius: "8px",
    textTransform: "uppercase",
    fontWeight: 600,
    fontSize: "14px",
  }}
>
  Acción
</Button>
```

### Textos secundarios

```jsx
<Typography sx={{ color: "#7A6A5A", fontWeight: 300 }}>
  Texto secundario
</Typography>
```

### Cifras de totales / énfasis

```jsx
<Typography sx={{ color: "#5C3A1E", fontWeight: 700, fontSize: "24px" }}>
  $1.234.567
</Typography>
```

### Separadores

```jsx
<Divider sx={{ borderColor: "#E4DDCC" }} />
// Usar pragma-superficie como color de separador, no gris neutro
```

### Espaciado (múltiplos de 8px, sistema MUI)

```
spacing(1) = 8px
spacing(2) = 16px
spacing(3) = 24px
spacing(4) = 32px
```

---

## Reglas de diseño — NO violar

1. El fondo SIEMPRE es `#FAF8F5` (pragma-fondo). Nunca blanco puro ni gris neutro como fondo general.
2. Las cards son blancas (`#FFFFFF`) para contrastar con el fondo crema.
3. El sidenav SIEMPRE es `#3B302B` (pragma-sidebar). No aclararlo.
4. Los headings usan `#1C1410` (pragma-texto). No usar negro puro `#000000`.
5. El texto secundario es `#7A6A5A` (pragma-textoClaro). No usar grises neutros.
6. El acento es `#8B5E3C` (pragma-accent). CTAs, ítem activo del menú, highlights.
7. Los totales y cifras con énfasis usan `#5C3A1E` (pragma-totales).
8. Los separadores y bordes de inputs usan `#E4DDCC` (pragma-superficie), no grises fríos.
9. Nunca usar `border-radius` menor a `12px` en cards y panels principales.
10. El sidenav flota con `margin: 16px` — nunca pegado al borde del viewport.
11. Los gradientes de stat cards van de claro a oscuro (195deg), con sombra coloreada.
12. El peso "medium" en este sistema es 600, no 500.

---

## Paleta completa de referencia rápida

| Token            | Hex       | Uso                                      |
|------------------|-----------|------------------------------------------|
| pragma-sidebar   | #3B302B   | Sidenav background                       |
| pragma-accent    | #8B5E3C   | Botones, items activos, acento UI        |
| pragma-fondo     | #FAF8F5   | Fondo general de la app                  |
| pragma-superficie| #E4DDCC   | Paneles internos, separadores, bordes    |
| pragma-totales   | #5C3A1E   | Cifras de totales, énfasis fuerte        |
| pragma-texto     | #1C1410   | Texto principal, headings                |
| pragma-textoClaro| #7A6A5A   | Texto secundario, placeholders, captions |
| info             | #1A73E8   | Links, badges info                       |
| success          | #4CAF50   | Estados positivos                        |
| warning          | #fb8c00   | Alertas                                  |
| error            | #F44335   | Errores                                  |