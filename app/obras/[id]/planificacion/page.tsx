'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { usePlanificacion } from '@/hooks/usePlanificacion';
import type { PlanificacionResponse } from '@/types';

/* ─── Estilo base (skill de diseño) ────────────────────────────────────────── */

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

/* Fondos casi opacos para celdas sticky: al flotar sobre el contenido que
 * scrollea necesitan tapar lo de atrás, por eso la opacidad alta. */
const BG_STICKY_LEFT = 'rgba(244, 243, 247, 0.96)';
const BG_HEADER = 'rgba(238, 237, 243, 0.96)';
const BG_CORNER = 'rgba(234, 233, 240, 0.98)';
const BG_FOOTER = 'rgba(236, 240, 224, 0.98)';
const BG_RUBRO_LEFT = 'rgba(236, 240, 224, 0.97)';
const BG_RUBRO = 'rgba(200, 230, 76, 0.10)';

const ANCHO_ITEM = 260;
const ANCHO_MES = 92;
const ANCHO_TOTAL = 104;

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatPrecio(v: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);
}

function formatNum(v: number) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(v);
}

type Estado = 'guardando' | 'guardado' | 'error';

const claveCelda = (itemId: string, mes: number) => `${itemId}::${mes}`;

function pctDesdeTexto(texto: string): number {
  const limpio = texto.trim();
  if (limpio === '') return 0;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : 0;
}

/* Color del total de fila según qué tan cerca está del 100% (validación blanda). */
function colorTotalFila(pct: number): string {
  if (Math.abs(pct - 100) < 0.005) return '#22C55E'; // llega justo
  if (pct > 100) return '#EF4444'; // se pasó
  return '#F59E0B'; // le falta
}

/* Semilla del estado local a partir de la respuesta del servidor. */
function semillaDesdeDatos(datos: PlanificacionResponse): {
  valores: Record<string, string>;
  guardados: Record<string, number>;
} {
  const valores: Record<string, string> = {};
  const guardados: Record<string, number> = {};
  for (const rubro of datos.rubros) {
    for (const item of rubro.items) {
      for (const p of item.planificacion) {
        const k = claveCelda(item.item_id, p.mes);
        const pct = Number(p.pct_plan);
        if (pct > 0) valores[k] = String(pct);
        guardados[k] = pct;
      }
    }
  }
  return { valores, guardados };
}

/* ─── Celda editable ───────────────────────────────────────────────────────── */

