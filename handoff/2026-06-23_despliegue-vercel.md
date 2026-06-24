# Handoff — Despliegue en Vercel

**Fecha:** 2026-06-23

## Qué se hizo

Primer despliegue del proyecto en Vercel. Surgieron dos problemas que se resolvieron:

---

## Problema 1 — RLS bloqueaba creación de obras

**Error:** `new row violates row-level security policy for table "obras"`

**Causa:** Supabase activa Row Level Security automáticamente en todas las tablas nuevas creadas desde el dashboard. Como la herramienta no tiene autenticación de usuarios, ninguna fila pasa la política por defecto (que bloquea todo).

**Fix:** Correr en el SQL Editor de Supabase:
```sql
ALTER TABLE insumos        DISABLE ROW LEVEL SECURITY;
ALTER TABLE recetas        DISABLE ROW LEVEL SECURITY;
ALTER TABLE receta_insumos DISABLE ROW LEVEL SECURITY;
ALTER TABLE obras          DISABLE ROW LEVEL SECURITY;
ALTER TABLE rubros         DISABLE ROW LEVEL SECURITY;
ALTER TABLE items          DISABLE ROW LEVEL SECURITY;
ALTER TABLE mediciones     DISABLE ROW LEVEL SECURITY;
```

---

## Problema 2 — Error de TypeScript en build de Vercel

**Error:** `Type error: ... ./app/api/recetas/[id]/route.ts:99:30`

**Causa:** El SDK de Supabase sin tipos de base de datos generados (`Database` generic) no puede inferir que `insumo_id` en `receta_insumos` es una FK muchos-a-uno. Infiere `insumo` como `array[]` en vez de objeto único. Localmente TypeScript es más permisivo con estas conversiones; Vercel corre el compilador en modo estricto y rechaza el cast.

**Archivos afectados:**
- `app/api/recetas/route.ts`
- `app/api/recetas/[id]/route.ts`

**Fix:** Cambiar `mapearReceta` en ambos archivos para aceptar `unknown` como parámetro y hacer el cast adentro de la función. Esto elimina el conflicto en el call site:

```ts
// Antes — TypeScript compara los tipos y falla
function mapearReceta(
  receta: Omit<RecetaConInsumos, "precio_unitario"> & { ingredientes?: ... }
): RecetaConInsumos { ... }

mapearReceta(data as Omit<RecetaConInsumos, "precio_unitario">)  // ❌ tipos incompatibles

// Después — el cast ocurre en unknown→T que siempre es válido
function mapearReceta(rawData: unknown): RecetaConInsumos {
  const receta = rawData as Omit<RecetaConInsumos, "precio_unitario">;
  ...
}

mapearReceta(data)  // ✓ limpio
```

---

## Sobre los warnings de npm en el log de Vercel

```
npm warn deprecated rimraf@3.0.2
npm warn deprecated eslint@8.57.1
...
```

Son **inofensivos**. Son deprecaciones de dependencias internas de Next.js/ESLint — no son errores, no afectan el funcionamiento y no son responsabilidad del proyecto. Vercel los muestra en el log de instalación pero no cortan el build.

---

## Variables de entorno en Vercel

Configurar en **Vercel → Project → Settings → Environment Variables**:

| Variable | Dónde encontrarla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role (si aplica) |

---

## Estado post-despliegue

- Build pasa sin errores de TypeScript
- RLS desactivado en todas las tablas
- App funcional en producción

## Próximos pasos

- Construir pantalla Presupuesto (`app/obras/[id]/presupuesto/page.tsx`)
- Considerar generar tipos de Supabase (`npx supabase gen types typescript`) para eliminar los casts manuales y tener autocompletado de tablas/columnas
