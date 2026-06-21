import { useCallback, useEffect, useState } from "react";
import type { Item, ItemConReceta } from "../types";

type ItemInput = Pick<Item, "receta_id" | "descripcion">;
type ItemUpdate = Pick<Item, "receta_id" | "descripcion" | "orden">;

export function useItems(rubroId: string) {
  const [items, setItems] = useState<ItemConReceta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    fetch(`/api/items?rubro_id=${rubroId}`)
      .then(async (res) => {
        const json: unknown = await res.json();
        if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al cargar ítems");
        if (activo) setItems(json as ItemConReceta[]);
      })
      .catch((err: Error) => { if (activo) setError(err.message); })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [rubroId]);

  const crearItem = useCallback(async (datos: ItemInput): Promise<ItemConReceta> => {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rubro_id: rubroId, ...datos }),
    });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al crear ítem");
    const nuevo = json as ItemConReceta;
    setItems((prev) => [...prev, nuevo]);
    return nuevo;
  }, [rubroId]);

  const actualizarItem = useCallback(async (
    id: string,
    datos: ItemUpdate,
  ): Promise<ItemConReceta> => {
    const res = await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al actualizar ítem");
    const actualizado = json as ItemConReceta;
    setItems((prev) => prev.map((i) => (i.id === id ? actualizado : i)));
    return actualizado;
  }, []);

  const eliminarItem = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    const json: unknown = await res.json();
    if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al eliminar ítem");
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, cargando, error, crearItem, actualizarItem, eliminarItem };
}

export default useItems;
