import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { Insumo } from "@/types";

const TIPOS_VALIDOS: Insumo["tipo"][] = [
  "material",
  "mano_de_obra",
  "equipo",
];

function esTipoValido(valor: unknown): valor is Insumo["tipo"] {
  return (
    typeof valor === "string" &&
    TIPOS_VALIDOS.includes(valor as Insumo["tipo"])
  );
}

function obtenerMensajeError(error: unknown): string {
  return error instanceof Error ? error.message : "Error inesperado";
}

function validarPayloadInsumo(
  payload: Partial<Pick<Insumo, "nombre" | "unidad_medida" | "tipo" | "precio_unitario">>,
) {
  if (typeof payload.nombre !== "string" || payload.nombre.trim() === "") {
    return "El campo nombre es obligatorio.";
  }

  if (typeof payload.unidad_medida !== "string" || payload.unidad_medida.trim() === "") {
    return "El campo unidad es obligatorio.";
  }

  if (!esTipoValido(payload.tipo)) {
    return "El campo tipo debe ser material, mano_de_obra o equipo.";
  }

  const precio =
    typeof payload.precio_unitario === "number"
      ? payload.precio_unitario
      : Number(payload.precio_unitario);

  if (!Number.isFinite(precio) || precio < 0) {
    return "El campo precio debe ser un numero valido mayor o igual a 0.";
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const tipo = request.nextUrl.searchParams.get("tipo");

    if (tipo !== null && !esTipoValido(tipo)) {
      return NextResponse.json(
        {
          error:
            "El query parameter tipo debe ser material, mano_de_obra o equipo.",
        },
        { status: 400 },
      );
    }

    let query = supabase
      .from("insumos")
      .select("id, codigo, nombre, unidad_medida, tipo, precio_unitario, created_at, updated_at")
      .order("nombre", { ascending: true });

    if (tipo) {
      query = query.eq("tipo", tipo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json((data ?? []) as Insumo[], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: obtenerMensajeError(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body =
      (await request.json()) as Partial<
        Pick<Insumo, "codigo" | "nombre" | "unidad_medida" | "tipo" | "precio_unitario">
      >;

    const errorValidacion = validarPayloadInsumo(body);

    if (errorValidacion) {
      return NextResponse.json({ error: errorValidacion }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("insumos")
      .insert({
        codigo:
          typeof body.codigo === "string" && body.codigo.trim() !== ""
            ? body.codigo.trim()
            : null,
        nombre: body.nombre!.trim(),
        unidad_medida: body.unidad_medida!.trim(),
        tipo: body.tipo!,
        precio_unitario:
          typeof body.precio_unitario === "number"
            ? body.precio_unitario
            : Number(body.precio_unitario),
        user_id: user.id,
      })
      .select("id, codigo, nombre, unidad_medida, tipo, precio_unitario, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data as Insumo, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: obtenerMensajeError(error) },
      { status: 500 },
    );
  }
}
