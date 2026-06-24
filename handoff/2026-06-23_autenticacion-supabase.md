# Handoff — Autenticación con Supabase Auth

**Fecha:** 2026-06-23

## Qué se hizo

Se agregó autenticación completa al sistema Pragma usando Supabase Auth. Cualquier URL del sistema redirige a `/login` si el usuario no tiene sesión activa.

---

## Paquete instalado

```
@supabase/ssr
```

Supabase recomienda este paquete para Next.js App Router. Permite que el cliente del browser guarde la sesión en **cookies** (en lugar de localStorage), lo que hace posible que el middleware del servidor la lea y valide en cada request.

Sin este paquete, el middleware no puede acceder a la sesión porque no tiene acceso a `localStorage`.

---

## Archivos modificados

### `lib/supabase.ts` — cliente del browser

Cambió de `createClient` (supabase-js puro) a `createBrowserClient` (supabase/ssr).

```ts
// Antes
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(url, key);

// Después
import { createBrowserClient } from "@supabase/ssr";
export const supabase = createBrowserClient(url, key);
```

**Por qué:** `createBrowserClient` guarda la sesión en cookies en vez de localStorage, permitiendo que el middleware la lea.

---

### `lib/supabaseServer.ts` — cliente del servidor

Cambió de `createClient` a `createServerClient` con soporte de cookies de Next.js.

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch { /* Server Components no pueden escribir cookies */ }
      },
    },
  });
}
```

El `try/catch` en `setAll` es necesario porque los Server Components no pueden escribir cookies; solo los Route Handlers y Server Actions pueden. El middleware se encarga de refrescar las cookies.

---

### `middleware.ts` — NUEVO

Intercepta todos los requests (excepto rutas estáticas y `/api/*`). Verifica si hay usuario autenticado y redirige según corresponda.

```ts
// Rutas públicas: solo /login
// Usuario no autenticado → redirige a /login
// Usuario autenticado en /login → redirige a /obras
```

El matcher excluye:
- `_next/static` — archivos estáticos del build
- `_next/image` — optimización de imágenes
- `favicon.ico`
- `api` — rutas de API (usan anon key directamente, no auth)

---

### `app/login/page.tsx` — NUEVO

Pantalla de login con diseño glassmorphism. Usa `fixed inset-0 z-50` para cubrir el layout raíz (sidebar + header) sin necesidad de modificar `app/layout.tsx`.

Flujo:
1. Usuario ingresa email + contraseña
2. Se llama `supabase.auth.signInWithPassword()`
3. Éxito → `router.push('/obras')` + `router.refresh()`
4. Error → muestra "Email o contraseña incorrectos." en pantalla

Enter en cualquier campo también dispara el submit.

---

### `components/layout/Sidebar.tsx` — botón de cierre de sesión

Agregado al footer del sidebar, debajo de la navegación.

```ts
async function handleSignOut() {
  await supabase.auth.signOut();
  router.push('/login');
  router.refresh();
}
```

Estilo: `text-xs` en color `#9CA3AF`, hover a `#6B7080`, ícono de salida SVG a la izquierda. Encaja con el sistema glassmorphism sin elementos visuales invasivos.

---

## Cómo crear el primer usuario

El sistema no tiene registro de usuarios desde la UI. Los usuarios se crean desde el dashboard de Supabase:

1. Ir a **Supabase → Authentication → Users**
2. Clic en **"Add user"**
3. Ingresar email y contraseña
4. El usuario ya puede loguearse en la app

---

## Flujo completo post-login

```
Visitar cualquier URL
  → Middleware verifica sesión
  → Sin sesión → /login
  → Con sesión → pasa normalmente

Login exitoso
  → router.push('/obras') + router.refresh()
  → Middleware detecta sesión → pasa

Cerrar sesión (sidebar)
  → supabase.auth.signOut() borra cookies
  → router.push('/login')
  → Middleware detecta sin sesión en próximo request
```

---

## Estado post-implementación

- TypeScript compila sin errores (`npx tsc --noEmit`)
- Middleware protege todas las rutas excepto `/login` y assets estáticos
- Login con diseño glassmorphism consistente con el resto del sistema
- Botón "Cerrar sesión" funcional en sidebar

## Próximos pasos sugeridos

- Construir pantalla Presupuesto (`app/obras/[id]/presupuesto/page.tsx`)
- Considerar agregar "Olvidé mi contraseña" si se necesita en el futuro (requiere activar email en Supabase)
