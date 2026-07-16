import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { GastoCategoria, GastoModalidad } from "@/types";

const CATEGORIAS: GastoCategoria[] = ["GGDOO", "GGDOE", "GGI"];
const MODALIDADES: GastoModalidad[] = ["mensual", "unico"];

// GET /api/gastos-generales?obra_id=uuid
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const obra_id = searchParams.get("obra_id");

    if (!obra_id) {
      return NextResponse.json(
        { error: "El parámetro obra_id es obligatorio" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("gastos_generales")
      .select("*")
      .eq("obra_id", obra_id)
      .order("orden", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// POST /api/gastos-generales
// Body: { obra_id, categoria, descripcion, modalidad, monto?, meses? }
// El orden se asigna automáticamente como max(orden) + 1 para esa obra.
// Para modalidad 'mensual', si no se envía meses se usa obras.plazo_meses (o 1).
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const body: unknown = await request.json();
    const { obra_id, categoria, descripcion, modalidad, monto, meses } = body as {
      obra_id?: string;
      categoria?: GastoCategoria;
      descripcion?: string;
      modalidad?: GastoModalidad;
      monto?: number;
      meses?: number | null;
    };

    if (!obra_id) {
      return NextResponse.json(
        { error: "El obra_id es obligatorio" },
        { status: 400 },
      );
    }

    if (!categoria || !CATEGORIAS.includes(categoria)) {
      return NextResponse.json(
        { error: "La categoría debe ser GGDOO, GGDOE o GGI" },
        { status: 400 },
      );
    }

    if (!descripcion || descripcion.trim() === "") {
      return NextResponse.json(
        { error: "La descripción es obligatoria" },
        { status: 400 },
      );
    }

    if (!modalidad || !MODALIDADES.includes(modalidad)) {
      return NextResponse.json(
        { error: "La modalidad debe ser mensual o unico" },
        { status: 400 },
      );
    }

    if (
      monto !== undefined &&
      (typeof monto !== "number" || Number.isNaN(monto) || monto < 0)
    ) {
      return NextResponse.json(
        { error: "El monto debe ser un número mayor o igual a 0" },
        { status: 400 },
      );
    }

    if (
      meses !== undefined &&
      meses !== null &&
      (typeof meses !== "number" || !Number.isInteger(meses) || meses < 0)
    ) {
      return NextResponse.json(
        { error: "Los meses deben ser un número entero mayor o igual a 0" },
        { status: 400 },
      );
    }

    // Orden = siguiente al final para esa obra.
    const { data: existentes, error: fetchError } = await supabase
      .from("gastos_generales")
      .select("orden")
      .eq("obra_id", obra_id)
      .order("orden", { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    const orden = (existentes?.[0]?.orden ?? 0) + 1;

    // meses solo aplica a mensuales. Si no se envió, se toma el plazo de la obra.
    let mesesFinal: number | null = null;
    if (modalidad === "mensual") {
      if (meses !== undefined && meses !== null) {
        mesesFinal = meses;
      } else {
        const { data: obra } = await supabase
          .from("obras")
          .select("plazo_meses")
          .eq("id", obra_id)
          .single();
        mesesFinal = obra?.plazo_meses ?? 1;
      }
    }

    const { data, error } = await supabase
      .from("gastos_generales")
      .insert({
        obra_id,
        categoria,
        descripcion: descripcion.trim(),
        modalidad,
        monto: monto ?? 0,
        meses: mesesFinal,
        orden,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
