import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const ITEM_SELECT = `
  *,
  receta:recetas (
    id,
    nombre,
    unidad_medida,
    created_at,
    updated_at
  )
`;

// GET /api/items?rubro_id=uuid
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const rubro_id = searchParams.get("rubro_id");

    if (!rubro_id) {
      return NextResponse.json(
        { error: "El parámetro rubro_id es obligatorio" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("items")
      .select(ITEM_SELECT)
      .eq("rubro_id", rubro_id)
      .order("orden", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// POST /api/items
// Body: { rubro_id, descripcion, unidad_medida, receta_id? }
// El orden se asigna automáticamente como el siguiente disponible para ese rubro
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const body: unknown = await request.json();
    const { rubro_id, receta_id, descripcion, unidad_medida } = body as {
      rubro_id: string;
      receta_id?: string | null;
      descripcion: string;
      unidad_medida: string;
    };

    if (!rubro_id) {
      return NextResponse.json(
        { error: "El rubro_id es obligatorio" },
        { status: 400 },
      );
    }

    if (!descripcion || descripcion.trim() === "") {
      return NextResponse.json(
        { error: "La descripción es obligatoria" },
        { status: 400 },
      );
    }

    if (!unidad_medida || unidad_medida.trim() === "") {
      return NextResponse.json(
        { error: "La unidad de medida es obligatoria" },
        { status: 400 },
      );
    }

    const { count, error: countError } = await supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("rubro_id", rubro_id);

    if (countError) throw countError;

    const orden = (count ?? 0) + 1;

    const { data, error } = await supabase
      .from("items")
      .insert({
        rubro_id,
        descripcion: descripcion.trim(),
        unidad_medida: unidad_medida.trim(),
        orden,
        ...(receta_id ? { receta_id } : {}),
      })
      .select(ITEM_SELECT)
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}