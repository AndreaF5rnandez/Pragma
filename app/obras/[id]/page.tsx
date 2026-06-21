'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Obra } from '@/types';

export default function ObraPage() {
  const params = useParams();
  const id = params.id as string;

  const [obra, setObra] = useState<Obra | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/obras/${id}`)
      .then(async (res) => {
        const json: unknown = await res.json();
        if (!res.ok) throw new Error((json as { error: string }).error ?? 'Obra no encontrada');
        setObra(json as Obra);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-pragma-textoClaro">Cargando...</p>
      </div>
    );
  }

  if (error || !obra) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">{error ?? 'Obra no encontrada'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-pragma-texto mb-2">{obra.nombre}</h1>
        <p className="text-pragma-textoClaro text-lg">{obra.cliente}</p>
      </div>

      <div className="flex gap-4">
        <Link
          href={`/obras/${id}/medicion`}
          className="flex flex-col items-center gap-2 bg-pragma-accent text-white px-8 py-6 rounded-xl font-medium text-base hover:opacity-90 transition-opacity shadow-sm min-w-[180px]"
        >
          <span className="text-2xl">📐</span>
          <span>Ir al Cómputo</span>
        </Link>

        <Link
          href={`/obras/${id}/presupuesto`}
          className="flex flex-col items-center gap-2 bg-pragma-totales text-white px-8 py-6 rounded-xl font-medium text-base hover:opacity-90 transition-opacity shadow-sm min-w-[180px]"
        >
          <span className="text-2xl">💰</span>
          <span>Ver Presupuesto</span>
        </Link>
      </div>
    </div>
  );
}
