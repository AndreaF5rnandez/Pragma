import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { inicializarPaqueteEmpresario } from "@/lib/paqueteEmpresario";
import { loguearError } from "@/lib/apiError";
import {
  calcularPrecioReceta,
  resumirGastosGenerales,
  calcularCierrePresupuesto,
} from "@/lib/calculos";
import type {
  Rubro,
  Item,
  Medicion,
  RecetaConInsumos,
  GastoGeneral,
  PaqueteEmpresario,
  PresupuestoRubro,
  PresupuestoItem,
} from "@/types";

// Tipos locales para la respuesta anidada de Supabase
type MedicionResumen = Pick<Medicion, "id" | "item_id" | "cantidad_calculada">;
type ItemPresupuesto = Item & { receta?: RecetaConInsumos | null; mediciones: MedicionResumen[] };
type RubroPresupuesto = Rubro & { items: ItemPresupuesto[] };

// Defaults del paquete si por algún motivo no se pudo leer la fila.
const PAQUETE_DEFAULT: Pick<
  PaqueteEmpresario,
  "costo_financiero" | "beneficio" | "iva" | "rentas"
> = { costo_financiero: 5, beneficio: 10, iva: 21, rentas: 2.75 };

// GET /api/presupuesto/[obraId]
// Ya no recibe porcentajes por query params: lee todo de la base (paquete
// empresario + gastos generales), inicializándolos si la obra aún no los tiene.
export async function GET(
  _request: NextRequest,
  { params }: { params: { obraId: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    // Verificar que la obra existe
    const { data: obra, error: obraError } = await supabase
      .from("obras")
      .select("*")
      .eq("id", params.obraId)
      .single();

    if (obraError || !obra) {
      return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    }

    // Crea paquete_empresario + semilla de gastos_generales si aún no existen.
    await inicializarPaqueteEmpresario(supabase, params.obraId);

    // ── Costo directo: rubros → items → receta (ingredientes) + mediciones ──
    const { data: rubrosData, error: rubrosError } = await supabase
      .from("rubros")
      .select(`
        *,
        items (
          *,
          receta:recetas (
            *,
            ingredientes:receta_insumos (
              *,
              insumo:insumos (*)
            )
          ),
          mediciones (
            id,
            item_id,
            cantidad_calculada
          )
        )
      `)
      .eq("obra_id", params.obraId)
      .order("orden", { ascending: true });

    if (rubrosError) throw rubrosError;

    const rubros = (rubrosData ?? []) as RubroPresupuesto[];

    const rubrosCalculados: PresupuestoRubro[] = [];
    for (const rubro of rubros) {
      const itemsOrdenados = [...rubro.items].sort((a, b) => a.orden - b.orden);
      const items: PresupuestoItem[] = [];

      for (const item of itemsOrdenados) {
        if (!item.receta) continue;

        const cantidad_total = item.mediciones.reduce(
          (suma, m) => suma + Number(m.cantidad_calculada),
          0,
        );
        const precio_unitario = calcularPrecioReceta(item.receta.ingredientes);
        const subtotal = cantidad_total * precio_unitario;

        items.push({
          item_id: item.id,
          receta_id: item.receta_id ?? "",
          receta_nombre: item.receta.nombre,
          unidad: item.unidad_medida,
          cantidad_total,
          precio_unitario,
          subtotal,
        });
      }

      const subtotalRubro = items.reduce((suma, it) => suma + it.subtotal, 0);
      rubrosCalculados.push({
        rubro_id: rubro.id,
        rubro_nombre: rubro.nombre,
        items,
        subtotal: subtotalRubro,
      });
    }

    const costo_costo = rubrosCalculados.reduce((suma, r) => suma + r.subtotal, 0);

    // ── Gastos generales ──────────────────────────────────────────────────
    const { data: gastosData, error: gastosError } = await supabase
      .from("gastos_generales")
      .select("*")
      .eq("obra_id", params.obraId)
      .order("orden", { ascending: true });

    if (gastosError) throw gastosError;

    const gastos = (gastosData ?? []) as GastoGeneral[];
    const gastosGenerales = resumirGastosGenerales(gastos, costo_costo);

    // ── Paquete empresario (porcentajes del cierre) ───────────────────────
    const { data: paqueteData, error: paqueteError } = await supabase
      .from("paquete_empresario")
      .select("*")
      .eq("obra_id", params.obraId)
      .maybeSingle();

    if (paqueteError) throw paqueteError;

    const paquete = (paqueteData as PaqueteEmpresario | null) ?? PAQUETE_DEFAULT;

    // ── Cierre en cascada ─────────────────────────────────────────────────
    const cierre = calcularCierrePresupuesto(
      costo_costo,
      gastosGenerales.total,
      paquete,
    );

    return NextResponse.json(
      {
        obra,
        costo_directo: { rubros: rubrosCalculados, costo_costo },
        gastos_generales: gastosGenerales,
        cierre,
      },
      { status: 200 },
    );
  } catch (error) {
    const mensaje = loguearError("GET /api/presupuesto/[obraId]", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
