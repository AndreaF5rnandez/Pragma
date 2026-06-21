'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useObras } from '@/hooks/useObras';
import type { Obra } from '@/types';

/* ─── Badges de estado ─────────────────────────────────────────────────────── */

const ESTADO_CONFIG: Record<Obra['estado'], { etiqueta: string; clases: string }> = {
  activa:     { etiqueta: 'Activa',     clases: 'bg-green-100 text-green-800' },
  pausada:    { etiqueta: 'Pausada',    clases: 'bg-yellow-100 text-yellow-700' },
  finalizada: { etiqueta: 'Finalizada', clases: 'bg-gray-100 text-gray-600' },
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
  'w-full border border-pragma-superficie rounded-md px-3 py-2 text-sm text-pragma-texto bg-white focus:outline-none focus:ring-2 focus:ring-pragma-accent';

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
    <div className="p-8">
      {/* Barra superior */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-pragma-texto">Obras</h1>
        <button
          onClick={abrirModal}
          className="bg-pragma-accent text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Nueva obra
        </button>
      </div>

      {/* Contenido */}
      {cargando ? (
        <p className="text-center text-pragma-textoClaro mt-20">Cargando...</p>
      ) : error ? (
        <p className="text-center text-red-600 mt-20">{error}</p>
      ) : obras.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 gap-4">
          <p className="text-pragma-textoClaro text-lg">No tenés obras todavía.</p>
          <button
            onClick={abrirModal}
            className="bg-pragma-accent text-white px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Crear la primera obra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {obras.map((obra) => {
            const { etiqueta, clases } = ESTADO_CONFIG[obra.estado];
            return (
              <div
                key={obra.id}
                className="bg-white rounded-xl border border-pragma-superficie shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                {/* Encabezado de la tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold text-pragma-texto text-base leading-tight">
                    {obra.nombre}
                  </h2>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${clases}`}
                  >
                    {etiqueta}
                  </span>
                </div>

                {/* Datos */}
                <div className="flex flex-col gap-1 text-sm text-pragma-textoClaro flex-1">
                  <p>
                    <span className="text-pragma-texto font-medium">{obra.cliente}</span>
                  </p>
                  {obra.fecha_inicio && (
                    <p>Inicio: {formatFecha(obra.fecha_inicio)}</p>
                  )}
                  {obra.direccion && <p className="truncate">{obra.direccion}</p>}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-1 border-t border-pragma-superficie">
                  <button
                    onClick={() => router.push(`/obras/${obra.id}/medicion`)}
                    className="flex-1 bg-pragma-accent text-white text-sm font-medium py-2 rounded-md hover:opacity-90 transition-opacity"
                  >
                    Abrir obra
                  </button>
                  <button
                    onClick={() => router.push(`/obras/${obra.id}/presupuesto`)}
                    className="flex-1 bg-pragma-superficie text-pragma-totales text-sm font-medium py-2 rounded-md hover:opacity-80 transition-opacity"
                  >
                    Ver presupuesto
                  </button>
                  <button
                    onClick={() => handleEliminar(obra)}
                    className="px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Eliminar
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-pragma-texto mb-5">Nueva obra</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-pragma-texto mb-1">
                  Nombre <span className="text-red-400">*</span>
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
                <label className="block text-sm font-medium text-pragma-texto mb-1">
                  Cliente <span className="text-red-400">*</span>
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
                <label className="block text-sm font-medium text-pragma-texto mb-1">
                  Dirección{' '}
                  <span className="text-pragma-textoClaro font-normal">(opcional)</span>
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
                <label className="block text-sm font-medium text-pragma-texto mb-1">
                  Fecha de inicio{' '}
                  <span className="text-pragma-textoClaro font-normal">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm((f) => ({ ...f, fecha_inicio: e.target.value }))}
                  className={INPUT_MODAL}
                />
              </div>
            </div>

            {errorModal && <p className="mt-4 text-sm text-red-600">{errorModal}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalAbierto(false)}
                disabled={guardando}
                className="px-4 py-2 text-sm font-medium text-pragma-textoClaro hover:text-pragma-texto transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !form.nombre.trim() || !form.cliente.trim()}
                className="bg-pragma-accent text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
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
