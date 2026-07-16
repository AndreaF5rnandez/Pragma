'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { usePresupuesto } from '@/hooks/usePresupuesto';
import type { GastoCategoria, GastoGeneral, GastoGeneralCalculado, PresupuestoResponse } from '@/types';

/* ─── Tipos locales ────────────────────────────────────────────────────────── */

type TabId = 'costo-costo' | 'gastos-generales' | 'paquete-empresario';

const TABS: { id: TabId; label: string }[] = [
  { id: 'costo-costo', label: 'Costo-Costo' },
  { id: 'gastos-generales', label: 'Gastos Generales' },
  { id: 'paquete-empresario', label: 'Paquete Empresario' },
];

const CATEGORIAS: { id: GastoCategoria; nombre: string }[] = [
  { id: 'GGDOO', nombre: 'GGDOO — Directos de Obra Ordinarios' },
  { id: 'GGDOE', nombre: 'GGDOE — Directos de Obra Extraordinarios' },
  { id: 'GGI', nombre: 'GGI — Indirectos' },
];

type CampoPaquete = 'costo_financiero' | 'beneficio' | 'iva' | 'rentas';

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

// Rango aceptado de coeficiente de impactación: entre 1,55 y 1,65 se pinta
// verde (saludable); fuera de ese rango, color de alerta.
function colorCoeficiente(v: number): { color: string; bg: string } {
  const enRango = v >= 1.55 && v <= 1.65;
  return enRango
    ? { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' }
    : { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
}

function filasCascada(cierre: PresupuestoResponse['cierre']) {
  return [
    { label: 'Costo-Costo', valor: cierre.costo_costo },
    { label: 'Gastos Generales', valor: cierre.gastos_generales },
    { label: 'Subtotal 1', valor: cierre.subtotal_1 },
    { label: 'Costo Financiero', valor: cierre.costo_financiero_monto },
    { label: 'Subtotal 2', valor: cierre.subtotal_2 },
    { label: 'Beneficio', valor: cierre.beneficio_monto },
    { label: 'Subtotal 3', valor: cierre.subtotal_3 },
    { label: 'Impuestos', valor: cierre.impuestos.monto },
    { label: 'Precio Final', valor: cierre.precio_final },
  ];
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

const GLASS_ELEVATED: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.50)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.50)',
  borderRadius: '20px',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
};

const INPUT_STYLE: React.CSSProperties = {
  color: '#1A1A2E',
  borderColor: 'rgba(0,0,0,0.12)',
  background: 'rgba(255,255,255,0.6)',
};

/* ─── ResumenCascada ───────────────────────────────────────────────────────── */
/* Panel fijo de resumen: cascada corta + coeficiente de impactación
 * destacado. Se muestra siempre, sin importar la sub-pestaña activa —
 * en pantalla ancha como columna derecha, en mobile como barra inferior. */

