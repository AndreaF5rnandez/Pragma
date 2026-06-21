import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

// GET /api/rubros?obra_id=uuid
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
      .from("rubros")
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

// POST /api/rubros
// Body: { obra_id, nombre }
// El orden se asigna automáticamente como el siguiente disponible para esa obra
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const body: unknown = await request.json();
    const { obra_id, nombre } = body as { obra_id: string; nombre: string };

    if (!obra_id) {
      return NextResponse.json(
        { error: "El obra_id es obligatorio" },
        { status: 400 },
      );
    }

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 },
      );
    }

    const { count, error: countError } = await supabase
      .from("rubros")
      .select("*", { count: "exact", head: true })
      .eq("obra_id", obra_id);

    if (countError) throw countError;

    const orden = (count ?? 0) + 1;

    const { data, error } = await supabase
      .from("rubros")
      .insert({ obra_id, nombre: nombre.trim(), orden })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}