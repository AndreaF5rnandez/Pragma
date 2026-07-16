import type { SupabaseClient } from "@supabase/supabase-js";
import type { GastoCategoria, GastoModalidad } from "../types";

/**
 * Semilla de gastos generales que se crea junto con el paquete empresario de
 * una obra. Todos arrancan en monto 0. El orden se asigna por posición.
 * Los mensuales heredan meses = obras.plazo_meses (o 1 si es null); los únicos
 * llevan meses = null.
 */
const GASTOS_SEMILLA: Array<{
  categoria: GastoCategoria;
  modalidad: GastoModalidad;
  descripcion: string;
}> = [
  { categoria: "GGDOO", modalidad: "mensual", descripcion: "Dirección técnica de obra" },
  { categoria: "GGDOO", modalidad: "mensual", descripcion: "Capataz" },
  { categoria: "GGDOO", modalidad: "mensual", descripcion: "Sereno / Vigilancia" },
  { categoria: "GGDOO", modalidad: "mensual", descripcion: "Administrativo de obra" },
  { categoria: "GGDOO", modalidad: "mensual", descripcion: "Energía eléctrica de obra" },
  { categoria: "GGDOO", modalidad: "mensual", descripcion: "Agua de construcción" },
  { categoria: "GGDOO", modalidad: "unico", descripcion: "Seguros de obra" },
  { categoria: "GGI", modalidad: "mensual", descripcion: "Alquiler de oficina" },
  { categoria: "GGI", modalidad: "mensual", descripcion: "Teléfono e internet" },
  { categoria: "GGI", modalidad: "mensual", descripcion: "Personal de oficina" },
  { categoria: "GGI", modalidad: "mensual", descripcion: "Movilidad de la empresa" },
];

/**
 * Inicializa el "Paquete Empresario" de una obra si todavía no existe.
 *
 * Idempotente: si la obra ya tiene fila en paquete_empresario no hace nada.
 * Solo cuando crea esa fila siembra además la lista de gastos_generales, para
 * no duplicar semillas en llamadas repetidas.
 *
 * @param supabase Cliente de Supabase (servidor).
 * @param obraId   Id de la obra a inicializar.
 */
export async function inicializarPaqueteEmpresario(
  supabase: SupabaseClient,
  obraId: string,
): Promise<void> {
  // ¿La obra ya tiene paquete? Si sí, nada que hacer.
  const { data: existente, error: existenteError } = await supabase
    .from("paquete_empresario")
    .select("id")
    .eq("obra_id", obraId)
    .maybeSingle();

  if (existenteError) throw existenteError;
  if (existente) return;

  // Crear la fila del paquete con los defaults de la tabla.
  const { error: insertError } = await supabase
    .from("paquete_empresario")
    .insert({ obra_id: obraId });

  if (insertError) {
    // Otra llamada concurrente pudo haberla creado primero (viola UNIQUE):
    // en ese caso no sembramos para evitar duplicados.
    if (insertError.code === "23505") return;
    throw insertError;
  }

  // meses por defecto para los mensuales = plazo de la obra (o 1 si no está).
  const { data: obra, error: obraError } = await supabase
    .from("obras")
    .select("plazo_meses")
    .eq("id", obraId)
    .single();

  if (obraError) throw obraError;

  const mesesDefault = obra?.plazo_meses ?? 1;

  const filas = GASTOS_SEMILLA.map((gasto, indice) => ({
    obra_id: obraId,
    categoria: gasto.categoria,
    descripcion: gasto.descripcion,
    modalidad: gasto.modalidad,
    monto: 0,
    meses: gasto.modalidad === "mensual" ? mesesDefault : null,
    orden: indice + 1,
  }));

  const { error: semillaError } = await supabase
    .from("gastos_generales")
    .insert(filas);

  if (semillaError) throw semillaError;
}
