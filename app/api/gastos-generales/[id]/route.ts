import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

// PUT /api/gastos-generales/[id]
// Body: { concepto?, monto? }
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();
    const body: unknown = await request.json();
    const { concepto, monto } = body as { concepto?: string; monto?: number };

    if (concepto !== undefined && concepto.trim() === "") {
      return NextResponse.json(
        { error: "El concepto no puede estar vacío" },
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

    const { data, error } = await supabase
      .from("gastos_generales")
      .update({
        ...(concepto !== undefined && { concepto: concepto.trim() }),
        ...(monto !== undefined && { monto }),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Gasto general no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// DELETE /api/gastos-generales/[id]
// No se puede eliminar una línea predefinida
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: gasto, error: fetchError } = await supabase
      .from("gastos_generales")
      .select("id, es_predefinido")
      .eq("id", params.id)
      .single();

    if (fetchError || !gasto) {
      return NextResponse.json(
        { error: "Gasto general no encontrado" },
        { status: 404 },
      );
    }

    if (gasto.es_predefinido) {
      return NextResponse.json(
        { error: "No se puede eliminar un gasto predefinido" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("gastos_generales")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Gasto general eliminado correctamente" },
      { status: 200 },
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
