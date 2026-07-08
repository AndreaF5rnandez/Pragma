import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { Obra } from "@/types";

// GET /api/obras/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("obras")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Obra no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/obras/[id]
// Body: { nombre, cliente, direccion?, fecha_inicio?, estado }
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const body = await request.json();

    const {
      nombre,
      cliente,
      direccion,
      fecha_inicio,
      estado,
      gastos_generales_pct,
      beneficio_pct,
      impuestos_pct,
    } = body;

    // Validaciones
    if (!nombre || nombre.trim() === "") {
      return NextResponse.json(
        { error: "El nombre de la obra es obligatorio" },
        { status: 400 }
      );
    }

    if (!cliente || cliente.trim() === "") {
      return NextResponse.json(
        { error: "El nombre del cliente es obligatorio" },
        { status: 400 }
      );
    }

    const estadosValidos: Obra["estado"][] = ["activa", "pausada", "finalizada"];
    if (estado && !estadosValidos.includes(estado)) {
      return NextResponse.json(
        { error: "El estado debe ser activa, pausada o finalizada" },
        { status: 400 }
      );
    }

    for (const [campo, valor] of [
      ["gastos_generales_pct", gastos_generales_pct],
      ["beneficio_pct", beneficio_pct],
      ["impuestos_pct", impuestos_pct],
    ] as const) {
      if (valor !== undefined && (typeof valor !== "number" || Number.isNaN(valor) || valor < 0)) {
        return NextResponse.json(
          { error: `El campo ${campo} debe ser un número mayor o igual a 0` },
          { status: 400 }
        );
      }
    }

    const obraActualizada: Partial<Obra> = {
      nombre: nombre.trim(),
      cliente: cliente.trim(),
      ...(direccion !== undefined && { direccion: direccion?.trim() || null }),
      ...(fecha_inicio !== undefined && { fecha_inicio: fecha_inicio || null }),
      ...(estado && { estado }),
      ...(gastos_generales_pct !== undefined && { gastos_generales_pct }),
      ...(beneficio_pct !== undefined && { beneficio_pct }),
      ...(impuestos_pct !== undefined && { impuestos_pct }),
    };

    const { data, error } = await supabase
      .from("obras")
      .update(obraActualizada)
      .eq("id", params.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Obra no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/obras/[id]
// Query param opcional: ?confirmar=true para confirmar eliminación con mediciones
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const confirmar = searchParams.get("confirmar") === "true";

    // Verificar que la obra existe
    const { data: obra, error: obraError } = await supabase
      .from("obras")
      .select("id, nombre")
      .eq("id", params.id)
      .single();

    if (obraError || !obra) {
      return NextResponse.json(
        { error: "Obra no encontrada" },
        { status: 404 }
      );
    }

    // Contar mediciones asociadas
    const { count, error: countError } = await supabase
      .from("mediciones")
      .select("*", { count: "exact", head: true })
      .eq("obra_id", params.id);

    if (countError) throw countError;

    // Si tiene mediciones y no se confirmó, pedir confirmación
    if (count && count > 0 && !confirmar) {
      return NextResponse.json(
        {
          error: `La obra tiene ${count} medición${count === 1 ? "" : "es"} asociada${count === 1 ? "" : "s"} que se eliminarán. Para confirmar la eliminación agregá ?confirmar=true a la URL.`,
          mediciones_afectadas: count,
        },
        { status: 400 }
      );
    }

    // Eliminar la obra (las mediciones se eliminan por cascade en la DB)
    const { error: deleteError } = await supabase
      .from("obras")
      .delete()
      .eq("id", params.id);

    if (deleteError) throw deleteError;

    return NextResponse.json(
      { message: "Obra eliminada correctamente" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}