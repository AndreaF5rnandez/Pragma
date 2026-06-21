import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

// GET /api/rubros/[id]
// Devuelve el rubro con todos sus items, recetas y mediciones anidadas
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("rubros")
      .select(`
        *,
        items (
          *,
          receta:recetas (
            id,
            nombre,
            unidad_medida,
            created_at,
            updated_at
          ),
          mediciones (*)
        )
      `)
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Rubro no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// PUT /api/rubros/[id]
// Body: { nombre, orden? }
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();
    const body: unknown = await request.json();
    const { nombre, orden } = body as { nombre: string; orden?: number };

    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("rubros")
      .update({
        nombre: nombre.trim(),
        ...(typeof orden === "number" && { orden }),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Rubro no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// DELETE /api/rubros/[id]
// CASCADE elimina automáticamente todos sus items y mediciones
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: rubro, error: fetchError } = await supabase
      .from("rubros")
      .select("id")
      .eq("id", params.id)
      .single();

    if (fetchError || !rubro) {
      return NextResponse.json(
        { error: "Rubro no encontrado" },
        { status: 404 },
      );
    }

    const { error } = await supabase
      .from("rubros")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Rubro eliminado correctamente" },
      { status: 200 },
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}