'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { usePresupuesto } from '@/hooks/usePresupuesto';
import type { PresupuestoResponse } from '@/types';

/* ─── Tipos locales ────────────────────────────────────────────────────────── */

type TabId = 'costo-costo' | 'gastos-generales' | 'paquete-empresario';

const TABS: { id: TabId; label: string }[] = [
  { id: 'costo-costo', label: 'Costo-Costo' },
  { id: 'gastos-generales', label: 'Gastos Generales' },
  { id: 'paquete-empresario', label: 'Paquete Empresario' },
];

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

/* ─── Placeholder ──────────────────────────────────────────────────────────── */

function TabPlaceholder({ titulo }: { titulo: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-2" style={GLASS_CARD}>
      <span className="text-base font-semibold" style={{ color: '#1A1A2E' }}>{titulo}</span>
      <p className="text-sm" style={{ color: '#6B7080' }}>En construcción.</p>
    </div>
  );
}

/* ─── Página ───────────────────────────────────────────────────────────────── */

export default function PresupuestoPage() {
  const params = useParams();
  const obraId = params.id as string;
  const { lista: datos, cargando, error } = usePresupuesto(obraId);

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
              {tab === 'gastos-generales' && <TabPlaceholder titulo="Gastos Generales" />}
              {tab === 'paquete-empresario' && <TabPlaceholder titulo="Paquete Empresario" />}
            </div>

            <ResumenCascada cierre={datos.cierre} />
          </>
        ) : null}
      </div>
    </div>
  );
}
