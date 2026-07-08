import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

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
// Body: { obra_id, concepto, monto }
// El orden se asigna automáticamente como max(orden) + 1 para esa obra
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const body: unknown = await request.json();
    const { obra_id, concepto, monto } = body as {
      obra_id: string;
      concepto: string;
      monto: number;
    };

    if (!obra_id) {
      return NextResponse.json(
        { error: "El obra_id es obligatorio" },
        { status: 400 },
      );
    }

    if (!concepto || concepto.trim() === "") {
      return NextResponse.json(
        { error: "El concepto es obligatorio" },
        { status: 400 },
      );
    }

    if (typeof monto !== "number" || Number.isNaN(monto) || monto < 0) {
      return NextResponse.json(
        { error: "El monto debe ser un número mayor o igual a 0" },
        { status: 400 },
      );
    }

    const { data: existentes, error: fetchError } = await supabase
      .from("gastos_generales")
      .select("orden")
      .eq("obra_id", obra_id)
      .order("orden", { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    const orden = (existentes?.[0]?.orden ?? 0) + 1;

    const { data, error } = await supabase
      .from("gastos_generales")
      .insert({ obra_id, concepto: concepto.trim(), monto, orden })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
