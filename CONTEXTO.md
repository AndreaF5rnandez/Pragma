# PRAGMA — Contexto del proyecto

## Qué es el proyecto
Sistema de presupuestación de obras de construcción. El presupuestador solo mide, el sistema hace el resto. Reemplaza el uso de Excel y softwares como Presto/Data Obra.

## Stack tecnológico
- Next.js 14 con App Router y TypeScript
- Tailwind CSS con paleta de colores personalizada (pragma)
- Supabase (PostgreSQL) como base de datos y autenticación
- Cliente de Supabase: `lib/supabase.ts` (cliente) y `lib/supabaseServer.ts` (servidor)

## Estructura del proyecto
```
presupuestador-obras/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── obras/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── medicion/page.tsx
│   │       └── presupuesto/page.tsx
│   ├── insumos/page.tsx
│   ├── recetas/page.tsx
│   └── api/
│       ├── insumos/route.ts y [id]/route.ts
│       ├── recetas/route.ts y [id]/route.ts
│       ├── obras/route.ts y [id]/route.ts
│       ├── mediciones/route.ts y [id]/route.ts
│       └── presupuesto/[obraId]/route.ts
├── components/
│   ├── layout/Sidebar.tsx
│   ├── ui/ (Button, Input, Table, Modal, Badge)
│   ├── insumos/, recetas/, obras/, medicion/, presupuesto/
├── lib/
│   ├── supabase.ts
│   ├── supabaseServer.ts
│   └── calculos.ts
├── types/index.ts
├── hooks/
│   ├── useInsumos.ts
│   ├── useRecetas.ts
│   ├── useObras.ts
│   └── useMediciones.ts
└── supabase/migrations/001_initial_schema.sql
```

## Base de datos — tablas y columnas reales
Todas las tablas usan UUID como id generado con gen_random_uuid().

**insumos**
- id, nombre, unidad_medida, tipo (material|mano_de_obra|equipo), precio_unitario, created_at, updated_at

**recetas**
- id, nombre, unidad_medida, created_at, updated_at
- El precio_unitario NO se guarda, siempre se calcula desde los insumos

**receta_insumos**
- id, receta_id, insumo_id, cantidad, created_at, updated_at
- CASCADE al eliminar receta o insumo

**obras**
- id, nombre, cliente, direccion (nullable), fecha_inicio (nullable), estado (activa|pausada|finalizada), created_at, updated_at

**rubros**
- id, obra_id, nombre, orden, created_at, updated_at
- CASCADE al eliminar obra

**items**
- id, rubro_id, receta_id, descripcion, orden, created_at, updated_at
- CASCADE al eliminar rubro; RESTRICT al eliminar receta (no se puede eliminar una receta con ítems activos)

**mediciones**
- id, item_id, descripcion, n, largo, ancho, alto, cantidad_calculada (GENERATED ALWAYS — n * COALESCE(largo,1) * COALESCE(ancho,1) * COALESCE(alto,1)), created_at, updated_at
- CASCADE al eliminar item

## Decisiones técnicas importantes
1. cantidad_calculada en mediciones es GENERATED ALWAYS en PostgreSQL. Nunca se envía desde el backend, la calcula la base de datos sola.
2. Los nombres reales de columnas son unidad_medida y precio_unitario (NO unidad ni precio). Esto generó varios bugs que ya fueron corregidos en todos los archivos.
3. direccion y fecha_inicio en obras son nullable (se corrigió con ALTER TABLE).
4. El presupuesto no se guarda, se calcula en el momento desde mediciones + recetas + insumos.
5. RLS desactivado en rubros, items y mediciones con ALTER TABLE DISABLE ROW LEVEL SECURITY.
6. La función agruparMedicionesPorReceta fue eliminada de calculos.ts porque el presupuesto se calcula directamente en el route.

## APIs disponibles y funcionando
- GET/POST /api/insumos — soporta filtro ?tipo=material|mano_de_obra|equipo
- GET/PUT/DELETE /api/insumos/[id] — DELETE verifica si está en uso en recetas
- GET/POST /api/recetas — trae ingredientes con insumos anidados
- GET/PUT/DELETE /api/recetas/[id] — PUT elimina y recrea ingredientes
- GET/POST /api/obras — soporta filtro ?estado=activa|pausada|finalizada
- GET/PUT/DELETE /api/obras/[id] — DELETE pide ?confirmar=true si tiene rubros
- GET/POST /api/rubros — GET requiere ?obra_id=uuid; POST asigna orden automáticamente
- GET/PUT/DELETE /api/rubros/[id]
- GET/POST /api/items — GET requiere ?rubro_id=uuid; POST asigna orden automáticamente
- GET/PUT/DELETE /api/items/[id]
- GET/POST /api/mediciones — GET requiere ?item_id=uuid
- GET/PUT/DELETE /api/mediciones/[id]
- GET /api/presupuesto/[obraId] — soporta ?gastos_generales=10&beneficio=15&impuestos=21

## Hooks disponibles y funcionando
- useInsumos(tipo?) — lista, cargando, error, crearInsumo, actualizarInsumo, eliminarInsumo
- useRecetas() — lista, cargando, error, crearReceta, actualizarReceta, eliminarReceta
- useObras(estado?) — lista, cargando, error, crearObra, actualizarObra, eliminarObra
- useMediciones(obraId) — lista, cargando, error, crearMedicion, actualizarMedicion, eliminarMedicion

## Paleta de colores Pragma (Tailwind)
```
pragma-sidebar: #3B302B
pragma-accent:  #8B5E3C
pragma-fondo:   #F8F4EE
pragma-superficie: #E4DDCC
pragma-totales: #5C3A1E
pragma-texto:   #1C1410
pragma-textoClaro: #7A6A5A
```

## Estado actual del frontend
- Layout principal con Sidebar funcionando
- Pantalla de Insumos (app/insumos/page.tsx) construida pero con mejoras pendientes
- Pantalla Obras (app/obras/page.tsx) construida
- Pantalla Cómputo (app/obras/[id]/medicion/page.tsx) construida y funcionando con rubros, ítems y mediciones inline
- Sidebar actualizado con link a Obras

## Mejoras pendientes en pantalla de Insumos
- Unidades como select con opciones fijas: m2, u, m, m3, kg, km, t, l, h, d, a, ha, cm3, cm2, dm3, mu, cu, mes — más opción "Otra" que habilita campo de texto
- Poder agregar tipos de insumo personalizados además de material/mano_de_obra/equipo
- Carga inline tipo Excel: al presionar Enter en una fila se genera una nueva fila para seguir cargando sin ir al botón

## Lo que falta construir
1. Mejoras pantalla Insumos (ver arriba)
2. Pantalla Recetas completa
3. Pantalla Obras completa
4. Pantalla Presupuesto (dentro de cada obra, solo lectura)
5. Pantalla Presupuesto Final (app/obras/[id]/presupuesto/page.tsx)
6. Navegación interna por obra con pestañas Cómputo y Presupuesto

## Convenciones del proyecto
- Sin any en TypeScript
- Todos los componentes con 'use client' cuando usan hooks o eventos
- Formularios sin tag form de HTML, usar onClick y onChange
- Errores siempre visibles en pantalla, no solo en consola
