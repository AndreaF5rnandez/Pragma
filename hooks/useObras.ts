import { useCallback, useEffect, useState } from "react";
import type { Obra } from "../types";

export function useObras(estado?: Obra["estado"]) {
  const [obras, setObras] = useState<Obra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    const url = estado ? `/api/obras?estado=${estado}` : "/api/obras";

    fetch(url)
      .then(async (res) => {
        const json: unknown = await res.json();
        if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al cargar obras");
        if (activo) setObras(json as Obra[]);
      })
      .catch((err: Error) => { if (activo) setError(err.message); })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [estado]);

  const crearObra = useCallback(async (
    datos: Omit<Obra, "id" | "estado" | "created_at" | "updated_at">,
  ): Promise<Obra> => {
    const res = await fetch("/api/obras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al crear obra");
    const nueva = json as Obra;
    // La API devuelve ordenado por created_at DESC: la más nueva va primero
    setObras((prev) => [nueva, ...prev]);
    return nueva;
  }, []);

  const actualizarObra = useCallback(async (
    id: string,
    datos: Omit<Obra, "id" | "created_at" | "updated_at">,
  ): Promise<Obra> => {
    const res = await fetch(`/api/obras/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al actualizar obra");
    const actualizada = json as Obra;
    setObras((prev) => prev.map((o) => (o.id === id ? actualizada : o)));
    return actualizada;
  }, []);

  const eliminarObra = useCallback(async (id: string, confirmar = false): Promise<void> => {
    const url = confirmar ? `/api/obras/${id}?confirmar=true` : `/api/obras/${id}`;
    const res = await fetch(url, { method: "DELETE" });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al eliminar obra");
    setObras((prev) => prev.filter((o) => o.id !== id));
  }, []);

  return { obras, cargando, error, crearObra, actualizarObra, eliminarObra };
}

export default useObras;
