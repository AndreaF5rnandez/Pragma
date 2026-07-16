'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { calcularCierrePresupuesto, calcularTotalGasto } from '@/lib/calculos';
import type { GastoGeneral, PaqueteEmpresario, PresupuestoResponse } from '@/types';

/* ─── Tipos locales ────────────────────────────────────────────────────────── */

type Paquete = Pick<PaqueteEmpresario, 'costo_financiero' | 'beneficio' | 'iva' | 'rentas'>;

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatPrecio(v: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);
}

function formatNum(v: number) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 4 }).format(v);
}

function formatCoeficiente(v: number) {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
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

/* ─── EditablePct ──────────────────────────────────────────────────────────── */
/* Porcentaje editable inline: click para convertir en input numérico, y
 * autosave (sin botón) al perder foco o confirmar con Enter. */

function EditablePct({
  label,
  valor,
  monto,
  guardando,
  onGuardar,
}: {
  label: string;
  valor: number;
  monto: number;
  guardando: boolean;
  onGuardar: (nuevoValor: number) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(String(valor));

  function entrarEdicion() {
    setBorrador(String(valor));
    setEditando(true);
  }

  function confirmar() {
    setEditando(false);
    const num = Number(borrador);
    if (Number.isNaN(num) || num < 0 || num === valor) return;
    onGuardar(num);
  }

  return (
    <div className="px-6 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      <span className="text-sm flex items-center gap-1" style={{ color: '#6B7080' }}>
        {label} (
        {editando ? (
          <input
            autoFocus
            type="number"
            min="0"
            step="0.01"
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            onBlur={confirmar}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); confirmar(); }
              if (e.key === 'Escape') { setEditando(false); }
            }}
            className="w-14 text-right font-mono tabular-nums border rounded-[6px] px-1 py-0.5 focus:outline-none"
            style={{
              color: '#1A1A2E',
              borderColor: '#C8E64C',
              boxShadow: '0 0 0 3px rgba(200,230,76,0.2)',
              background: 'rgba(255,255,255,0.8)',
            }}
          />
        ) : (
          <button
            onClick={entrarEdicion}
            className="font-mono tabular-nums underline decoration-dotted hover:opacity-70 transition-opacity"
            style={{ color: '#6B7080' }}
            title="Click para editar"
          >
            {valor}
          </button>
        )}
        %)
        {guardando && <span className="text-xs ml-1" style={{ color: '#9CA3AF' }}>guardando…</span>}
      </span>
      <span className="text-sm font-medium font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
        {formatPrecio(monto)}
      </span>
    </div>
  );
}

/* ─── GastoGeneralRow ──────────────────────────────────────────────────────── */
/* Línea de gasto general en formato de dos columnas: descripción (input de texto
 * siempre editable, autosave al perder foco) a la izquierda y monto (click
 * para editar, mismo patrón que EditablePct) a la derecha. */

function GastoGeneralRow({
  gasto,
  guardando,
  onGuardarDescripcion,
  onGuardarMonto,
  onEliminar,
}: {
  gasto: GastoGeneral;
  guardando: boolean;
  onGuardarDescripcion: (valor: string) => void;
  onGuardarMonto: (valor: number) => void;
  onEliminar: () => void;
}) {
  const [descripcion, setDescripcion] = useState(gasto.descripcion);
  const [editandoMonto, setEditandoMonto] = useState(false);
  const [borradorMonto, setBorradorMonto] = useState(String(gasto.monto));

  useEffect(() => setDescripcion(gasto.descripcion), [gasto.descripcion]);

  function confirmarDescripcion() {
    const valor = descripcion.trim();
    if (!valor) { setDescripcion(gasto.descripcion); return; }
    if (valor === gasto.descripcion) return;
    onGuardarDescripcion(valor);
  }

  function entrarEdicionMonto() {
    setBorradorMonto(String(gasto.monto));
    setEditandoMonto(true);
  }

  function confirmarMonto() {
    setEditandoMonto(false);
    const num = Number(borradorMonto);
    if (Number.isNaN(num) || num < 0 || num === gasto.monto) return;
    onGuardarMonto(num);
  }

  return (
    <div className="px-6 py-2.5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      <input
        type="text"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        onBlur={confirmarDescripcion}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        className="flex-1 min-w-0 text-sm bg-transparent border-b border-transparent hover:border-black/10 focus:outline-none focus:border-b-[#C8E64C] transition-colors"
        style={{ color: '#1A1A2E' }}
      />

      {editandoMonto ? (
        <input
          autoFocus
          type="number"
          min="0"
          step="0.01"
          value={borradorMonto}
          onChange={(e) => setBorradorMonto(e.target.value)}
          onBlur={confirmarMonto}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); confirmarMonto(); }
            if (e.key === 'Escape') { setEditandoMonto(false); }
          }}
          className="w-24 text-right font-mono tabular-nums border rounded-[6px] px-1 py-0.5 focus:outline-none"
          style={{
            color: '#1A1A2E',
            borderColor: '#C8E64C',
            boxShadow: '0 0 0 3px rgba(200,230,76,0.2)',
            background: 'rgba(255,255,255,0.8)',
          }}
        />
      ) : (
        <button
          onClick={entrarEdicionMonto}
          className="text-sm font-mono tabular-nums underline decoration-dotted hover:opacity-70 transition-opacity whitespace-nowrap"
          style={{ color: '#1A1A2E' }}
          title="Click para editar"
        >
          {formatPrecio(gasto.monto)}
        </button>
      )}

      {guardando && <span className="text-xs shrink-0" style={{ color: '#9CA3AF' }}>…</span>}

      <button
        onClick={onEliminar}
        className="text-xs shrink-0 hover:opacity-70 transition-opacity"
        style={{ color: '#EF4444' }}
        title="Eliminar gasto"
      >
        ✕
      </button>
    </div>
  );
}

