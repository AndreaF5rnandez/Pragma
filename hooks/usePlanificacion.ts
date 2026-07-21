'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PlanificacionResponse } from '@/types';

export function usePlanificacion(obraId: string) {
  const [datos, setDatos] = useState<PlanificacionResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de planificación
  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    fetch(`/api/planificacion/${obraId}`)
      .then(async (res) => {
        const json: unknown = await res.json();
        if (!res.ok) {
          throw new Error((json as { error: string }).error ?? 'Error al cargar planificación');
        }
        if (activo) setDatos(json as PlanificacionResponse);
      })
      .catch((err: Error) => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [obraId]);

  // Guardar un porcentaje de celda (upsert/delete)
  const guardarCelda = useCallback(
    async (item_id: string, mes: number, pct_plan: number | null): Promise<void> => {
      const res = await fetch('/api/planificacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id, mes, pct_plan }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        throw new Error((json as { error: string }).error ?? 'Error al guardar celda');
      }
      // Recargar datos después de actualizar
      const reloadRes = await fetch(`/api/planificacion/${obraId}`);
      const reloadJson: unknown = await reloadRes.json();
      if (reloadRes.ok) {
        setDatos(reloadJson as PlanificacionResponse);
      }
    },
    [obraId]
  );

  // Guardar configuración de la obra (plazo_meses, fecha_inicio)
  const guardarConfiguracion = useCallback(
    async (
      plazo_meses: number | null,
      fecha_inicio: string
    ): Promise<void> => {
      // Primero obtener la obra actual para no perder otros campos
      const obraRes = await fetch(`/api/obras/${obraId}`);
      const obraJson: unknown = await obraRes.json();
      if (!obraRes.ok) {
        throw new Error('Error al cargar obra');
      }
      const obraActual = obraJson as Record<string, unknown>;

      // Actualizar la obra con los nuevos valores
      const res = await fetch(`/api/obras/${obraId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...obraActual,
          plazo_meses,
          fecha_inicio,
        }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        throw new Error((json as { error: string }).error ?? 'Error al guardar configuración');
      }
      // Recargar datos para reflejar el plazo_meses actualizado
      const reloadRes = await fetch(`/api/planificacion/${obraId}`);
      const reloadJson: unknown = await reloadRes.json();
      if (reloadRes.ok) {
        setDatos(reloadJson as PlanificacionResponse);
      }
    },
    [obraId]
  );

  return { datos, cargando, error, guardarCelda, guardarConfiguracion };
}

export default usePlanificacion;
