import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { loguearError } from "@/lib/apiError";

// POST /api/planificacion
// Upsert sobre (item_id, mes): si pct_plan > 0 crea o actualiza, si <= 0 borra.
// Body: { item_id: string, mes: number, pct_plan: number | null | undefined }
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const body: unknown = await request.json();
    const { item_id, mes, pct_plan } = body as {
      item_id?: string;
      mes?: number;
      pct_plan?: number | null;
    };

    // ── Validaciones ────────────────────────────────────────────────
    if (!item_id || item_id.trim() === "") {
      return NextResponse.json(
        { error: "El item_id es obligatorio" },
        { status: 400 }
      );
    }

    if (mes === undefined || mes === null || !Number.isInteger(mes)) {
      return NextResponse.json(
        { error: "El mes debe ser un número entero" },
        { status: 400 }
      );
    }

    if (mes <= 0) {
      return NextResponse.json(
        { error: "El mes debe ser mayor a 0" },
        { status: 400 }
      );
    }

    // ── Lógica: si pct_plan <= 0 o undefined o null, borrar; si no, upsert ──
    if (pct_plan === undefined || pct_plan === null || pct_plan <= 0) {
      // Borrar el registro si existe
      const { error: deleteError } = await supabase
        .from("planificacion")
        .delete()
        .eq("item_id", item_id)
        .eq("mes", mes);

      if (deleteError) throw deleteError;

      return NextResponse.json(
        { message: "Planificación eliminada" },
        { status: 200 }
      );
    }

    // Validar que pct_plan esté en rango [0, 100]
    if (typeof pct_plan !== "number" || Number.isNaN(pct_plan)) {
      return NextResponse.json(
        { error: "El pct_plan debe ser un número" },
        { status: 400 }
      );
    }

    if (pct_plan < 0 || pct_plan > 100) {
      return NextResponse.json(
        { error: "El pct_plan debe estar entre 0 y 100" },
        { status: 400 }
      );
    }

    // ── Upsert usando la restricción UNIQUE (item_id, mes) ─────────────
    const { data, error } = await supabase
      .from("planificacion")
      .upsert(
        {
          item_id,
          mes,
          pct_plan,
        },
        { onConflict: "item_id,mes" }
      )
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "No se pudo procesar la planificación" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const mensaje = loguearError("POST /api/planificacion", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
