import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

// GET /api/mediciones/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("mediciones")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Medición no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// PUT /api/mediciones/[id]
// Body: { descripcion, n?, largo?, ancho?, alto? }
// cantidad_calculada la recalcula PostgreSQL automáticamente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();
    const body: unknown = await request.json();
    const { descripcion, n, largo, ancho, alto } = body as {
      descripcion: string;
      n?: number;
      largo?: number;
      ancho?: number;
      alto?: number;
    };

    if (!descripcion || descripcion.trim() === "") {
      return NextResponse.json(
        { error: "La descripción es obligatoria" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("mediciones")
      .update({
        descripcion: descripcion.trim(),
        n: typeof n === "number" ? n : 1,
        largo: typeof largo === "number" ? largo : null,
        ancho: typeof ancho === "number" ? ancho : null,
        alto: typeof alto === "number" ? alto : null,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Medición no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// DELETE /api/mediciones/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: medicion, error: fetchError } = await supabase
      .from("mediciones")
      .select("id")
      .eq("id", params.id)
      .single();

    if (fetchError || !medicion) {
      return NextResponse.json(
        { error: "Medición no encontrada" },
        { status: 404 },
      );
    }

    const { error } = await supabase
      .from("mediciones")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Medición eliminada correctamente" },
      { status: 200 },
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}