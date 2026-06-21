import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

// GET /api/mediciones?item_id=uuid
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const item_id = searchParams.get("item_id");

    if (!item_id) {
      return NextResponse.json(
        { error: "El parámetro item_id es obligatorio" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("mediciones")
      .select("*")
      .eq("item_id", item_id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// POST /api/mediciones
// Body: { item_id, descripcion, n?, largo?, ancho?, alto? }
// cantidad_calculada la calcula PostgreSQL automáticamente, nunca se envía
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const body: unknown = await request.json();
    const { item_id, descripcion, n, largo, ancho, alto } = body as {
      item_id: string;
      descripcion: string;
      n?: number;
      largo?: number;
      ancho?: number;
      alto?: number;
    };

    if (!item_id) {
      return NextResponse.json(
        { error: "El item_id es obligatorio" },
        { status: 400 },
      );
    }

    if (!descripcion || descripcion.trim() === "") {
      return NextResponse.json(
        { error: "La descripción es obligatoria" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("mediciones")
      .insert({
        item_id,
        descripcion: descripcion.trim(),
        ...(typeof n === "number" && { n }),
        ...(typeof largo === "number" && { largo }),
        ...(typeof ancho === "number" && { ancho }),
        ...(typeof alto === "number" && { alto }),
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