import { useEffect, useState } from "react";
import type { PresupuestoResponse } from "../types";

export function usePresupuesto(obraId: string) {
  const [lista, setLista] = useState<PresupuestoResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    fetch(`/api/presupuesto/${obraId}`)
      .then(async (res) => {
        const json: unknown = await res.json();
        if (!res.ok) throw new Error((json as { error: string }).error ?? "Error al cargar presupuesto");
        if (activo) setLista(json as PresupuestoResponse);
      })
      .catch((err: Error) => { if (activo) setError(err.message); })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [obraId]);

  return { lista, cargando, error };
}

export default usePresupuesto;
