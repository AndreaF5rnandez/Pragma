import { useCallback, useEffect, useState } from "react";
import type { PresupuestoResponse } from "../types";

export function usePresupuesto(obraId: string) {
  const [lista, setLista] = useState<PresupuestoResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`/api/presupuesto/${obraId}`);
      const json: unknown = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al cargar presupuesto");
      setLista(json as PresupuestoResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar presupuesto");
    } finally {
      setCargando(false);
    }
  }, [obraId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Se llama después de cada guardado (gasto, plazo, porcentaje) para traer
  // el presupuesto recalculado de punta a punta — no hay recálculo en cliente.
  return { lista, cargando, error, refrescar: cargar };
}

export default usePresupuesto;
