'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Obra, PresupuestoLinea } from '@/types';

/* ─── Tipos locales ────────────────────────────────────────────────────────── */

type Totales = {
  subtotal: number;
  gastos_generales: number;
  beneficio: number;
  impuestos: number;
  total: number;
};

type Coeficientes = {
  gastos_generales: number;
  beneficio: number;
  impuestos: number;
};

type PresupuestoResponse = {
  obra: Obra;
  lineas: PresupuestoLinea[];
  totales: Totales;
  coeficientes: Coeficientes;
};

type RubroAgrupado = {
  rubro_id: string;
  rubro_nombre: string;
  lineas: PresupuestoLinea[];
  subtotal: number;
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatPrecio(v: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);
}

function formatNum(v: number) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 4 }).format(v);
}

function agruparPorRubro(lineas: PresupuestoLinea[]): RubroAgrupado[] {
  const map = new Map<string, RubroAgrupado>();
  for (const linea of lineas) {
    if (!map.has(linea.rubro_id)) {
      map.set(linea.rubro_id, {
        rubro_id: linea.rubro_id,
        rubro_nombre: linea.rubro_nombre,
        lineas: [],
        subtotal: 0,
      });
    }
    const rubro = map.get(linea.rubro_id)!;
    rubro.lineas.push(linea);
    rubro.subtotal += linea.subtotal;
  }
  return Array.from(map.values());
}

const MESH_GRADIENT = [
  'radial-gradient(ellipse at 15% 80%, rgba(200, 230, 76, 0.12) 0%, transparent 50%)',
  'radial-gradient(ellipse at 85% 20%, rgba(200, 180, 220, 0.15) 0%, transparent 50%)',
  'radial-gradient(ellipse at 80% 85%, rgba(180, 220, 210, 0.12) 0%, transparent 50%)',
  'radial-gradient(ellipse at 50% 50%, rgba(215, 210, 220, 0.3) 0%, transparent 70%)',
  'linear-gradient(135deg, #D8D6DE 0%, #CDCBD5 50%, #D2D0D8 100%)',
].join(', ');

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.55)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.60)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
};

/* ─── Página ───────────────────────────────────────────────────────────────── */

