import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const ITEM_COMPLETO_SELECT = `
  *,
  receta:recetas (
    id,
    nombre,
    unidad_medida,
    created_at,
    updated_at
  ),
  mediciones (*)
`;

// GET /api/items/[id]
// Devuelve el ítem con su receta y todas sus mediciones
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("items")
      .select(ITEM_COMPLETO_SELECT)
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Ítem no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// PUT /api/items/[id]
// Body: { receta_id, descripcion, orden? }
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();
    const body: unknown = await request.json();
    const { receta_id, descripcion, orden } = body as {
      receta_id: string;
      descripcion: string;
      orden?: number;
    };

    if (!receta_id) {
      return NextResponse.json(
        { error: "El receta_id es obligatorio" },
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
      .from("items")
      .update({
        receta_id,
        descripcion: descripcion.trim(),
        ...(typeof orden === "number" && { orden }),
      })
      .eq("id", params.id)
      .select(ITEM_COMPLETO_SELECT)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Ítem no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// DELETE /api/items/[id]
// CASCADE elimina automáticamente todas sus mediciones
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: item, error: fetchError } = await supabase
      .from("items")
      .select("id")
      .eq("id", params.id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json(
        { error: "Ítem no encontrado" },
        { status: 404 },
      );
    }

    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Ítem eliminado correctamente" },
      { status: 200 },
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}