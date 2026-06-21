import { useCallback, useEffect, useState } from "react";
import type { RecetaConInsumos, RecetaInsumo } from "../types";

type RecetaInput = Omit<RecetaConInsumos, "id" | "created_at" | "updated_at" | "ingredientes" | "precio_unitario"> & {
  ingredientes: Array<Pick<RecetaInsumo, "insumo_id" | "cantidad">>;
};

export function useRecetas() {
  const [recetas, setRecetas] = useState<RecetaConInsumos[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    fetch("/api/recetas")
      .then(async (res) => {
        const json: unknown = await res.json();
        if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al cargar recetas");
        if (activo) setRecetas(json as RecetaConInsumos[]);
      })
      .catch((err: Error) => { if (activo) setError(err.message); })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, []);

  const crearReceta = useCallback(async (datos: RecetaInput): Promise<RecetaConInsumos> => {
    const res = await fetch("/api/recetas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: datos.nombre,
        unidad_medida: datos.unidad_medida,
        ingredientes: datos.ingredientes,
      }),
    });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al crear receta");
    const nueva = json as RecetaConInsumos;
    setRecetas((prev) =>
      [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    );
    return nueva;
  }, []);

  const actualizarReceta = useCallback(async (
    id: string,
    datos: RecetaInput,
  ): Promise<RecetaConInsumos> => {
    const res = await fetch(`/api/recetas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: datos.nombre,
        unidad_medida: datos.unidad_medida,
        ingredientes: datos.ingredientes,
      }),
    });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al actualizar receta");
    const actualizada = json as RecetaConInsumos;
    setRecetas((prev) => prev.map((r) => (r.id === id ? actualizada : r)));
    return actualizada;
  }, []);

  const eliminarReceta = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/recetas/${id}`, { method: "DELETE" });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al eliminar receta");
    setRecetas((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { recetas, cargando, error, crearReceta, actualizarReceta, eliminarReceta };
}

export default useRecetas;