export default function PresupuestoPage() {
  const params = useParams();
  const obraId = params.id as string;

  const [datos, setDatos] = useState<PresupuestoResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    fetch(`/api/presupuesto/${obraId}`)
      .then(async (res) => {
        const json: unknown = await res.json();
        if (!res.ok)
          throw new Error((json as { error: string }).error ?? 'Error al cargar presupuesto');
        if (activo) setDatos(json as PresupuestoResponse);
      })
      .catch((err: Error) => { if (activo) setError(err.message); })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [obraId]);

  const obraNombre = datos?.obra.nombre ?? '…';

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: '#D5D4DC', background: MESH_GRADIENT }}
    >
      {/* ── Barra superior ── */}
      <header
        className="shrink-0 z-10 px-6 flex items-stretch gap-4"
        style={{
          height: '48px',
          background: 'rgba(255, 255, 255, 0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.50)',
        }}
      >
        <span className="font-semibold text-sm truncate flex-1 flex items-center" style={{ color: '#1A1A2E' }}>
          {obraNombre}
        </span>
        <nav className="flex h-full">
          <Link
            href={`/obras/${obraId}/medicion`}
            className="px-5 flex items-center text-sm font-medium border-b-2 border-transparent transition-colors"
            style={{ color: '#6B7080' }}
          >
            Cómputo
          </Link>
          <Link
            href={`/obras/${obraId}/presupuesto`}
            className="px-5 flex items-center text-sm font-semibold border-b-2"
            style={{ borderColor: '#1A1A2E', color: '#1A1A2E' }}
          >
            Presupuesto
          </Link>
        </nav>
      </header>

      {/* ── Cuerpo ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm" style={{ color: '#6B7080' }}>Calculando presupuesto…</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
          </div>
        ) : datos && datos.lineas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-sm" style={{ color: '#6B7080' }}>
              Esta obra no tiene mediciones cargadas todavía.
            </p>
            <Link
              href={`/obras/${obraId}/medicion`}
              className="px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: '#C8E64C', color: '#2A3300', borderRadius: '9999px' }}
            >
              Ir al Cómputo
            </Link>
          </div>
        ) : datos ? (
          <>
            {/* ── Tabla de rubros e ítems ── */}
            <div className="overflow-hidden mb-6" style={GLASS_CARD}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <th className="px-4 py-3 text-left" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7080' }}>
                      Ítem
                    </th>
                    <th className="px-3 py-3 text-center w-20" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7080' }}>
                      Unidad
                    </th>
                    <th className="px-3 py-3 text-right w-32" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7080' }}>
                      Cantidad
                    </th>
                    <th className="px-3 py-3 text-right w-36" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7080' }}>
                      P. Unitario
                    </th>
                    <th className="px-4 py-3 text-right w-36" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7080' }}>
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agruparPorRubro(datos.lineas).map((rubro) => (
                    <Fragment key={rubro.rubro_id}>
                      {/* Cabecera del rubro */}
                      <tr style={{ background: 'rgba(200,230,76,0.12)' }}>
                        <td
                          colSpan={4}
                          className="px-4 py-2.5 font-bold"
                          style={{ color: '#1A1A2E', borderTop: '1px solid rgba(0,0,0,0.06)' }}
                        >
                          {rubro.rubro_nombre}
                        </td>
                        <td
                          className="px-4 py-2.5 text-right font-bold font-mono tabular-nums"
                          style={{ color: '#1A1A2E', borderTop: '1px solid rgba(0,0,0,0.06)' }}
                        >
                          {formatPrecio(rubro.subtotal)}
                        </td>
                      </tr>

                      {/* Ítems del rubro */}
                      {rubro.lineas.map((linea) => (
                        <tr
                          key={linea.item_id}
                          className="hover:bg-black/[0.02] transition-colors"
                          style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                        >
                          <td className="px-4 py-2.5 pl-8" style={{ color: '#1A1A2E' }}>
                            {linea.receta_nombre}
                          </td>
                          <td className="px-3 py-2.5 text-center" style={{ color: '#6B7080' }}>
                            {linea.unidad}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                            {formatNum(linea.cantidad_total)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                            {formatPrecio(linea.precio_unitario)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums" style={{ color: '#1A1A2E' }}>
                            {formatPrecio(linea.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Totales ── */}
            <div className="flex justify-end">
              <div className="overflow-hidden w-full max-w-sm" style={GLASS_CARD}>
                <div className="px-5 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span className="text-sm" style={{ color: '#6B7080' }}>Subtotal de obra</span>
                  <span className="text-sm font-medium font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                    {formatPrecio(datos.totales.subtotal)}
                  </span>
                </div>
                <div className="px-5 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span className="text-sm" style={{ color: '#6B7080' }}>
                    Gastos generales ({datos.coeficientes.gastos_generales}%)
                  </span>
                  <span className="text-sm font-medium font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                    {formatPrecio(datos.totales.gastos_generales)}
                  </span>
                </div>
                <div className="px-5 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span className="text-sm" style={{ color: '#6B7080' }}>
                    Beneficio ({datos.coeficientes.beneficio}%)
                  </span>
                  <span className="text-sm font-medium font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                    {formatPrecio(datos.totales.beneficio)}
                  </span>
                </div>
                <div className="px-5 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <span className="text-sm" style={{ color: '#6B7080' }}>
                    Impuestos ({datos.coeficientes.impuestos}%)
                  </span>
                  <span className="text-sm font-medium font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                    {formatPrecio(datos.totales.impuestos)}
                  </span>
                </div>
                <div className="px-5 py-4 flex justify-between items-center" style={{ background: 'rgba(200,230,76,0.15)' }}>
                  <span className="text-base font-bold" style={{ color: '#1A1A2E' }}>Total final</span>
                  <span className="text-2xl font-bold font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                    {formatPrecio(datos.totales.total)}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
