import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { Obra } from "@/types";

// GET /api/obras
// Query params opcionales: ?estado=activa|pausada|finalizada
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");

    let query = supabase
      .from("obras")
      .select("*")
      .order("created_at", { ascending: false });

    if (estado) {
      const estadosValidos: Obra["estado"][] = ["activa", "pausada", "finalizada"];
      if (!estadosValidos.includes(estado as Obra["estado"])) {
        return NextResponse.json(
          { error: "El estado debe ser activa, pausada o finalizada" },
          { status: 400 }
        );
      }
      query = query.eq("estado", estado);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST /api/obras
// Body: { nombre, cliente, direccion?, fecha_inicio? }
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const body = await request.json();

    const { nombre, cliente, direccion, fecha_inicio } = body;

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

    const nuevaObra: Partial<Obra> = {
      nombre: nombre.trim(),
      cliente: cliente.trim(),
      estado: "activa", // siempre empieza activa
      ...(direccion && { direccion: direccion.trim() }),
      ...(fecha_inicio && { fecha_inicio }),
    };

    const { data, error } = await supabase
      .from("obras")
      .insert(nuevaObra)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}