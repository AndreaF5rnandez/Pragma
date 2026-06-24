import { useCallback, useEffect, useState } from "react";
import type { Insumo } from "../types";

export function useInsumos(tipo?: Insumo["tipo"]) {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    const url = tipo ? `/api/insumos?tipo=${tipo}` : "/api/insumos";

    fetch(url)
      .then(async (res) => {
        const json: unknown = await res.json();
        if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al cargar insumos");
        if (activo) setInsumos(json as Insumo[]);
      })
      .catch((err: Error) => { if (activo) setError(err.message); })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [tipo]);

  const crearInsumo = useCallback(async (
    datos: Omit<Insumo, "id" | "created_at" | "updated_at">,
  ): Promise<Insumo> => {
    const res = await fetch("/api/insumos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: datos.codigo,
        nombre: datos.nombre,
        unidad_medida: datos.unidad_medida,
        tipo: datos.tipo,
        precio_unitario: datos.precio_unitario,
      }),
    });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al crear insumo");
    const nuevo = json as Insumo;
    setInsumos((prev) =>
      [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    );
    return nuevo;
  }, []);

  const actualizarInsumo = useCallback(async (
    id: string,
    datos: Omit<Insumo, "id" | "created_at" | "updated_at">,
  ): Promise<Insumo> => {
    const res = await fetch(`/api/insumos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: datos.codigo,
        nombre: datos.nombre,
        unidad_medida: datos.unidad_medida,
        tipo: datos.tipo,
        precio_unitario: datos.precio_unitario,
      }),
    });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al actualizar insumo");
    const actualizado = json as Insumo;
    setInsumos((prev) => prev.map((i) => (i.id === id ? actualizado : i)));
    return actualizado;
  }, []);

  const eliminarInsumo = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/insumos/${id}`, { method: "DELETE" });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al eliminar insumo");
    setInsumos((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { insumos, cargando, error, crearInsumo, actualizarInsumo, eliminarInsumo };
}

export default useInsumos;
