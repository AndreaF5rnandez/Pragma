import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { inicializarPaqueteEmpresario } from "@/lib/paqueteEmpresario";

const CAMPOS = ["costo_financiero", "beneficio", "iva", "rentas"] as const;
type CampoPaquete = (typeof CAMPOS)[number];

// GET /api/paquete-empresario/[obraId]
// Inicializa el paquete (y siembra gastos generales) si todavía no existe,
// y devuelve la fila de porcentajes de la obra.
export async function GET(
  _request: NextRequest,
  { params }: { params: { obraId: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    await inicializarPaqueteEmpresario(supabase, params.obraId);

    const { data, error } = await supabase
      .from("paquete_empresario")
      .select("*")
      .eq("obra_id", params.obraId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Paquete empresario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// PUT /api/paquete-empresario/[obraId]
// Body: { costo_financiero?, beneficio?, iva?, rentas? }
// Upsert de los porcentajes (enteros de porcentaje: 5 = 5%).
export async function PUT(
  request: NextRequest,
  { params }: { params: { obraId: string } },
) {
  try {
    const supabase = createSupabaseServerClient();
    const body: unknown = await request.json();
    const valores = body as Partial<Record<CampoPaquete, number>>;

    const cambios: Record<string, number> = {};
    for (const campo of CAMPOS) {
      const valor = valores[campo];
      if (valor === undefined) continue;
      if (typeof valor !== "number" || Number.isNaN(valor) || valor < 0) {
        return NextResponse.json(
          { error: `El campo ${campo} debe ser un número mayor o igual a 0` },
          { status: 400 },
        );
      }
      cambios[campo] = valor;
    }

    // Aseguramos que la fila exista (y con ella la semilla de gastos generales).
    await inicializarPaqueteEmpresario(supabase, params.obraId);

    // Sin cambios (body vacío): devolvemos la fila tal cual quedó tras inicializar.
    const consulta = supabase.from("paquete_empresario");
    const { data, error } =
      Object.keys(cambios).length === 0
        ? await consulta.select("*").eq("obra_id", params.obraId).single()
        : await consulta
            .update(cambios)
            .eq("obra_id", params.obraId)
            .select()
            .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Paquete empresario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
