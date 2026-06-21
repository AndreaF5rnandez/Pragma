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
  const obraCliente = datos?.obra.cliente ?? '';

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Barra de navegación ── */}
      <header className="sticky top-0 z-10 bg-white border-b border-pragma-superficie px-6 h-12 flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-bold text-pragma-texto text-sm truncate">{obraNombre}</span>
          {obraCliente && (
            <span className="text-pragma-textoClaro text-sm shrink-0">· {obraCliente}</span>
          )}
        </div>
        <nav className="flex gap-1 shrink-0">
          <Link
            href={`/obras/${obraId}/medicion`}
            className="px-4 py-1.5 rounded text-sm font-medium text-pragma-textoClaro hover:text-pragma-texto hover:bg-pragma-fondo transition-colors"
          >
            Cómputo
          </Link>
          <Link
            href={`/obras/${obraId}/presupuesto`}
            className="px-4 py-1.5 rounded text-sm font-medium bg-pragma-accent text-white"
          >
            Presupuesto
          </Link>
        </nav>
      </header>

      {/* ── Cuerpo ── */}
      <div className="flex-1 bg-pragma-fondo p-8">
        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-pragma-textoClaro">Calculando presupuesto…</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-red-600">{error}</p>
          </div>
        ) : datos && datos.lineas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-pragma-textoClaro text-base">
              Esta obra no tiene mediciones cargadas todavía.
            </p>
            <Link
              href={`/obras/${obraId}/medicion`}
              className="bg-pragma-accent text-white px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Ir al Cómputo
            </Link>
          </div>
        ) : datos ? (
          <>
            {/* ── Tabla de rubros e ítems ── */}
            <div className="bg-white rounded-xl shadow-sm border border-pragma-superficie overflow-hidden mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-pragma-superficie/60 border-b border-pragma-superficie">
                    <th className="px-4 py-3 text-left font-semibold text-pragma-texto">
                      Ítem
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-pragma-texto w-20">
                      Unidad
                    </th>
                    <th className="px-3 py-3 text-right font-semibold text-pragma-texto w-32">
                      Cantidad
                    </th>
                    <th className="px-3 py-3 text-right font-semibold text-pragma-texto w-36">
                      P. Unitario
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-pragma-texto w-36">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agruparPorRubro(datos.lineas).map((rubro, rubroIdx) => {
                    const fondoRubro =
                      rubroIdx % 2 === 0 ? 'bg-pragma-fondo' : 'bg-pragma-superficie/25';
                    const fondoItem =
                      rubroIdx % 2 === 0 ? 'bg-white' : 'bg-pragma-fondo/60';

                    return (
                      <Fragment key={rubro.rubro_id}>
                        {/* Cabecera del rubro */}
                        <tr className={fondoRubro}>
                          <td
                            colSpan={4}
                            className="px-4 py-2.5 font-bold text-pragma-texto border-t-2 border-pragma-superficie"
                          >
                            {rubro.rubro_nombre}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-pragma-totales tabular-nums border-t-2 border-pragma-superficie">
                            {formatPrecio(rubro.subtotal)}
                          </td>
                        </tr>

                        {/* Ítems del rubro */}
                        {rubro.lineas.map((linea) => (
                          <tr
                            key={linea.item_id}
                            className={`border-b border-pragma-superficie/40 ${fondoItem}`}
                          >
                            <td className="px-4 py-2.5 pl-8 text-pragma-texto">
                              {linea.receta_nombre}
                            </td>
                            <td className="px-3 py-2.5 text-center text-pragma-textoClaro">
                              {linea.unidad}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-pragma-texto">
                              {formatNum(linea.cantidad_total)}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-pragma-texto">
                              {formatPrecio(linea.precio_unitario)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-medium text-pragma-texto">
                              {formatPrecio(linea.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Totales ── */}
            <div className="flex justify-end">
              <div className="bg-white rounded-xl shadow-sm border border-pragma-superficie overflow-hidden w-full max-w-sm">
                <div className="px-5 py-3 flex justify-between items-center border-b border-pragma-superficie/50">
                  <span className="text-sm text-pragma-textoClaro">Subtotal de obra</span>
                  <span className="text-sm font-medium text-pragma-texto tabular-nums">
                    {formatPrecio(datos.totales.subtotal)}
                  </span>
                </div>
                <div className="px-5 py-3 flex justify-between items-center border-b border-pragma-superficie/50">
                  <span className="text-sm text-pragma-textoClaro">
                    Gastos generales ({datos.coeficientes.gastos_generales}%)
                  </span>
                  <span className="text-sm font-medium text-pragma-texto tabular-nums">
                    {formatPrecio(datos.totales.gastos_generales)}
                  </span>
                </div>
                <div className="px-5 py-3 flex justify-between items-center border-b border-pragma-superficie/50">
                  <span className="text-sm text-pragma-textoClaro">
                    Beneficio ({datos.coeficientes.beneficio}%)
                  </span>
                  <span className="text-sm font-medium text-pragma-texto tabular-nums">
                    {formatPrecio(datos.totales.beneficio)}
                  </span>
                </div>
                <div className="px-5 py-3 flex justify-between items-center border-b border-pragma-superficie/50">
                  <span className="text-sm text-pragma-textoClaro">
                    Impuestos ({datos.coeficientes.impuestos}%)
                  </span>
                  <span className="text-sm font-medium text-pragma-texto tabular-nums">
                    {formatPrecio(datos.totales.impuestos)}
                  </span>
                </div>
                <div className="px-5 py-4 flex justify-between items-center bg-pragma-totales/5">
                  <span className="text-base font-bold text-pragma-totales">Total final</span>
                  <span className="text-2xl font-bold text-pragma-totales tabular-nums">
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
