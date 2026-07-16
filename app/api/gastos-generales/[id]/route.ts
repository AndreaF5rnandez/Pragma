import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { loguearError } from "@/lib/apiError";
import type { GastoCategoria, GastoModalidad } from "@/types";

const CATEGORIAS: GastoCategoria[] = ["GGDOO", "GGDOE", "GGI"];
const MODALIDADES: GastoModalidad[] = ["mensual", "unico"];

// GET /api/gastos-generales/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("gastos_generales")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Gasto general no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const mensaje = loguearError("GET /api/gastos-generales/[id]", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// PUT /api/gastos-generales/[id]
// Body: { categoria?, descripcion?, modalidad?, monto?, meses? }
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();
    const body: unknown = await request.json();
    const { categoria, descripcion, modalidad, monto, meses } = body as {
      categoria?: GastoCategoria;
      descripcion?: string;
      modalidad?: GastoModalidad;
      monto?: number;
      meses?: number | null;
    };

    if (categoria !== undefined && !CATEGORIAS.includes(categoria)) {
      return NextResponse.json(
        { error: "La categoría debe ser GGDOO, GGDOE o GGI" },
        { status: 400 },
      );
    }

    if (descripcion !== undefined && descripcion.trim() === "") {
      return NextResponse.json(
        { error: "La descripción no puede estar vacía" },
        { status: 400 },
      );
    }

    if (modalidad !== undefined && !MODALIDADES.includes(modalidad)) {
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

    const cambios: Record<string, unknown> = {
      ...(categoria !== undefined && { categoria }),
      ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
      ...(modalidad !== undefined && { modalidad }),
      ...(monto !== undefined && { monto }),
      ...(meses !== undefined && { meses }),
    };

    // Si se pasa a modalidad 'unico', los meses dejan de tener sentido.
    if (modalidad === "unico") {
      cambios.meses = null;
    }

    if (Object.keys(cambios).length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("gastos_generales")
      .update(cambios)
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
    const mensaje = loguearError("PUT /api/gastos-generales/[id]", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// DELETE /api/gastos-generales/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: gasto, error: fetchError } = await supabase
      .from("gastos_generales")
      .select("id")
      .eq("id", params.id)
      .single();

    if (fetchError || !gasto) {
      return NextResponse.json(
        { error: "Gasto general no encontrado" },
        { status: 404 },
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
    const mensaje = loguearError("DELETE /api/gastos-generales/[id]", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
