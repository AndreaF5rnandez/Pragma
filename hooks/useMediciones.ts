import { useCallback, useEffect, useState } from "react";
import type { Medicion } from "../types";

type MedicionInput = {
  descripcion: string;
  n?: number;
  largo?: number;
  ancho?: number;
  alto?: number;
};

export function useMediciones(itemId: string) {
  const [mediciones, setMediciones] = useState<Medicion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    fetch(`/api/mediciones?item_id=${itemId}`)
      .then(async (res) => {
        const json: unknown = await res.json();
        if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al cargar mediciones");
        if (activo) setMediciones(json as Medicion[]);
      })
      .catch((err: Error) => { if (activo) setError(err.message); })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [itemId]);

  const crearMedicion = useCallback(async (datos: MedicionInput): Promise<Medicion> => {
    const res = await fetch("/api/mediciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, ...datos }),
    });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al crear medición");
    const nueva = json as Medicion;
    setMediciones((prev) => [...prev, nueva]);
    return nueva;
  }, [itemId]);

  const actualizarMedicion = useCallback(async (
    id: string,
    datos: MedicionInput,
  ): Promise<Medicion> => {
    const res = await fetch(`/api/mediciones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al actualizar medición");
    const actualizada = json as Medicion;
    setMediciones((prev) => prev.map((m) => (m.id === id ? actualizada : m)));
    return actualizada;
  }, []);

  const eliminarMedicion = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/mediciones/${id}`, { method: "DELETE" });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al eliminar medición");
    setMediciones((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { mediciones, cargando, error, crearMedicion, actualizarMedicion, eliminarMedicion };
}

export default useMediciones;
