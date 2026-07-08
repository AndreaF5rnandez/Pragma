import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { calcularPrecioReceta, calcularTotalesPresupuesto } from "@/lib/calculos";
import type { Rubro, Item, Medicion, RecetaConInsumos, PresupuestoLinea } from "@/types";

// Tipos locales para la respuesta anidada de Supabase
type MedicionResumen = Pick<Medicion, "id" | "item_id" | "cantidad_calculada">;
type ItemPresupuesto = Item & { receta?: RecetaConInsumos | null; mediciones: MedicionResumen[] };
type RubroPresupuesto = Rubro & { items: ItemPresupuesto[] };

const TOTALES_VACIOS = { subtotal: 0, gastos_generales: 0, beneficio: 0, impuestos: 0, total: 0 };

// GET /api/presupuesto/[obraId]
// Los porcentajes de gastos generales, beneficio e impuestos se leen de la
// obra (columnas gastos_generales_pct, beneficio_pct, impuestos_pct), no de
// valores fijos en el código.
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

    const pctGastosGenerales = Number(obra.gastos_generales_pct ?? 10);
    const pctBeneficio = Number(obra.beneficio_pct ?? 15);
    const pctImpuestos = Number(obra.impuestos_pct ?? 21);

    const coeficientes = {
      gastos_generales: pctGastosGenerales,
      beneficio: pctBeneficio,
      impuestos: pctImpuestos,
    };

    // Traer rubros con items, recetas (ingredientes+insumos) y mediciones
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

    if (!rubrosData || rubrosData.length === 0) {
      return NextResponse.json(
        { obra, lineas: [], totales: TOTALES_VACIOS, coeficientes },
        { status: 200 },
      );
    }

    const rubros = rubrosData as RubroPresupuesto[];

    // Construir una línea de presupuesto por cada ítem
    const lineas: PresupuestoLinea[] = [];

    for (const rubro of rubros) {
      const itemsOrdenados = [...rubro.items].sort((a, b) => a.orden - b.orden);

      for (const item of itemsOrdenados) {
        if (!item.receta) continue;

        const cantidad_total = item.mediciones.reduce(
          (sum, m) => sum + m.cantidad_calculada,
          0,
        );
        const precio_unitario = calcularPrecioReceta(item.receta.ingredientes);
        const subtotal = cantidad_total * precio_unitario;

        lineas.push({
          rubro_id: rubro.id,
          rubro_nombre: rubro.nombre,
          item_id: item.id,
          receta_id: item.receta_id ?? '',
          receta_nombre: item.receta.nombre,
          unidad: item.unidad_medida,
          cantidad_total,
          precio_unitario,
          subtotal,
        });
      }
    }

    const totales = calcularTotalesPresupuesto(
      lineas,
      pctGastosGenerales,
      pctBeneficio,
      pctImpuestos,
    );

    return NextResponse.json({ obra, lineas, totales, coeficientes }, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}