/* ─── Página ───────────────────────────────────────────────────────────────── */
/* Documento vertical de una sola columna, ancho completo: tabla de ítems,
 * gastos generales detallados y cascada de precios, en ese orden, cada uno
 * en su propia glass card separada por 24px (mb-6). Sin panel lateral. */

export default function PresupuestoPage() {
  const params = useParams();
  const obraId = params.id as string;

  const [datos, setDatos] = useState<PresupuestoResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Porcentajes del paquete empresario: se seedean desde la respuesta del
  // endpoint principal y a partir de ahí viven en el cliente, para recalcular
  // el cierre al instante sin refetch.
  const [paquete, setPaquete] = useState<Paquete | null>(null);
  const [guardandoCampo, setGuardandoCampo] = useState<keyof Paquete | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  // Gastos generales detallados: también vienen del endpoint principal, pero
  // se editan en el cliente contra /api/gastos-generales/[id].
  const [gastosGenerales, setGastosGenerales] = useState<GastoGeneral[] | null>(null);
  const [gastosError, setGastosError] = useState<string | null>(null);
  const [guardandoGastoId, setGuardandoGastoId] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    fetch(`/api/presupuesto/${obraId}`)
      .then(async (res) => {
        const json: unknown = await res.json();
        if (!res.ok)
          throw new Error((json as { error: string }).error ?? 'Error al cargar presupuesto');
        const respuesta = json as PresupuestoResponse;
        if (activo) {
          setDatos(respuesta);
          setPaquete({
            costo_financiero: respuesta.cierre.costo_financiero_pct,
            beneficio: respuesta.cierre.beneficio_pct,
            iva: respuesta.cierre.impuestos.iva_pct,
            rentas: respuesta.cierre.impuestos.rentas_pct,
          });
          setGastosGenerales(respuesta.gastos_generales.lista);
        }
      })
      .catch((err: Error) => { if (activo) setError(err.message); })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [obraId]);

  // Total de ítems, para distinguir "obra sin mediciones" de "obra con datos".
  const totalItems = useMemo(
    () => datos?.costo_directo.rubros.reduce((sum, r) => sum + r.items.length, 0) ?? 0,
    [datos],
  );

  // Total de gastos generales recalculado en el cliente (mensual = monto × meses).
  const totalGastosGenerales = useMemo(
    () => (gastosGenerales ?? []).reduce((sum, g) => sum + calcularTotalGasto(g), 0),
    [gastosGenerales],
  );

  const pctGastosSobreDirecto = useMemo(() => {
    if (!datos || datos.costo_directo.costo_costo <= 0) return 0;
    return (totalGastosGenerales / datos.costo_directo.costo_costo) * 100;
  }, [totalGastosGenerales, datos]);

  // Cierre recalculado en el cliente a partir del costo directo ya cargado,
  // los gastos generales (editables) y el paquete empresario (editable).
  const cierre = useMemo(() => {
    if (!datos || !paquete) return null;
    return calcularCierrePresupuesto(datos.costo_directo.costo_costo, totalGastosGenerales, paquete);
  }, [datos, paquete, totalGastosGenerales]);

  async function guardarCoeficiente(campo: keyof Paquete, nuevoValor: number) {
    if (!paquete) return;
    const anterior = paquete[campo];

    // Optimista: se actualiza (y recalcula el cierre) antes de que vuelva la respuesta.
    setPaquete((prev) => (prev ? { ...prev, [campo]: nuevoValor } : prev));
    setGuardandoCampo(campo);
    setErrorGuardado(null);

    try {
      const res = await fetch(`/api/paquete-empresario/${obraId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [campo]: nuevoValor }),
      });
      const json: unknown = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error ?? 'Error al guardar');
    } catch (err) {
      // Revertir si falló el guardado
      setPaquete((prev) => (prev ? { ...prev, [campo]: anterior } : prev));
      setErrorGuardado(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardandoCampo(null);
    }
  }

  async function guardarGastoGeneral(id: string, campo: 'descripcion' | 'monto', valor: string | number) {
    if (!gastosGenerales) return;
    const anterior = gastosGenerales.find((g) => g.id === id);
    if (!anterior) return;

    setGastosGenerales((prev) =>
      prev ? prev.map((g) => (g.id === id ? { ...g, [campo]: valor } : g)) : prev,
    );
    setGuardandoGastoId(id);
    setGastosError(null);

    try {
      const res = await fetch(`/api/gastos-generales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [campo]: valor }),
      });
      const json: unknown = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error ?? 'Error al guardar');
    } catch (err) {
      setGastosGenerales((prev) =>
        prev ? prev.map((g) => (g.id === id ? anterior : g)) : prev,
      );
      setGastosError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardandoGastoId(null);
    }
  }

  async function agregarGastoGeneral() {
    setGastosError(null);
    try {
      const res = await fetch('/api/gastos-generales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obra_id: obraId,
          categoria: 'GGDOO',
          descripcion: 'Nuevo gasto',
          modalidad: 'unico',
          monto: 0,
        }),
      });
      const json: unknown = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error ?? 'Error al crear el gasto');
      setGastosGenerales((prev) => (prev ? [...prev, json as GastoGeneral] : [json as GastoGeneral]));
    } catch (err) {
      setGastosError(err instanceof Error ? err.message : 'Error al crear el gasto');
    }
  }

  async function eliminarGastoGeneral(id: string) {
    if (!gastosGenerales) return;
    const anterior = gastosGenerales;
    setGastosGenerales((prev) => (prev ? prev.filter((g) => g.id !== id) : prev));
    setGastosError(null);

    try {
      const res = await fetch(`/api/gastos-generales/${id}`, { method: 'DELETE' });
      const json: unknown = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error ?? 'Error al eliminar el gasto');
    } catch (err) {
      setGastosGenerales(anterior);
      setGastosError(err instanceof Error ? err.message : 'Error al eliminar el gasto');
    }
  }

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

      {/* ── Cuerpo: documento vertical, una sola columna, ancho completo ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm" style={{ color: '#6B7080' }}>Calculando presupuesto…</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
          </div>
        ) : datos && totalItems === 0 ? (
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
        ) : datos && paquete && cierre ? (
          <div className="w-full max-w-none">
            {/* ── SECCIÓN 1: Tabla de presupuesto ── */}
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
                  {datos.costo_directo.rubros.map((rubro) => (
                    <Fragment key={rubro.rubro_id}>
                      {/* Cabecera del rubro */}
                      <tr style={{ background: 'rgba(200,230,76,0.08)' }}>
                        <td
                          colSpan={4}
                          className="px-4 py-2.5"
                          style={{ color: '#1A1A2E', fontWeight: 600, borderTop: '1px solid rgba(0,0,0,0.06)' }}
                        >
                          {rubro.rubro_nombre}
                        </td>
                        <td
                          className="px-4 py-2.5 text-right font-mono tabular-nums"
                          style={{ color: '#1A1A2E', fontWeight: 600, borderTop: '1px solid rgba(0,0,0,0.06)' }}
                        >
                          {formatPrecio(rubro.subtotal)}
                        </td>
                      </tr>

                      {/* Ítems del rubro */}
                      {rubro.items.map((item) => (
                        <tr
                          key={item.item_id}
                          className="hover:bg-black/[0.02] transition-colors"
                          style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                        >
                          <td className="px-4 py-2.5 pl-8" style={{ color: '#1A1A2E' }}>
                            {item.receta_nombre}
                          </td>
                          <td className="px-3 py-2.5 text-center" style={{ color: '#6B7080' }}>
                            {item.unidad}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                            {formatNum(item.cantidad_total)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                            {formatPrecio(item.precio_unitario)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums" style={{ color: '#1A1A2E' }}>
                            {formatPrecio(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid rgba(0,0,0,0.10)' }}>
                    <td colSpan={4} className="px-4 py-3 text-right" style={{ fontWeight: 700, color: '#1A1A2E' }}>
                      Total costo directo
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums" style={{ fontWeight: 700, color: '#1A1A2E' }}>
                      {formatPrecio(datos.costo_directo.costo_costo)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── SECCIÓN 2: Gastos generales de obra ── */}
            <div className="overflow-hidden mb-6" style={GLASS_CARD}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <span className="text-base font-semibold" style={{ color: '#1A1A2E' }}>
                  Gastos generales de obra
                </span>
              </div>

              {(gastosGenerales ?? []).map((gasto) => (
                <GastoGeneralRow
                  key={gasto.id}
                  gasto={gasto}
                  guardando={guardandoGastoId === gasto.id}
                  onGuardarDescripcion={(valor) => guardarGastoGeneral(gasto.id, 'descripcion', valor)}
                  onGuardarMonto={(valor) => guardarGastoGeneral(gasto.id, 'monto', valor)}
                  onEliminar={() => eliminarGastoGeneral(gasto.id)}
                />
              ))}

              <div className="px-6 py-3 flex justify-between items-center" style={{ background: 'rgba(200,230,76,0.10)' }}>
                <span className="text-sm font-medium" style={{ color: '#1A1A2E' }}>
                  Total gastos generales
                </span>
                <span className="text-sm font-semibold font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                  {formatPrecio(totalGastosGenerales)}{' '}
                  <span className="font-normal" style={{ color: '#6B7080' }}>
                    ({formatNum(pctGastosSobreDirecto)}% del costo directo)
                  </span>
                </span>
              </div>

              <div className="px-6 py-4">
                <button
                  onClick={agregarGastoGeneral}
                  className="text-sm font-semibold transition-opacity hover:opacity-80 px-5 py-2"
                  style={{ background: '#C8E64C', color: '#2A3300', borderRadius: '9999px' }}
                >
                  + Agregar gasto
                </button>
              </div>

              {gastosError && (
                <p className="px-6 pb-4 text-xs" style={{ color: '#EF4444' }}>{gastosError}</p>
              )}
            </div>

            {/* ── SECCIÓN 3: Cascada de precios ── */}
            <div className="overflow-hidden mb-6" style={GLASS_CARD}>
              <div className="px-6 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <span className="text-sm" style={{ color: '#6B7080' }}>Subtotal de obra (costo directo)</span>
                <span className="text-sm font-medium font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                  {formatPrecio(datos.costo_directo.costo_costo)}
                </span>
              </div>

              <div className="px-6 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <span className="text-sm" style={{ color: '#6B7080' }}>Gastos generales (detallado arriba)</span>
                <span className="text-sm font-medium font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                  {formatPrecio(cierre.gastos_generales)}
                </span>
              </div>

              <EditablePct
                label="Costo financiero"
                valor={paquete.costo_financiero}
                monto={cierre.costo_financiero_monto}
                guardando={guardandoCampo === 'costo_financiero'}
                onGuardar={(v) => guardarCoeficiente('costo_financiero', v)}
              />
              <EditablePct
                label="Beneficio"
                valor={paquete.beneficio}
                monto={cierre.beneficio_monto}
                guardando={guardandoCampo === 'beneficio'}
                onGuardar={(v) => guardarCoeficiente('beneficio', v)}
              />
              <EditablePct
                label="IVA"
                valor={paquete.iva}
                monto={cierre.subtotal_3 * (paquete.iva / 100)}
                guardando={guardandoCampo === 'iva'}
                onGuardar={(v) => guardarCoeficiente('iva', v)}
              />
              <EditablePct
                label="Rentas"
                valor={paquete.rentas}
                monto={cierre.subtotal_3 * (paquete.rentas / 100)}
                guardando={guardandoCampo === 'rentas'}
                onGuardar={(v) => guardarCoeficiente('rentas', v)}
              />

              <div
                className="px-6 py-5 flex justify-between items-center"
                style={{ borderTop: '2px solid rgba(0,0,0,0.10)', background: 'rgba(200,230,76,0.15)' }}
              >
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A2E' }}>Precio final</span>
                <span className="font-mono tabular-nums" style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A2E' }}>
                  {formatPrecio(cierre.precio_final)}
                </span>
              </div>

              <div className="px-6 py-5 flex justify-between items-center">
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A2E' }}>Coeficiente de impactación</span>
                <span className="font-mono tabular-nums" style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A2E' }}>
                  {formatCoeficiente(cierre.coeficiente)}
                </span>
              </div>
            </div>

            {errorGuardado && (
              <p className="text-xs mb-6" style={{ color: '#EF4444' }}>{errorGuardado}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
