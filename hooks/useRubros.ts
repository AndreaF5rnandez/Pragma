import { useCallback, useEffect, useState } from "react";
import type { Rubro } from "../types";

export function useRubros(obraId: string) {
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    fetch(`/api/rubros?obra_id=${obraId}`)
      .then(async (res) => {
        const json: unknown = await res.json();
        if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al cargar rubros");
        if (activo) setRubros(json as Rubro[]);
      })
      .catch((err: Error) => { if (activo) setError(err.message); })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [obraId]);

  const crearRubro = useCallback(async (nombre: string): Promise<Rubro> => {
    const res = await fetch("/api/rubros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obra_id: obraId, nombre }),
    });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al crear rubro");
    const nuevo = json as Rubro;
    setRubros((prev) => [...prev, nuevo]);
    return nuevo;
  }, [obraId]);

  const actualizarRubro = useCallback(async (
    id: string,
    datos: Pick<Rubro, "nombre" | "orden">,
  ): Promise<Rubro> => {
    const res = await fetch(`/api/rubros/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al actualizar rubro");
    const actualizado = json as Rubro;
    setRubros((prev) => prev.map((r) => (r.id === id ? actualizado : r)));
    return actualizado;
  }, []);

  const eliminarRubro = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/rubros/${id}`, { method: "DELETE" });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al eliminar rubro");
    setRubros((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { rubros, cargando, error, crearRubro, actualizarRubro, eliminarRubro };
}

export default useRubros;
