'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useObras } from '@/hooks/useObras';
import type { Obra } from '@/types';

/* ─── Badges de estado ─────────────────────────────────────────────────────── */

const ESTADO_CONFIG: Record<Obra['estado'], { etiqueta: string; bg: string; color: string }> = {
  activa:     { etiqueta: 'Activa',     bg: '#DCFCE7', color: '#22C55E' },
  pausada:    { etiqueta: 'Pausada',    bg: '#FEF3C7', color: '#F59E0B' },
  finalizada: { etiqueta: 'Finalizada', bg: 'rgba(0,0,0,0.06)', color: '#6B7080' },
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatFecha(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const INPUT_MODAL =
  'w-full border border-black/[0.12] rounded-[10px] px-3.5 py-2.5 text-sm text-[#1A1A2E] bg-white/60 backdrop-blur-[8px] focus:outline-none focus:border-[#C8E64C] focus:shadow-[0_0_0_3px_rgba(200,230,76,0.2)] transition-all placeholder:text-[#9CA3AF]';

/* ─── Tipos del formulario ─────────────────────────────────────────────────── */

type FormObra = { nombre: string; cliente: string; direccion: string; fecha_inicio: string };
const FORM_INICIAL: FormObra = { nombre: '', cliente: '', direccion: '', fecha_inicio: '' };

/* ─── Página ───────────────────────────────────────────────────────────────── */

export default function ObrasPage() {
  const router = useRouter();
  const { obras, cargando, error, crearObra, eliminarObra } = useObras();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState<FormObra>(FORM_INICIAL);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function abrirModal() {
    setForm(FORM_INICIAL);
    setErrorModal(null);
    setModalAbierto(true);
  }

  async function handleGuardar() {
    if (!form.nombre.trim() || !form.cliente.trim() || guardando) return;
    setGuardando(true);
    setErrorModal(null);
    try {
      await crearObra({
        nombre: form.nombre.trim(),
        cliente: form.cliente.trim(),
        direccion: form.direccion.trim() || undefined,
        fecha_inicio: form.fecha_inicio || undefined,
      });
      setModalAbierto(false);
    } catch (err) {
      setErrorModal(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(obra: Obra) {
    if (
      !window.confirm(
        `¿Eliminás "${obra.nombre}"? Se eliminarán todos sus rubros, ítems y mediciones.`,
      )
    )
      return;
    try {
      await eliminarObra(obra.id, true);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div className="p-6">
      {/* Barra superior */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>Obras</h1>
        <button
          onClick={abrirModal}
          className="bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] px-5 py-2 rounded-full text-sm font-semibold transition-colors"
        >
          + Nueva obra
        </button>
      </div>

      {/* Contenido */}
      {cargando ? (
        <p className="text-center mt-20 text-sm" style={{ color: '#6B7080' }}>Cargando...</p>
      ) : error ? (
        <div
          className="mx-auto max-w-md mt-20 rounded-2xl px-4 py-3 text-sm text-center"
          style={{ background: '#FEE2E2', color: '#EF4444' }}
        >
          {error}
        </div>
      ) : obras.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-[20px]"
            style={{
              background: 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(255,255,255,0.60)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21V9.2L12 3l9 6.2V21" />
              <rect x="8" y="14" width="8" height="7" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: '#6B7080' }}>No tenés obras todavía.</p>
          <button
            onClick={abrirModal}
            className="bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
          >
            Crear la primera obra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {obras.map((obra) => {
            const { etiqueta, bg, color } = ESTADO_CONFIG[obra.estado];
            return (
              <div
                key={obra.id}
                className="flex flex-col gap-4 p-5 rounded-2xl backdrop-blur-[20px]"
                style={{
                  background: 'rgba(255, 255, 255, 0.55)',
                  border: '1px solid rgba(255, 255, 255, 0.60)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                }}
              >
                {/* Encabezado de la tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-base leading-tight" style={{ color: '#1A1A2E' }}>
                    {obra.nombre}
                  </h2>
                  <span
                    className="shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full"
                    style={{ background: bg, color }}
                  >
                    {etiqueta}
                  </span>
                </div>

                {/* Datos */}
                <div className="flex flex-col gap-1 text-sm flex-1">
                  <p className="font-medium" style={{ color: '#1A1A2E' }}>{obra.cliente}</p>
                  {obra.fecha_inicio && (
                    <p style={{ color: '#6B7080' }}>Inicio: {formatFecha(obra.fecha_inicio)}</p>
                  )}
                  {obra.direccion && (
                    <p className="truncate" style={{ color: '#6B7080' }}>{obra.direccion}</p>
                  )}
                </div>

                {/* Acciones */}
                <div
                  className="flex gap-2 pt-3"
                  style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}
                >
                  <button
                    onClick={() => router.push(`/obras/${obra.id}/medicion`)}
                    className="flex-1 bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] py-2 rounded-full text-sm font-semibold transition-colors"
                  >
                    Abrir obra
                  </button>
                  <button
                    onClick={() => router.push(`/obras/${obra.id}/presupuesto`)}
                    className="flex-1 border-[1.5px] border-[#1A1A2E] text-[#1A1A2E] hover:bg-black/[0.04] py-2 rounded-full text-sm font-medium transition-colors"
                  >
                    Presupuesto
                  </button>
                  <button
                    onClick={() => handleEliminar(obra)}
                    className="px-3 py-2 text-sm font-medium rounded-full text-[#EF4444] hover:bg-[#FEE2E2] transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal nueva obra ── */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className="w-full max-w-md p-6 backdrop-blur-[24px]"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.60)',
              borderRadius: '20px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2 className="text-lg font-bold mb-5" style={{ color: '#1A1A2E' }}>Nueva obra</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>
                  Nombre <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Edificio Av. del Libertador 1200"
                  className={INPUT_MODAL}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>
                  Cliente <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.cliente}
                  onChange={(e) => setForm((f) => ({ ...f, cliente: e.target.value }))}
                  placeholder="Ej: Constructora Del Sur S.A."
                  className={INPUT_MODAL}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>
                  Dirección{' '}
                  <span className="font-normal" style={{ color: '#6B7080' }}>(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                  placeholder="Ej: Av. del Libertador 1200, CABA"
                  className={INPUT_MODAL}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>
                  Fecha de inicio{' '}
                  <span className="font-normal" style={{ color: '#6B7080' }}>(opcional)</span>
                </label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value }))}
                  className={INPUT_MODAL}
                />
              </div>
            </div>

            {errorModal && (
              <div
                className="mt-4 rounded-[10px] px-3 py-2 text-sm"
                style={{ background: '#FEE2E2', color: '#EF4444' }}
              >
                {errorModal}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setModalAbierto(false)}
                disabled={guardando}
                className="px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ color: '#6B7080' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !form.nombre.trim() || !form.cliente.trim()}
                className="bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] px-5 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {guardando ? 'Guardando…' : 'Crear obra'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