function ResumenCascada({ cierre }: { cierre: PresupuestoResponse['cierre'] }) {
  const filas = filasCascada(cierre);
  const coef = colorCoeficiente(cierre.coeficiente);

  return (
    <>
      {/* Desktop: columna fija a la derecha */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-80 shrink-0 lg:sticky lg:top-6 lg:self-start overflow-hidden"
        style={GLASS_ELEVATED}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <span className="text-base font-semibold" style={{ color: '#1A1A2E' }}>Resumen</span>
        </div>

        {filas.map((f) => (
          <div
            key={f.label}
            className="px-5 py-2.5 flex justify-between items-center"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
          >
            <span className="text-sm" style={{ color: '#6B7080' }}>{f.label}</span>
            <span className="text-sm font-medium font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
              {formatPrecio(f.valor)}
            </span>
          </div>
        ))}

        <div className="px-5 py-5 flex flex-col items-center gap-1" style={{ background: coef.bg }}>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7080' }}>
            Coeficiente de impactación
          </span>
          <span className="font-mono tabular-nums" style={{ fontSize: '32px', fontWeight: 700, color: coef.color }}>
            {formatCoeficiente(cierre.coeficiente)}
          </span>
        </div>
      </aside>

      {/* Mobile: barra fija abajo */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 px-4 py-3"
        style={{ ...GLASS_ELEVATED, borderRadius: 0 }}
      >
        <div className="flex items-center gap-2 overflow-x-auto">
          {filas.map((f) => (
            <div
              key={f.label}
              className="shrink-0 flex flex-col items-start px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.5)' }}
            >
              <span className="text-[10px] uppercase tracking-wide whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                {f.label}
              </span>
              <span className="text-xs font-semibold font-mono tabular-nums whitespace-nowrap" style={{ color: '#1A1A2E' }}>
                {formatPrecio(f.valor)}
              </span>
            </div>
          ))}
          <div
            className="shrink-0 flex flex-col items-start px-4 py-1.5 rounded-xl"
            style={{ background: coef.bg }}
          >
            <span className="text-[10px] uppercase tracking-wide whitespace-nowrap" style={{ color: '#6B7080' }}>
              Coeficiente
            </span>
            <span className="text-base font-bold font-mono tabular-nums whitespace-nowrap" style={{ color: coef.color }}>
              {formatCoeficiente(cierre.coeficiente)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── TabCostoCosto ────────────────────────────────────────────────────────── */
/* Tabla de rubros e ítems, agrupada por rubro, con el total costo directo
 * al pie. Solo lectura. */

function TabCostoCosto({ datos, obraId }: { datos: PresupuestoResponse; obraId: string }) {
  const totalItems = datos.costo_directo.rubros.reduce((sum, r) => sum + r.items.length, 0);

  if (totalItems === 0) {
    return (
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
    );
  }

  return (
    <div className="overflow-hidden" style={GLASS_CARD}>
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
  );
}

/* ─── GastoGeneralRow ──────────────────────────────────────────────────────── */
/* Renglón de gasto general: descripción editable, modalidad (toggle),
 * monto editable, meses editable si es mensual, y el total ya calculado
 * por el servidor (calcularTotalGasto). Autosave al perder foco. */

function GastoGeneralRow({
  gasto,
  guardando,
  onGuardar,
  onEliminar,
}: {
  gasto: GastoGeneralCalculado;
  guardando: boolean;
  onGuardar: (cambios: Partial<Pick<GastoGeneral, 'descripcion' | 'modalidad' | 'monto' | 'meses'>>) => void;
  onEliminar: () => void;
}) {
  const [descripcion, setDescripcion] = useState(gasto.descripcion);
  const [monto, setMonto] = useState(String(gasto.monto));
  const [meses, setMeses] = useState(String(gasto.meses ?? ''));

  useEffect(() => setDescripcion(gasto.descripcion), [gasto.descripcion]);
  useEffect(() => setMonto(String(gasto.monto)), [gasto.monto]);
  useEffect(() => setMeses(String(gasto.meses ?? '')), [gasto.meses]);

  function confirmarDescripcion() {
    const valor = descripcion.trim();
    if (!valor || valor === gasto.descripcion) { setDescripcion(gasto.descripcion); return; }
    onGuardar({ descripcion: valor });
  }

  function confirmarMonto() {
    const num = Number(monto);
    if (Number.isNaN(num) || num < 0 || num === gasto.monto) { setMonto(String(gasto.monto)); return; }
    onGuardar({ monto: num });
  }

  function confirmarMeses() {
    const num = Number(meses);
    if (!Number.isInteger(num) || num < 0 || num === gasto.meses) { setMeses(String(gasto.meses ?? '')); return; }
    onGuardar({ meses: num });
  }

  return (
    <div className="px-6 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      <input
        type="text"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        onBlur={confirmarDescripcion}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        className="flex-1 min-w-[160px] text-sm bg-transparent border-b border-transparent hover:border-black/10 focus:outline-none focus:border-b-[#C8E64C] transition-colors"
        style={{ color: '#1A1A2E' }}
      />

      <button
        onClick={() => onGuardar({ modalidad: gasto.modalidad === 'mensual' ? 'unico' : 'mensual' })}
        className="text-xs font-semibold px-3 py-1 rounded-full transition-colors shrink-0"
        style={{
          background: gasto.modalidad === 'mensual' ? '#C8E64C' : 'rgba(0,0,0,0.06)',
          color: gasto.modalidad === 'mensual' ? '#2A3300' : '#6B7080',
        }}
        title="Click para alternar modalidad"
      >
        {gasto.modalidad === 'mensual' ? 'Mensual' : 'Único'}
      </button>

      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs" style={{ color: '#9CA3AF' }}>$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          onBlur={confirmarMonto}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          className="w-24 text-right font-mono tabular-nums border rounded-[6px] px-1.5 py-1 focus:outline-none"
          style={INPUT_STYLE}
        />
      </div>

      {gasto.modalidad === 'mensual' && (
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min="0"
            step="1"
            value={meses}
            onChange={(e) => setMeses(e.target.value)}
            onBlur={confirmarMeses}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            className="w-14 text-right font-mono tabular-nums border rounded-[6px] px-1.5 py-1 focus:outline-none"
            style={INPUT_STYLE}
          />
          <span className="text-xs" style={{ color: '#9CA3AF' }}>meses</span>
        </div>
      )}

      <span className="w-28 text-right text-sm font-semibold font-mono tabular-nums shrink-0" style={{ color: '#1A1A2E' }}>
        {formatPrecio(gasto.total)}
      </span>

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

/* ─── TabGastosGenerales ───────────────────────────────────────────────────── */

function TabGastosGenerales({
  datos,
  obraId,
  onRefrescar,
}: {
  datos: PresupuestoResponse;
  obraId: string;
  onRefrescar: () => void;
}) {
  const [plazoBorrador, setPlazoBorrador] = useState(String(datos.obra.plazo_meses ?? ''));
  const [guardandoPlazo, setGuardandoPlazo] = useState(false);
  const [errorPlazo, setErrorPlazo] = useState<string | null>(null);

  useEffect(() => setPlazoBorrador(String(datos.obra.plazo_meses ?? '')), [datos.obra.plazo_meses]);

  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  async function confirmarPlazo() {
    const num = Number(plazoBorrador);
    const actual = datos.obra.plazo_meses ?? 0;
    if (!Number.isInteger(num) || num < 0 || num === actual) {
      setPlazoBorrador(String(datos.obra.plazo_meses ?? ''));
      return;
    }
    setGuardandoPlazo(true);
    setErrorPlazo(null);
    try {
      const res = await fetch(`/api/obras/${obraId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: datos.obra.nombre,
          cliente: datos.obra.cliente,
          direccion: datos.obra.direccion,
          fecha_inicio: datos.obra.fecha_inicio,
          estado: datos.obra.estado,
          plazo_meses: num,
        }),
      });
      const json: unknown = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error ?? 'Error al guardar el plazo');
      onRefrescar();
    } catch (err) {
      setErrorPlazo(err instanceof Error ? err.message : 'Error al guardar el plazo');
    } finally {
      setGuardandoPlazo(false);
    }
  }

  async function guardarGasto(id: string, cambios: Partial<Pick<GastoGeneral, 'descripcion' | 'modalidad' | 'monto' | 'meses'>>) {
    setGuardandoId(id);
    setErrorGuardado(null);
    try {
      const res = await fetch(`/api/gastos-generales/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios),
      });
      const json: unknown = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error ?? 'Error al guardar');
      onRefrescar();
    } catch (err) {
      setErrorGuardado(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardandoId(null);
    }
  }

  async function agregarGasto(categoria: GastoCategoria) {
    setErrorGuardado(null);
    try {
      const res = await fetch('/api/gastos-generales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obra_id: obraId, categoria, descripcion: 'Nuevo gasto', modalidad: 'unico', monto: 0 }),
      });
      const json: unknown = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error ?? 'Error al crear el gasto');
      onRefrescar();
    } catch (err) {
      setErrorGuardado(err instanceof Error ? err.message : 'Error al crear el gasto');
    }
  }

  async function eliminarGasto(id: string, descripcion: string) {
    if (!window.confirm(`¿Eliminar el gasto "${descripcion}"? Esta acción no se puede deshacer.`)) return;
    setErrorGuardado(null);
    try {
      const res = await fetch(`/api/gastos-generales/${id}`, { method: 'DELETE' });
      const json: unknown = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error ?? 'Error al eliminar el gasto');
      onRefrescar();
    } catch (err) {
      setErrorGuardado(err instanceof Error ? err.message : 'Error al eliminar el gasto');
    }
  }

  const lista = datos.gastos_generales.lista;

  return (
    <div className="flex flex-col gap-6">
      {/* Plazo de la obra */}
      <div className="overflow-hidden" style={GLASS_CARD}>
        <div className="px-6 py-4 flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium" style={{ color: '#1A1A2E' }}>Plazo de la obra (meses)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={plazoBorrador}
            onChange={(e) => setPlazoBorrador(e.target.value)}
            onBlur={confirmarPlazo}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            className="w-20 text-right font-mono tabular-nums border rounded-[8px] px-2 py-1 focus:outline-none"
            style={INPUT_STYLE}
          />
          {guardandoPlazo && <span className="text-xs" style={{ color: '#9CA3AF' }}>guardando…</span>}
        </div>
        <p className="px-6 pb-4 text-xs" style={{ color: '#9CA3AF' }}>
          Valor por defecto para los gastos mensuales — cada gasto puede tener su propia cantidad de meses.
        </p>
        {errorPlazo && <p className="px-6 pb-4 text-xs" style={{ color: '#EF4444' }}>{errorPlazo}</p>}
      </div>

      {/* Categorías */}
      {CATEGORIAS.map((cat) => {
        const gastosCategoria = lista.filter((g) => g.categoria === cat.id);
        return (
          <div key={cat.id} className="overflow-hidden" style={GLASS_CARD}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span className="text-base font-semibold" style={{ color: '#1A1A2E' }}>{cat.nombre}</span>
            </div>

            {gastosCategoria.length === 0 ? (
              <p className="px-6 py-3 text-sm" style={{ color: '#9CA3AF' }}>Sin gastos en esta categoría.</p>
            ) : (
              gastosCategoria.map((gasto) => (
                <GastoGeneralRow
                  key={gasto.id}
                  gasto={gasto}
                  guardando={guardandoId === gasto.id}
                  onGuardar={(cambios) => guardarGasto(gasto.id, cambios)}
                  onEliminar={() => eliminarGasto(gasto.id, gasto.descripcion)}
                />
              ))
            )}

            <div className="px-6 py-4">
              <button
                onClick={() => agregarGasto(cat.id)}
                className="text-sm font-semibold transition-opacity hover:opacity-80 px-5 py-2"
                style={{ background: '#C8E64C', color: '#2A3300', borderRadius: '9999px' }}
              >
                + Agregar gasto
              </button>
            </div>
          </div>
        );
      })}

      {/* Total: siempre calculado por el sistema, nunca cargado a mano */}
      <div className="overflow-hidden" style={GLASS_CARD}>
        <div className="px-6 py-4 flex justify-between items-center">
          <span className="text-sm font-medium" style={{ color: '#1A1A2E' }}>Total gastos generales</span>
          <span className="text-sm font-semibold font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
            {formatPrecio(datos.gastos_generales.total)}{' '}
            <span className="font-normal" style={{ color: '#6B7080' }}>
              ({formatNum(datos.gastos_generales.porcentaje_derivado)}% del costo-costo)
            </span>
          </span>
        </div>
      </div>

      {errorGuardado && <p className="text-xs" style={{ color: '#EF4444' }}>{errorGuardado}</p>}
    </div>
  );
}

/* ─── CascadaLinea ─────────────────────────────────────────────────────────── */

function CascadaLinea({ label, valor, destacado }: { label: string; valor: number; destacado?: boolean }) {
  return (
    <div
      className="px-6 py-3 flex justify-between items-center"
      style={{
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        background: destacado ? 'rgba(0,0,0,0.02)' : undefined,
      }}
    >
      <span className="text-sm" style={{ color: destacado ? '#1A1A2E' : '#6B7080', fontWeight: destacado ? 600 : 400 }}>
        {label}
      </span>
      <span className="text-sm font-mono tabular-nums" style={{ color: '#1A1A2E', fontWeight: destacado ? 700 : 500 }}>
        {formatPrecio(valor)}
      </span>
    </div>
  );
}

/* ─── TabPaqueteEmpresario ─────────────────────────────────────────────────── */

function TabPaqueteEmpresario({
  cierre,
  obraId,
  onRefrescar,
}: {
  cierre: PresupuestoResponse['cierre'];
  obraId: string;
  onRefrescar: () => void;
}) {
  const [campos, setCampos] = useState({
    costo_financiero: String(cierre.costo_financiero_pct),
    beneficio: String(cierre.beneficio_pct),
    iva: String(cierre.impuestos.iva_pct),
    rentas: String(cierre.impuestos.rentas_pct),
  });
  const [guardandoCampo, setGuardandoCampo] = useState<CampoPaquete | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCampos({
      costo_financiero: String(cierre.costo_financiero_pct),
      beneficio: String(cierre.beneficio_pct),
      iva: String(cierre.impuestos.iva_pct),
      rentas: String(cierre.impuestos.rentas_pct),
    });
  }, [cierre.costo_financiero_pct, cierre.beneficio_pct, cierre.impuestos.iva_pct, cierre.impuestos.rentas_pct]);

  const valorActual: Record<CampoPaquete, number> = {
    costo_financiero: cierre.costo_financiero_pct,
    beneficio: cierre.beneficio_pct,
    iva: cierre.impuestos.iva_pct,
    rentas: cierre.impuestos.rentas_pct,
  };

  async function guardar(campo: CampoPaquete) {
    const num = Number(campos[campo]);
    if (Number.isNaN(num) || num < 0 || num === valorActual[campo]) {
      setCampos((prev) => ({ ...prev, [campo]: String(valorActual[campo]) }));
      return;
    }
    setGuardandoCampo(campo);
    setError(null);
    try {
      const res = await fetch(`/api/paquete-empresario/${obraId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [campo]: num }),
      });
      const json: unknown = await res.json();
      if (!res.ok) throw new Error((json as { error: string }).error ?? 'Error al guardar');
      onRefrescar();
    } catch (err) {
      setCampos((prev) => ({ ...prev, [campo]: String(valorActual[campo]) }));
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardandoCampo(null);
    }
  }

  function campoInput(campo: CampoPaquete, label: string) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7080' }}>{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={campos[campo]}
            onChange={(e) => setCampos((prev) => ({ ...prev, [campo]: e.target.value }))}
            onBlur={() => guardar(campo)}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            className="w-24 text-right font-mono tabular-nums border rounded-[8px] px-3 py-2 focus:outline-none"
            style={INPUT_STYLE}
          />
          <span className="text-sm" style={{ color: '#6B7080' }}>%</span>
          {guardandoCampo === campo && <span className="text-xs" style={{ color: '#9CA3AF' }}>guardando…</span>}
        </div>
      </div>
    );
  }

  const coef = colorCoeficiente(cierre.coeficiente);

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden p-6" style={GLASS_CARD}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {campoInput('costo_financiero', 'Costo Financiero')}
          {campoInput('beneficio', 'Beneficio')}
          {campoInput('iva', 'IVA')}
          {campoInput('rentas', 'Rentas')}
        </div>
        {error && <p className="text-xs mt-4" style={{ color: '#EF4444' }}>{error}</p>}
      </div>

      <div className="overflow-hidden" style={GLASS_CARD}>
        <CascadaLinea label="Costo-Costo" valor={cierre.costo_costo} />
        <CascadaLinea label="+ Gastos Generales" valor={cierre.gastos_generales} />
        <CascadaLinea label="Subtotal 1" valor={cierre.subtotal_1} destacado />
        <CascadaLinea label={`+ Costo Financiero (${cierre.costo_financiero_pct}%)`} valor={cierre.costo_financiero_monto} />
        <CascadaLinea label="Subtotal 2" valor={cierre.subtotal_2} destacado />
        <CascadaLinea label={`+ Beneficio (${cierre.beneficio_pct}%)`} valor={cierre.beneficio_monto} />
        <CascadaLinea label="Subtotal 3" valor={cierre.subtotal_3} destacado />
        <CascadaLinea
          label={`+ Impuestos (IVA ${cierre.impuestos.iva_pct}% + Rentas ${cierre.impuestos.rentas_pct}%)`}
          valor={cierre.impuestos.monto}
        />

        <div
          className="px-6 py-5 flex justify-between items-center"
          style={{ borderTop: '2px solid rgba(0,0,0,0.10)', background: 'rgba(200,230,76,0.15)' }}
        >
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A2E' }}>Precio de la Obra</span>
          <span className="font-mono tabular-nums" style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A2E' }}>
            {formatPrecio(cierre.precio_final)}
          </span>
        </div>

        <div className="px-6 py-5 flex justify-between items-center" style={{ background: coef.bg }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E' }}>Coeficiente de impactación</span>
          <span className="font-mono tabular-nums" style={{ fontSize: '22px', fontWeight: 700, color: coef.color }}>
            {formatCoeficiente(cierre.coeficiente)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Página ───────────────────────────────────────────────────────────────── */

export default function PresupuestoPage() {
  const params = useParams();
  const obraId = params.id as string;
  const { lista: datos, cargando, error, refrescar } = usePresupuesto(obraId);

  const [tab, setTab] = useState<TabId>('costo-costo');

  const obraNombre = datos?.obra.nombre ?? '…';

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: '#D5D4DC', background: MESH_GRADIENT }}
    >
      {/* ── Barra superior: pestañas Cómputo / Presupuesto ── */}
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

      {/* ── Cuerpo: sub-pestañas + contenido a la izquierda, resumen fijo a la derecha ── */}
      <div className="flex-1 overflow-y-auto p-6 pb-28 lg:pb-6 flex flex-col lg:flex-row gap-6">
        {cargando ? (
          <div className="flex items-center justify-center h-64 flex-1">
            <p className="text-sm" style={{ color: '#6B7080' }}>Calculando presupuesto…</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 flex-1">
            <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
          </div>
        ) : datos ? (
          <>
            <div className="flex-1 min-w-0">
              {/* Sub-pestañas internas */}
              <div className="flex gap-6 mb-5 px-1">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className="text-sm pb-2 transition-colors"
                    style={{
                      color: tab === t.id ? '#1A1A2E' : '#6B7080',
                      fontWeight: tab === t.id ? 600 : 500,
                      borderBottom: tab === t.id ? '2px solid #1A1A2E' : '2px solid transparent',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === 'costo-costo' && <TabCostoCosto datos={datos} obraId={obraId} />}
              {tab === 'gastos-generales' && (
                <TabGastosGenerales datos={datos} obraId={obraId} onRefrescar={refrescar} />
              )}
              {tab === 'paquete-empresario' && (
                <TabPaqueteEmpresario cierre={datos.cierre} obraId={obraId} onRefrescar={refrescar} />
              )}
            </div>

            <ResumenCascada cierre={datos.cierre} />
          </>
        ) : null}
      </div>
    </div>
  );
}
