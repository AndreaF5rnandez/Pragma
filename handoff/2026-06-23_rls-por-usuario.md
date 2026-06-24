# Handoff — RLS por usuario

**Fecha:** 2026-06-23

## Qué se hizo

Se configuró Row Level Security (RLS) en Supabase para que cada usuario autenticado solo pueda ver y modificar sus propios datos.

---

## Archivos creados/modificados

### `supabase/migrations/003_rls.sql` — NUEVO

Migración completa lista para ejecutar en el SQL Editor de Supabase. Contiene:

1. `ALTER TABLE obras/insumos/recetas ADD COLUMN user_id UUID REFERENCES auth.users(id)` — columna que vincula cada registro con su dueño
2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` — activa RLS en las 7 tablas
3. Políticas SELECT/INSERT/UPDATE/DELETE para cada tabla

**Aún no fue ejecutada.** Ver sección "Paso 3" abajo.

### `app/api/obras/route.ts` — POST modificado

### `app/api/insumos/route.ts` — POST modificado

### `app/api/recetas/route.ts` — POST modificado

En los tres handlers POST se agrega, antes de cualquier validación:

```ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
```

Y `user_id: user.id` se incluye en el objeto de inserción.

---

## Estructura de acceso por tabla

| Tabla | Acceso directo por | Política |
|---|---|---|
| `obras` | `user_id` directo | `auth.uid() = user_id` |
| `insumos` | `user_id` directo | `auth.uid() = user_id` |
| `recetas` | `user_id` directo | `auth.uid() = user_id` |
| `receta_insumos` | vía `recetas.user_id` | EXISTS en recetas |
| `rubros` | vía `obras.user_id` | EXISTS en obras |
| `items` | vía `rubros → obras.user_id` | EXISTS con JOIN |
| `mediciones` | vía `items → rubros → obras.user_id` | EXISTS con 2 JOINs |

---

## Paso 3 — Ejecutar la migración

**Obligatorio antes de que la app funcione con RLS activo.**

1. Abrir Supabase → SQL Editor
2. Pegar y ejecutar el contenido de `supabase/migrations/003_rls.sql`

Si hay datos existentes en las tablas sin `user_id`, esas filas quedarán inaccesibles (user_id = NULL no cumple ninguna política). Para asignarlos manualmente:

```sql
UPDATE obras    SET user_id = '<uuid-del-usuario>' WHERE user_id IS NULL;
UPDATE insumos  SET user_id = '<uuid-del-usuario>' WHERE user_id IS NULL;
UPDATE recetas  SET user_id = '<uuid-del-usuario>' WHERE user_id IS NULL;
```

El UUID del usuario se obtiene desde **Supabase → Authentication → Users**.

---

## Qué NO se tocó

- `PUT` y `DELETE` en las 3 rutas — RLS bloquea automáticamente operaciones sobre filas ajenas; no necesitan cambios en el backend
- Rutas de `rubros`, `items`, `mediciones` — ídem, RLS las protege vía las políticas de EXISTS
- Tipos en `types/index.ts` — no fue necesario agregar `user_id` porque el Supabase client sin tipos generados acepta los campos extra en el objeto de insert sin error de TypeScript
- Ninguna pantalla ni componente de UI

---

## Próximos pasos sugeridos

- Construir `app/obras/[id]/presupuesto/page.tsx`
- Considerar generar tipos de Supabase (`npx supabase gen types typescript`) para tener autocompletado de columnas incluyendo `user_id`
