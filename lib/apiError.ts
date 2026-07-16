// Helpers para el manejo de errores en los route handlers.
//
// Los errores de Supabase/PostgREST se lanzan como objetos planos con la forma
// { message, code, details, hint } — NO son instancias de Error. Por eso un
// `error instanceof Error` los deja pasar y el mensaje real se pierde. Estos
// helpers extraen el mensaje de ambos casos y loguean el error original completo.

interface ErrorSupabase {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}

function esErrorSupabase(error: unknown): error is ErrorSupabase {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
}

/** Extrae el mensaje real de una instancia de Error o de un objeto plano de Supabase. */
export function extraerMensajeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (esErrorSupabase(error)) return error.message;
  return "Error interno del servidor";
}

/**
 * Loguea el error original completo (con contexto) y devuelve el mensaje real
 * listo para incluir en la respuesta 500.
 *
 * @param contexto Identificador del endpoint, ej: "GET /api/presupuesto/[obraId]".
 * @param error    El error capturado en el catch.
 */
export function loguearError(contexto: string, error: unknown): string {
  console.error(`[${contexto}]`, error);
  return extraerMensajeError(error);
}