function Celda({
  valor,
  estado,
  onChange,
  onCommit,
  onFocus,
  onBlur,
}: {
  valor: string;
  estado: Estado | undefined;
  onChange: (v: string) => void;
  onCommit: () => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const ring =
    estado === 'error'
      ? '0 0 0 2px rgba(239, 68, 68, 0.55)'
      : estado === 'guardado'
      ? '0 0 0 2px rgba(34, 197, 94, 0.45)'
      : undefined;

  const puntoColor =
    estado === 'guardando'
      ? '#F59E0B'
      : estado === 'guardado'
      ? '#22C55E'
      : estado === 'error'
      ? '#EF4444'
      : undefined;

  return (
    <div className="relative w-full">
      <input
        type="number"
        min="0"
        max="100"
        step="1"
        inputMode="decimal"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={() => {
          onBlur();
          onCommit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className="w-full text-right font-mono tabular-nums text-sm rounded-[6px] px-1.5 py-1 bg-transparent border border-transparent focus:outline-none focus:border-[#C8E64C] transition-shadow"
        style={{ color: '#1A1A2E', boxShadow: ring }}
        aria-invalid={estado === 'error'}
        title={estado === 'error' ? 'No se pudo guardar — revisá el valor (0 a 100) y reintentá' : undefined}
      />
      {puntoColor && (
        <span
          className="absolute top-1 left-1 rounded-full"
          style={{
            width: '6px',
            height: '6px',
            background: puntoColor,
            boxShadow: estado === 'guardando' ? '0 0 0 2px rgba(245,158,11,0.25)' : undefined,
          }}
        />
      )}
    </div>
  );
}

/* ─── Grilla ───────────────────────────────────────────────────────────────── */

function Grilla({
  datos,
  guardarCelda,
}: {
  datos: PlanificacionResponse;
  guardarCelda: (itemId: string, mes: number, pct: number | null) => Promise<void>;
}) {
  const meses = datos.plazo_meses && datos.plazo_meses > 0 ? datos.plazo_meses : 0;

  const [valores, setValores] = useState<Record<string, string>>({});
  const [estados, setEstados] = useState<Record<string, Estado>>({});
  const [colapsados, setColapsados] = useState<Record<string, boolean>>({});

  // Refs para proteger, al re-sembrar tras un guardado, los borradores que el
  // usuario todavía está tocando o los que quedaron en error.
  const guardadosRef = useRef<Record<string, number>>({});
  const estadosRef = useRef<Record<string, Estado>>({});
  const focoRef = useRef<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  estadosRef.current = estados;

  // (Re)sembrar desde el servidor. Corre en la carga inicial y tras cada
  // refetch que dispara guardarCelda. Preserva la celda con foco y las que
  // están en error para no pisar lo que el usuario está editando.
  useEffect(() => {
    const { valores: v, guardados: g } = semillaDesdeDatos(datos);
    guardadosRef.current = g;
    setValores((prev) => {
      const siguiente = { ...v };
      const foco = focoRef.current;
      if (foco && prev[foco] !== undefined) siguiente[foco] = prev[foco];
      for (const [k, est] of Object.entries(estadosRef.current)) {
        if (est === 'error' && prev[k] !== undefined) siguiente[k] = prev[k];
      }
      return siguiente;
    });
  }, [datos]);

  useEffect(() => {
    const pendientes = timers.current;
    return () => {
      Object.values(pendientes).forEach(clearTimeout);
    };
  }, []);

  const marcarEstado = useCallback((k: string, est: Estado | null) => {
    setEstados((prev) => {
      if (est === null) {
        if (prev[k] === undefined) return prev;
        const copia = { ...prev };
        delete copia[k];
        return copia;
      }
      return { ...prev, [k]: est };
    });
  }, []);

  const commit = useCallback(
    async (itemId: string, mes: number) => {
      const k = claveCelda(itemId, mes);
      const pct = pctDesdeTexto(valores[k] ?? '');
      const persistido = guardadosRef.current[k] ?? 0;

      // Valor fuera de rango: marca de error localizada, sin pegarle al server.
      if (pct < 0 || pct > 100) {
        marcarEstado(k, 'error');
        return;
      }

      // Sin cambios reales: normaliza el texto y limpia cualquier error viejo.
      if (pct === persistido) {
        setValores((prev) => ({ ...prev, [k]: pct === 0 ? '' : String(pct) }));
        marcarEstado(k, null);
        return;
      }

      marcarEstado(k, 'guardando');
      try {
        await guardarCelda(itemId, mes, pct);
        guardadosRef.current[k] = pct;
        setValores((prev) => ({ ...prev, [k]: pct === 0 ? '' : String(pct) }));
        marcarEstado(k, 'guardado');
        clearTimeout(timers.current[k]);
        timers.current[k] = setTimeout(() => marcarEstado(k, null), 1300);
      } catch {
        marcarEstado(k, 'error');
      }
    },
    [valores, guardarCelda, marcarEstado],
  );

  const setValor = useCallback((k: string, v: string) => {
    setValores((prev) => ({ ...prev, [k]: v }));
  }, []);

  // Subtotales por ítem (para traducir % a plata).
  const subtotalItem = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const rubro of datos.rubros) {
      for (const item of rubro.items) mapa[item.item_id] = item.subtotal_costo_costo;
    }
    return mapa;
  }, [datos]);

  // Cálculos en vivo: plata por celda = (pct/100) × subtotal del ítem.
  const calc = useMemo(() => {
    const montoPorMes = new Array<number>(meses).fill(0);
    const totalFilaPct: Record<string, number> = {};
    const rubroMontoPorMes: Record<string, number[]> = {};
    let granTotal = 0;

    for (const rubro of datos.rubros) {
      const acumRubro = new Array<number>(meses).fill(0);
      for (const item of rubro.items) {
        const sub = subtotalItem[item.item_id] ?? 0;
        let sumaPct = 0;
        for (let mes = 1; mes <= meses; mes++) {
          const pct = pctDesdeTexto(valores[claveCelda(item.item_id, mes)] ?? '');
          sumaPct += pct;
          const plata = (pct / 100) * sub;
          montoPorMes[mes - 1] += plata;
          acumRubro[mes - 1] += plata;
          granTotal += plata;
        }
        totalFilaPct[item.item_id] = sumaPct;
      }
      rubroMontoPorMes[rubro.rubro_id] = acumRubro;
    }

    return { montoPorMes, totalFilaPct, rubroMontoPorMes, granTotal };
  }, [datos, valores, meses, subtotalItem]);

  if (meses === 0) {
    return (
      <div style={GLASS_CARD} className="p-6">
        <p className="text-sm font-medium" style={{ color: '#1A1A2E' }}>
          Esta obra todavía no tiene un plazo definido.
        </p>
        <p className="text-sm mt-2" style={{ color: '#6B7080' }}>
          Configurá el <span className="font-medium">plazo de la obra</span> en{' '}
          <span className="font-medium">Presupuesto → Gastos Generales</span> para poder planificar por mes.
        </p>
      </div>
    );
  }

  const hayItems = datos.rubros.some((r) => r.items.length > 0);
  if (!hayItems) {
    return (
      <div style={GLASS_CARD} className="p-6">
        <p className="text-sm" style={{ color: '#6B7080' }}>
          Esta obra no tiene ítems con receta para planificar. Cargá el cómputo primero.
        </p>
      </div>
    );
  }

  const columnas = Array.from({ length: meses }, (_, i) => i + 1);

  return (
    <div className="overflow-auto" style={{ ...GLASS_CARD, maxHeight: 'calc(100vh - 200px)' }}>
      <table className="border-collapse" style={{ minWidth: '100%' }}>
        <thead>
          <tr>
            <th
              className="text-left px-4 py-3"
              style={{
                position: 'sticky',
                top: 0,
                left: 0,
                zIndex: 30,
                width: ANCHO_ITEM,
                minWidth: ANCHO_ITEM,
                background: BG_CORNER,
                backdropFilter: 'blur(8px)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#6B7080',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              Ítem
            </th>
            {columnas.map((mes) => (
              <th
                key={mes}
                className="px-2 py-3 text-center"
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 20,
                  width: ANCHO_MES,
                  minWidth: ANCHO_MES,
                  background: BG_HEADER,
                  backdropFilter: 'blur(8px)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#6B7080',
                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                Mes {mes}
              </th>
            ))}
            <th
              className="px-3 py-3 text-center"
              style={{
                position: 'sticky',
                top: 0,
                right: 0,
                zIndex: 30,
                width: ANCHO_TOTAL,
                minWidth: ANCHO_TOTAL,
                background: BG_CORNER,
                backdropFilter: 'blur(8px)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#6B7080',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                borderLeft: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {datos.rubros.map((rubro) => {
            const colapsado = colapsados[rubro.rubro_id] ?? false;
            const montoRubro = calc.rubroMontoPorMes[rubro.rubro_id] ?? [];
            const totalRubro = montoRubro.reduce((a, b) => a + b, 0);

            return (
              <Fragment key={rubro.rubro_id}>
                {/* Cabecera de rubro: toggle + subtotales por mes */}
                <tr style={{ background: BG_RUBRO }}>
                  <td
                    style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      width: ANCHO_ITEM,
                      minWidth: ANCHO_ITEM,
                      background: BG_RUBRO_LEFT,
                      backdropFilter: 'blur(8px)',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <button
                      onClick={() =>
                        setColapsados((prev) => ({ ...prev, [rubro.rubro_id]: !colapsado }))
                      }
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:opacity-80 transition-opacity"
                    >
                      <span
                        className="inline-block transition-transform"
                        style={{
                          color: '#6B7080',
                          fontSize: '11px',
                          transform: colapsado ? 'rotate(-90deg)' : 'rotate(0deg)',
                        }}
                      >
                        ▼
                      </span>
                      <span className="text-sm font-semibold truncate" style={{ color: '#1A1A2E' }}>
                        {rubro.rubro_nombre}
                      </span>
                    </button>
                  </td>
                  {columnas.map((mes) => (
                    <td
                      key={mes}
                      className="px-2 py-2.5 text-right font-mono tabular-nums"
                      style={{
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                        fontSize: '11px',
                        color: '#6B7080',
                      }}
                    >
                      {montoRubro[mes - 1] > 0 ? formatPrecio(montoRubro[mes - 1]) : '—'}
                    </td>
                  ))}
                  <td
                    className="px-3 py-2.5 text-right font-mono tabular-nums"
                    style={{
                      position: 'sticky',
                      right: 0,
                      zIndex: 10,
                      width: ANCHO_TOTAL,
                      minWidth: ANCHO_TOTAL,
                      background: BG_RUBRO_LEFT,
                      backdropFilter: 'blur(8px)',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                      borderLeft: '1px solid rgba(0,0,0,0.06)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#1A1A2E',
                    }}
                  >
                    {formatPrecio(totalRubro)}
                  </td>
                </tr>

                {/* Ítems del rubro (ocultos si está colapsado) */}
                {!colapsado &&
                  rubro.items.map((item) => {
                    const totalPct = calc.totalFilaPct[item.item_id] ?? 0;
                    return (
                      <tr key={item.item_id} className="hover:bg-black/[0.015] transition-colors">
                        <td
                          style={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 10,
                            width: ANCHO_ITEM,
                            minWidth: ANCHO_ITEM,
                            background: BG_STICKY_LEFT,
                            backdropFilter: 'blur(8px)',
                            borderBottom: '1px solid rgba(0,0,0,0.04)',
                          }}
                          className="px-4 py-2 pl-9"
                        >
                          <div className="text-sm truncate" style={{ color: '#1A1A2E' }}>
                            {item.descripcion}
                          </div>
                          <div className="text-xs" style={{ color: '#9CA3AF' }}>
                            {formatNum(item.cantidad_total)} {item.unidad_medida} ·{' '}
                            {formatPrecio(item.subtotal_costo_costo)}
                          </div>
                        </td>
                        {columnas.map((mes) => {
                          const k = claveCelda(item.item_id, mes);
                          return (
                            <td
                              key={mes}
                              className="px-1 py-1"
                              style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                            >
                              <Celda
                                valor={valores[k] ?? ''}
                                estado={estados[k]}
                                onChange={(v) => setValor(k, v)}
                                onCommit={() => commit(item.item_id, mes)}
                                onFocus={() => {
                                  focoRef.current = k;
                                }}
                                onBlur={() => {
                                  if (focoRef.current === k) focoRef.current = null;
                                }}
                              />
                            </td>
                          );
                        })}
                        <td
                          className="px-3 py-2 text-right font-mono tabular-nums"
                          style={{
                            position: 'sticky',
                            right: 0,
                            zIndex: 10,
                            width: ANCHO_TOTAL,
                            minWidth: ANCHO_TOTAL,
                            background: BG_STICKY_LEFT,
                            backdropFilter: 'blur(8px)',
                            borderBottom: '1px solid rgba(0,0,0,0.04)',
                            borderLeft: '1px solid rgba(0,0,0,0.06)',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: colorTotalFila(totalPct),
                          }}
                          title={
                            Math.abs(totalPct - 100) < 0.005
                              ? 'Ítem completo (100%)'
                              : totalPct > 100
                              ? 'Se pasó del 100%'
                              : 'Todavía no llega al 100%'
                          }
                        >
                          {formatNum(totalPct)}%
                        </td>
                      </tr>
                    );
                  })}
              </Fragment>
            );
          })}
        </tbody>

        {/* Fila de totales por mes: lo más importante de la pantalla */}
        <tfoot>
          <tr>
            <td
              className="px-4 py-3"
              style={{
                position: 'sticky',
                left: 0,
                bottom: 0,
                zIndex: 30,
                width: ANCHO_ITEM,
                minWidth: ANCHO_ITEM,
                background: BG_FOOTER,
                backdropFilter: 'blur(8px)',
                borderTop: '2px solid rgba(0,0,0,0.10)',
                fontSize: '13px',
                fontWeight: 700,
                color: '#1A1A2E',
              }}
            >
              Plata por mes
            </td>
            {columnas.map((mes) => (
              <td
                key={mes}
                className="px-2 py-3 text-right font-mono tabular-nums"
                style={{
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 20,
                  background: BG_FOOTER,
                  backdropFilter: 'blur(8px)',
                  borderTop: '2px solid rgba(0,0,0,0.10)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1A1A2E',
                }}
              >
                {formatPrecio(calc.montoPorMes[mes - 1])}
              </td>
            ))}
            <td
              className="px-3 py-3 text-right font-mono tabular-nums"
              style={{
                position: 'sticky',
                right: 0,
                bottom: 0,
                zIndex: 30,
                width: ANCHO_TOTAL,
                minWidth: ANCHO_TOTAL,
                background: BG_FOOTER,
                backdropFilter: 'blur(8px)',
                borderTop: '2px solid rgba(0,0,0,0.10)',
                borderLeft: '1px solid rgba(0,0,0,0.06)',
                fontSize: '12px',
                fontWeight: 700,
                color: '#1A1A2E',
              }}
            >
              {formatPrecio(calc.granTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ─── Página ───────────────────────────────────────────────────────────────── */

export default function PlanificacionPage() {
  const params = useParams();
  const obraId = params.id as string;
  const { datos, cargando, error, guardarCelda } = usePlanificacion(obraId);

  const obraNombre = datos?.obra_nombre ?? '…';

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ backgroundColor: '#D5D4DC', background: MESH_GRADIENT }}
    >
      {/* ── Header con tabs ── */}
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
            className="px-5 flex items-center text-sm font-medium border-b-2 border-transparent transition-colors"
            style={{ color: '#6B7080' }}
          >
            Presupuesto
          </Link>
          <Link
            href={`/obras/${obraId}/planificacion`}
            className="px-5 flex items-center text-sm font-semibold border-b-2"
            style={{ borderColor: '#1A1A2E', color: '#1A1A2E' }}
          >
            Planificación
          </Link>
        </nav>
      </header>

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-hidden p-6 flex flex-col gap-4">
        {cargando && (
          <div className="flex items-center justify-center h-64">
            <p style={{ color: '#7A6A5A' }}>Cargando planificación…</p>
          </div>
        )}

        {error && (
          <div
            className="p-4 rounded-2xl"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.30)',
            }}
          >
            <p style={{ color: '#DC2626' }} className="text-sm font-medium">
              {error}
            </p>
          </div>
        )}

        {datos && !error && (
          <>
            {/* Barra de contexto */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-5 py-3" style={GLASS_CARD}>
              <div>
                <span className="text-xs uppercase tracking-wide" style={{ color: '#6B7080' }}>
                  Total costo-costo
                </span>
                <p className="text-base font-bold font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                  {formatPrecio(datos.total_costo_costo)}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide" style={{ color: '#6B7080' }}>
                  Plazo
                </span>
                <p className="text-base font-semibold" style={{ color: '#1A1A2E' }}>
                  {datos.plazo_meses ? `${datos.plazo_meses} meses` : 'No configurado'}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide" style={{ color: '#6B7080' }}>
                  Inicio
                </span>
                <p className="text-base font-semibold" style={{ color: '#1A1A2E' }}>
                  {datos.fecha_inicio || 'No disponible'}
                </p>
              </div>
              <p className="text-xs flex-1 min-w-[220px]" style={{ color: '#9CA3AF' }}>
                Cargá el % de avance físico de cada ítem por mes. Se guarda solo al salir de la celda. La suma
                por fila debería llegar a 100%.
              </p>
            </div>

            <div className="flex-1 min-h-0">
              <Grilla datos={datos} guardarCelda={guardarCelda} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
