'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRubros } from '@/hooks/useRubros';
import { useItems } from '@/hooks/useItems';
import { useMediciones } from '@/hooks/useMediciones';
import { useRecetas } from '@/hooks/useRecetas';
import { calcularPrecioReceta } from '@/lib/calculos';
import type { ItemConReceta, Medicion, RecetaConInsumos, Rubro } from '@/types';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatPrecio(v: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);
}

function formatNum(v: number) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 4 }).format(v);
}

const INPUT_MODAL =
  'w-full border border-black/[0.12] rounded-[10px] px-3.5 py-2.5 text-sm text-[#1A1A2E] bg-white/60 backdrop-blur-[8px] focus:outline-none focus:border-[#C8E64C] focus:shadow-[0_0_0_3px_rgba(200,230,76,0.2)] transition-all placeholder:text-[#9CA3AF]';

const INPUT_FILA =
  'w-full border border-transparent rounded-[8px] px-2 py-1 text-sm text-[#1A1A2E] bg-transparent focus:outline-none focus:border-black/[0.12] focus:bg-white/60 focus:shadow-[0_0_0_3px_rgba(200,230,76,0.2)] transition-all';

/* ─── FilaForm ─────────────────────────────────────────────────────────────── */

type FilaDim = number | '';
type FilaForm = { descripcion: string; n: FilaDim; largo: FilaDim; ancho: FilaDim; alto: FilaDim };

const FILA_INICIAL: FilaForm = { descripcion: '', n: 1, largo: '', ancho: '', alto: '' };

function medicionAForm(m: Medicion): FilaForm {
  return {
    descripcion: m.descripcion,
    n: m.n,
    largo: m.largo ?? '',
    ancho: m.ancho ?? '',
    alto: m.alto ?? '',
  };
}

/* ─── SeccionItem ──────────────────────────────────────────────────────────── */

function SeccionItem({
  item,
  recetas,
  onSubtotalChange,
  onEditar,
  onEliminar,
}: {
  item: ItemConReceta;
  recetas: RecetaConInsumos[];
  onSubtotalChange: (itemId: string, subtotal: number) => void;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const { mediciones, cargando, crearMedicion, actualizarMedicion, eliminarMedicion } =
    useMediciones(item.id);

  /* Fila de nueva medición */
  const [fila, setFila] = useState<FilaForm>(FILA_INICIAL);
  const [guardandoFila, setGuardandoFila] = useState(false);
  const [errorFila, setErrorFila] = useState<string | null>(null);
  const descripcionRef = useRef<HTMLInputElement>(null);

  /* Fila en edición */
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FilaForm>(FILA_INICIAL);

  const recetaCompleta = recetas.find((r) => r.id === item.receta_id);
  const precioUnitario = recetaCompleta ? calcularPrecioReceta(recetaCompleta.ingredientes) : 0;
  const cantidadTotal = mediciones.reduce((sum, m) => sum + m.cantidad_calculada, 0);
  const subtotal = cantidadTotal * precioUnitario;

  useEffect(() => {
    onSubtotalChange(item.id, subtotal);
  }, [item.id, subtotal, onSubtotalChange]);

  /* ── Nueva medición ── */

  async function handleGuardarFila() {
    if (!fila.descripcion.trim() || guardandoFila) return;
    setGuardandoFila(true);
    setErrorFila(null);
    try {
      await crearMedicion({
        descripcion: fila.descripcion.trim(),
        n: typeof fila.n === 'number' ? fila.n : 1,
        largo: typeof fila.largo === 'number' ? fila.largo : undefined,
        ancho: typeof fila.ancho === 'number' ? fila.ancho : undefined,
        alto: typeof fila.alto === 'number' ? fila.alto : undefined,
      });
      setFila(FILA_INICIAL);
      setTimeout(() => descripcionRef.current?.focus(), 0);
    } catch (err) {
      setErrorFila(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardandoFila(false);
    }
  }

  function onKeyDownNueva(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleGuardarFila(); }
  }

  /* ── Edición de medición existente ── */

  function entrarEdicion(m: Medicion) {
    setEditandoId(m.id);
    setEditForm(medicionAForm(m));
  }

  async function handleGuardarEdicion() {
    if (!editandoId) return;
    if (!editForm.descripcion.trim()) { setEditandoId(null); return; }
    try {
      await actualizarMedicion(editandoId, {
        descripcion: editForm.descripcion.trim(),
        n: typeof editForm.n === 'number' ? editForm.n : 1,
        largo: typeof editForm.largo === 'number' ? editForm.largo : undefined,
        ancho: typeof editForm.ancho === 'number' ? editForm.ancho : undefined,
        alto: typeof editForm.alto === 'number' ? editForm.alto : undefined,
      });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setEditandoId(null);
    }
  }

  function onKeyDownEdicion(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleGuardarEdicion(); }
    if (e.key === 'Escape') { setEditandoId(null); }
  }

  return (
    <div
      className="rounded-2xl mb-4 overflow-hidden backdrop-blur-[20px]"
      style={{
        background: 'rgba(255, 255, 255, 0.55)',
        border: '1px solid rgba(255, 255, 255, 0.60)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Cabecera del ítem */}
      <div
        className="px-4 py-3 flex items-start justify-between gap-4"
        style={{
          borderLeft: '3px solid #C8E64C',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="min-w-0">
          <p className="font-medium truncate" style={{ color: '#1A1A2E' }}>{item.descripcion}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7080' }}>
            {item.receta ? `${item.receta.nombre} · ` : ''}{item.unidad_medida}
          </p>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <div className="text-right">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Cantidad</p>
            <p className="text-sm font-medium font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
              {formatNum(cantidadTotal)} {item.unidad_medida}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>P. Unitario</p>
            <p className="text-sm font-medium font-mono tabular-nums" style={{ color: item.receta ? '#1A1A2E' : '#9CA3AF' }}>
              {item.receta ? formatPrecio(precioUnitario) : 'Sin precio'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Subtotal</p>
            <p className="text-sm font-bold font-mono tabular-nums" style={{ color: item.receta ? '#1A1A2E' : '#9CA3AF' }}>
              {item.receta ? formatPrecio(subtotal) : '—'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onEditar}
              className="text-xs font-medium hover:underline"
              style={{ color: '#C8E64C' }}
            >
              Editar
            </button>
            <button
              onClick={onEliminar}
              className="text-xs font-medium hover:underline"
              style={{ color: '#EF4444' }}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de mediciones */}
      {cargando ? (
        <p className="px-4 py-3 text-sm" style={{ color: '#6B7080' }}>Cargando mediciones…</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Descripción</th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider w-20" style={{ color: '#9CA3AF' }}>N</th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider w-20" style={{ color: '#9CA3AF' }}>Largo</th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider w-20" style={{ color: '#9CA3AF' }}>Ancho</th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider w-20" style={{ color: '#9CA3AF' }}>Alto</th>
              <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider w-24" style={{ color: '#9CA3AF' }}>
                Cantidad ({item.unidad_medida})
              </th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {mediciones.map((m) => {
              /* ── Fila en modo edición ── */
              if (m.id === editandoId) {
                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid rgba(0,0,0,0.04)',
                      background: 'rgba(200,230,76,0.06)',
                    }}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        handleGuardarEdicion();
                      }
                    }}
                  >
                    <td className="px-4 py-1.5">
                      <input
                        autoFocus
                        type="text"
                        value={editForm.descripcion}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, descripcion: e.target.value }))
                        }
                        onKeyDown={onKeyDownEdicion}
                        className={INPUT_FILA}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number" min="0" step="0.001"
                        value={editForm.n === '' ? '' : editForm.n}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            n: e.target.value === '' ? '' : Number(e.target.value),
                          }))
                        }
                        onKeyDown={onKeyDownEdicion}
                        className={`${INPUT_FILA} text-right font-mono`}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number" min="0" step="0.001"
                        value={editForm.largo === '' ? '' : editForm.largo}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            largo: e.target.value === '' ? '' : Number(e.target.value),
                          }))
                        }
                        onKeyDown={onKeyDownEdicion}
                        className={`${INPUT_FILA} text-right font-mono`}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number" min="0" step="0.001"
                        value={editForm.ancho === '' ? '' : editForm.ancho}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            ancho: e.target.value === '' ? '' : Number(e.target.value),
                          }))
                        }
                        onKeyDown={onKeyDownEdicion}
                        className={`${INPUT_FILA} text-right font-mono`}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number" min="0" step="0.001"
                        value={editForm.alto === '' ? '' : editForm.alto}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            alto: e.target.value === '' ? '' : Number(e.target.value),
                          }))
                        }
                        onKeyDown={onKeyDownEdicion}
                        className={`${INPUT_FILA} text-right font-mono`}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-medium tabular-nums" style={{ color: '#6B7080' }}>
                      {formatNum(m.cantidad_calculada)}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button
                        onClick={() => setEditandoId(null)}
                        title="Cancelar edición (Esc)"
                        className="text-xl leading-none transition-colors"
                        style={{ color: '#9CA3AF' }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              }

              /* ── Fila en modo lectura ── */
              return (
                <tr
                  key={m.id}
                  onClick={() => entrarEdicion(m)}
                  className="hover:bg-black/[0.02] transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                >
                  <td className="px-4 py-2" style={{ color: '#1A1A2E' }}>{m.descripcion}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: '#6B7080' }}>{m.n}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: '#6B7080' }}>{m.largo ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: '#6B7080' }}>{m.ancho ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: '#6B7080' }}>{m.alto ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums" style={{ color: '#1A1A2E' }}>
                    {formatNum(m.cantidad_calculada)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm('¿Eliminás esta medición?')) return;
                        try {
                          await eliminarMedicion(m.id);
                        } catch (err) {
                          window.alert(err instanceof Error ? err.message : 'Error al eliminar');
                        }
                      }}
                      className="text-xl leading-none transition-colors"
                      style={{ color: '#9CA3AF' }}
                      title="Eliminar medición"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Fila de nueva medición */}
            <tr style={{ borderTop: '2px solid rgba(200,230,76,0.3)' }}>
              <td className="px-4 py-1.5">
                <input
                  ref={descripcionRef}
                  type="text"
                  value={fila.descripcion}
                  onChange={(e) => setFila((f) => ({ ...f, descripcion: e.target.value }))}
                  onKeyDown={onKeyDownNueva}
                  placeholder="Descripción…"
                  className={INPUT_FILA}
                />
              </td>
              <td className="px-3 py-1.5">
                <input
                  type="number" min="0" step="0.001"
                  value={fila.n === '' ? '' : fila.n}
                  onChange={(e) =>
                    setFila((f) => ({ ...f, n: e.target.value === '' ? '' : Number(e.target.value) }))
                  }
                  onKeyDown={onKeyDownNueva}
                  placeholder="1"
                  className={`${INPUT_FILA} text-right font-mono`}
                />
              </td>
              <td className="px-3 py-1.5">
                <input
                  type="number" min="0" step="0.001"
                  value={fila.largo === '' ? '' : fila.largo}
                  onChange={(e) =>
                    setFila((f) => ({
                      ...f,
                      largo: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                  onKeyDown={onKeyDownNueva}
                  placeholder=""
                  className={`${INPUT_FILA} text-right font-mono`}
                />
              </td>
              <td className="px-3 py-1.5">
                <input
                  type="number" min="0" step="0.001"
                  value={fila.ancho === '' ? '' : fila.ancho}
                  onChange={(e) =>
                    setFila((f) => ({
                      ...f,
                      ancho: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                  onKeyDown={onKeyDownNueva}
                  placeholder=""
                  className={`${INPUT_FILA} text-right font-mono`}
                />
              </td>
              <td className="px-3 py-1.5">
                <input
                  type="number" min="0" step="0.001"
                  value={fila.alto === '' ? '' : fila.alto}
                  onChange={(e) =>
                    setFila((f) => ({
                      ...f,
                      alto: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                  onKeyDown={onKeyDownNueva}
                  placeholder=""
                  className={`${INPUT_FILA} text-right font-mono`}
                />
              </td>
              <td className="px-3 py-1.5" />
              <td className="px-3 py-1.5 text-center">
                <button
                  onClick={handleGuardarFila}
                  disabled={guardandoFila || !fila.descripcion.trim()}
                  title="Guardar (Enter)"
                  className="font-bold text-base leading-none disabled:opacity-30 transition-colors"
                  style={{ color: '#C8E64C' }}
                >
                  ↵
                </button>
              </td>
            </tr>

            {errorFila && (
              <tr>
                <td colSpan={7} className="px-4 py-1.5">
                  <div
                    className="rounded-[10px] px-3 py-1.5 text-xs"
                    style={{ background: '#FEE2E2', color: '#EF4444' }}
                  >
                    {errorFila}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ─── ContenidoRubro ───────────────────────────────────────────────────────── */

function ContenidoRubro({
  rubroId,
  rubroNombre,
  recetas,
  onSubtotalChange,
}: {
  rubroId: string;
  rubroNombre: string;
  recetas: RecetaConInsumos[];
  onSubtotalChange: (rubroId: string, subtotal: number) => void;
}) {
  const { items, cargando, error, crearItem, actualizarItem, eliminarItem } = useItems(rubroId);
  const [subtotalesPorItem, setSubtotalesPorItem] = useState<Record<string, number>>({});

  // Sincroniza el mapa con la lista real de ítems:
  // inicializa en 0 los nuevos, elimina los que ya no existen.
  useEffect(() => {
    if (items.length === 0) return;
    setSubtotalesPorItem((prev) => {
      const itemIds = new Set(items.map((i) => i.id));
      const next: Record<string, number> = {};
      for (const id of itemIds) {
        next[id] = prev[id] ?? 0;
      }
      return next;
    });
  }, [items]);

  const subtotalRubro = Object.values(subtotalesPorItem).reduce((a, b) => a + b, 0);

  const handleSubtotalItem = useCallback((itemId: string, subtotal: number) => {
    setSubtotalesPorItem((prev) => {
      if (prev[itemId] === subtotal) return prev;
      return { ...prev, [itemId]: subtotal };
    });
  }, []);

  useEffect(() => {
    onSubtotalChange(rubroId, subtotalRubro);
  }, [rubroId, subtotalRubro, onSubtotalChange]);

  /* Modal nuevo / editar ítem */
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState<ItemConReceta | null>(null);
  const [formItem, setFormItem] = useState({ descripcion: '', unidad_medida: '', receta_id: '' });
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [guardandoModal, setGuardandoModal] = useState(false);

  function abrirCrear() {
    setItemEditando(null);
    setFormItem({ descripcion: '', unidad_medida: '', receta_id: '' });
    setErrorModal(null);
    setModalAbierto(true);
  }

  function abrirEditar(item: ItemConReceta) {
    setItemEditando(item);
    setFormItem({
      descripcion: item.descripcion,
      unidad_medida: item.unidad_medida,
      receta_id: item.receta_id ?? '',
    });
    setErrorModal(null);
    setModalAbierto(true);
  }

  async function handleGuardarModal() {
    if (!formItem.descripcion.trim() || !formItem.unidad_medida || guardandoModal) return;
    setGuardandoModal(true);
    setErrorModal(null);
    try {
      if (itemEditando) {
        await actualizarItem(itemEditando.id, {
          descripcion: formItem.descripcion.trim(),
          unidad_medida: formItem.unidad_medida,
          receta_id: formItem.receta_id || null,
          orden: itemEditando.orden,
        });
      } else {
        await crearItem({
          descripcion: formItem.descripcion.trim(),
          unidad_medida: formItem.unidad_medida,
          receta_id: formItem.receta_id || null,
        });
      }
      setModalAbierto(false);
      setItemEditando(null);
    } catch (err) {
      setErrorModal(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardandoModal(false);
    }
  }

  async function handleEliminarItem(item: ItemConReceta) {
    if (
      !window.confirm(
        `¿Eliminás el ítem "${item.descripcion}"? Se eliminarán todas sus mediciones.`,
      )
    )
      return;
    try {
      await eliminarItem(item.id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div className="p-6">
      {/* Encabezado del rubro */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: '#1A1A2E' }}>{rubroNombre}</h2>
        <button
          onClick={abrirCrear}
          className="bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] px-5 py-2 rounded-full text-sm font-semibold transition-colors"
        >
          + Nuevo ítem
        </button>
      </div>

      {cargando ? (
        <p className="text-center mt-16 text-sm" style={{ color: '#6B7080' }}>Cargando ítems…</p>
      ) : error ? (
        <div
          className="mx-auto max-w-md mt-16 rounded-2xl px-4 py-3 text-sm text-center"
          style={{ background: '#FEE2E2', color: '#EF4444' }}
        >
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 gap-3">
          <p className="text-sm" style={{ color: '#6B7080' }}>Este rubro no tiene ítems todavía.</p>
          <button
            onClick={abrirCrear}
            className="bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
          >
            + Agregar ítem
          </button>
        </div>
      ) : (
        <>
          {items.map((item) => (
            <SeccionItem
              key={item.id}
              item={item}
              recetas={recetas}
              onSubtotalChange={handleSubtotalItem}
              onEditar={() => abrirEditar(item)}
              onEliminar={() => handleEliminarItem(item)}
            />
          ))}

          {/* Subtotal del rubro */}
          <div className="flex justify-end mt-2 mb-4">
            <div
              className="rounded-2xl px-5 py-3 text-right"
              style={{
                background: 'rgba(200,230,76,0.12)',
                border: '1px solid rgba(200,230,76,0.30)',
              }}
            >
              <p className="text-xs mb-0.5" style={{ color: '#6B7080' }}>Subtotal {rubroNombre}</p>
              <p className="text-xl font-bold font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                {formatPrecio(subtotalRubro)}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Modal ítem */}
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
            <h3 className="text-lg font-bold mb-5" style={{ color: '#1A1A2E' }}>
              {itemEditando ? 'Editar ítem' : 'Nuevo ítem'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>
                  Descripción
                </label>
                <input
                  type="text"
                  value={formItem.descripcion}
                  onChange={(e) => setFormItem((f) => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Exc. de V. Encadenado inferior"
                  className={INPUT_MODAL}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>
                  Unidad de medida
                </label>
                <select
                  value={formItem.unidad_medida}
                  onChange={(e) => setFormItem((f) => ({ ...f, unidad_medida: e.target.value }))}
                  className={INPUT_MODAL}
                >
                  <option value="">— Elegir unidad —</option>
                  {['m3','m2','m','u','kg','t','l','h','d','mes','km','ha','cm3','cm2','dm3','mu','cu','a'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>
                  Precio Unitario{' '}
                  <span className="font-normal" style={{ color: '#9CA3AF' }}>(opcional — asignalo después)</span>
                </label>
                <select
                  value={formItem.receta_id}
                  onChange={(e) => setFormItem((f) => ({ ...f, receta_id: e.target.value }))}
                  className={INPUT_MODAL}
                >
                  <option value="">— Sin precio por ahora —</option>
                  {recetas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} ({r.unidad_medida})
                    </option>
                  ))}
                </select>
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
                onClick={() => {
                  setModalAbierto(false);
                  setItemEditando(null);
                }}
                disabled={guardandoModal}
                className="px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ color: '#6B7080' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarModal}
                disabled={guardandoModal || !formItem.descripcion.trim() || !formItem.unidad_medida}
                className="bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] px-5 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {guardandoModal
                  ? 'Guardando…'
                  : itemEditando
                  ? 'Guardar cambios'
                  : 'Crear ítem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Página principal ─────────────────────────────────────────────────────── */

export default function MedicionPage() {
  const params = useParams();
  const obraId = params.id as string;

  const { rubros, cargando: cargandoRubros, error: errorRubros, crearRubro, eliminarRubro } =
    useRubros(obraId);
  const { recetas } = useRecetas();

  const [obraNombre, setObraNombre] = useState('');
  const [rubroSeleccionadoId, setRubroSeleccionadoId] = useState<string | null>(null);
  const [subtotales, setSubtotales] = useState<Record<string, number>>({});

  /* Nuevo rubro inline */
  const [agregandoRubro, setAgregandoRubro] = useState(false);
  const [nuevoRubroNombre, setNuevoRubroNombre] = useState('');
  const [guardandoRubro, setGuardandoRubro] = useState(false);
  const [errorNuevoRubro, setErrorNuevoRubro] = useState<string | null>(null);
  const nuevoRubroRef = useRef<HTMLInputElement>(null);

  /* Cargar nombre de la obra */
  useEffect(() => {
    fetch(`/api/obras/${obraId}`)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (data && typeof data === 'object' && 'nombre' in data) {
          setObraNombre((data as { nombre: string }).nombre);
        }
      })
      .catch(() => {});
  }, [obraId]);

  /* Auto-seleccionar primer rubro */
  useEffect(() => {
    if (!cargandoRubros && rubros.length > 0 && rubroSeleccionadoId === null) {
      setRubroSeleccionadoId(rubros[0].id);
    }
  }, [cargandoRubros, rubros, rubroSeleccionadoId]);

  /* Foco al abrir el input de nuevo rubro */
  useEffect(() => {
    if (agregandoRubro) {
      setTimeout(() => nuevoRubroRef.current?.focus(), 0);
    }
  }, [agregandoRubro]);

  const handleSubtotalChange = useCallback((rubroId: string, subtotal: number) => {
    setSubtotales((prev) => {
      if (prev[rubroId] === subtotal) return prev;
      return { ...prev, [rubroId]: subtotal };
    });
  }, []);

  async function handleCrearRubro() {
    if (!nuevoRubroNombre.trim() || guardandoRubro) return;
    setGuardandoRubro(true);
    setErrorNuevoRubro(null);
    try {
      const nuevo = await crearRubro(nuevoRubroNombre.trim());
      setNuevoRubroNombre('');
      setAgregandoRubro(false);
      setRubroSeleccionadoId(nuevo.id);
    } catch (err) {
      setErrorNuevoRubro(err instanceof Error ? err.message : 'Error al crear rubro');
    } finally {
      setGuardandoRubro(false);
    }
  }

  async function handleEliminarRubro(rubro: Rubro) {
    if (
      !window.confirm(
        `¿Eliminás "${rubro.nombre}"? Se eliminarán todos sus ítems y mediciones.`,
      )
    )
      return;
    try {
      await eliminarRubro(rubro.id);
      if (rubroSeleccionadoId === rubro.id) {
        const restantes = rubros.filter((r) => r.id !== rubro.id);
        setRubroSeleccionadoId(restantes.length > 0 ? restantes[0].id : null);
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  const rubroSeleccionado = rubros.find((r) => r.id === rubroSeleccionadoId) ?? null;

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Barra de navegación superior con tabs ── */}
      <header
        className="sticky top-0 z-10 px-6 flex items-stretch gap-4 shrink-0"
        style={{
          height: '48px',
          background: 'rgba(255, 255, 255, 0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.50)',
        }}
      >
        <span className="font-semibold text-sm truncate flex-1 flex items-center" style={{ color: '#1A1A2E' }}>
          {obraNombre || '…'}
        </span>
        <nav className="flex h-full">
          <Link
            href={`/obras/${obraId}/medicion`}
            className="px-5 flex items-center text-sm font-semibold border-b-2"
            style={{ borderColor: '#1A1A2E', color: '#1A1A2E' }}
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
        </nav>
      </header>

      {/* ── Contenido de dos paneles ── */}
      <div className="flex flex-1">
        {/* ── Panel izquierdo: rubros ── */}
        <aside
          className="w-[260px] shrink-0 flex flex-col sticky top-12 h-[calc(100vh-3rem)] overflow-hidden backdrop-blur-[20px]"
          style={{
            background: 'rgba(255, 255, 255, 0.60)',
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Header del panel izquierdo */}
          <div
            className="px-4 py-3 flex items-center justify-between shrink-0"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#1A1A2E' }}>Rubros</span>
            <button
              onClick={() => setAgregandoRubro(true)}
              disabled={agregandoRubro}
              className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-colors hover:bg-[#B8D63C] disabled:opacity-40"
              style={{ background: '#C8E64C', color: '#2A3300' }}
              title="Nuevo rubro"
            >
              +
            </button>
          </div>

          {/* Lista de rubros */}
          {cargandoRubros ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm" style={{ color: '#6B7080' }}>Cargando…</p>
            </div>
          ) : errorRubros ? (
            <div className="flex-1 flex items-center justify-center px-4">
              <p className="text-sm text-center" style={{ color: '#EF4444' }}>{errorRubros}</p>
            </div>
          ) : rubros.length === 0 && !agregandoRubro ? (
            <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
              <p className="text-sm font-medium mb-2" style={{ color: '#1A1A2E' }}>
                Creá tu primer rubro para empezar
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#6B7080' }}>
                Ej: Excavación, Hormigón Armado, Mampostería
              </p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto py-1">
              {rubros.map((rubro) => {
                const activo = rubro.id === rubroSeleccionadoId;
                return (
                  <li
                    key={rubro.id}
                    className="group flex items-stretch transition-colors"
                    style={{
                      borderLeft: activo ? '3px solid #C8E64C' : '3px solid transparent',
                    }}
                  >
                    <button
                      onClick={() => setRubroSeleccionadoId(rubro.id)}
                      className="flex-1 min-w-0 text-left px-4 py-3 flex items-center justify-between gap-2 transition-colors hover:bg-black/[0.04]"
                      style={
                        activo
                          ? { background: 'rgba(200,230,76,0.10)' }
                          : undefined
                      }
                    >
                      <span className="text-sm font-medium truncate" style={{ color: '#1A1A2E' }}>
                        {rubro.nombre}
                      </span>
                      <span
                        className="text-xs font-mono tabular-nums shrink-0"
                        style={{ color: activo ? '#1A1A2E' : '#9CA3AF', fontWeight: activo ? 600 : 400 }}
                      >
                        {subtotales[rubro.id] !== undefined
                          ? formatPrecio(subtotales[rubro.id])
                          : '—'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleEliminarRubro(rubro)}
                      title="Eliminar rubro"
                      className="px-2 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
                      style={{ color: '#9CA3AF' }}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer: formulario de nuevo rubro */}
          {agregandoRubro && (
            <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <input
                ref={nuevoRubroRef}
                type="text"
                value={nuevoRubroNombre}
                onChange={(e) => setNuevoRubroNombre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleCrearRubro(); }
                  if (e.key === 'Escape') {
                    setAgregandoRubro(false);
                    setNuevoRubroNombre('');
                    setErrorNuevoRubro(null);
                  }
                }}
                placeholder="Nombre del rubro…"
                disabled={guardandoRubro}
                className="w-full border border-black/[0.12] rounded-[10px] px-2.5 py-2 text-sm text-[#1A1A2E] bg-white/60 focus:outline-none focus:border-[#C8E64C] focus:shadow-[0_0_0_3px_rgba(200,230,76,0.2)] transition-all placeholder:text-[#9CA3AF]"
              />
              {errorNuevoRubro && (
                <div
                  className="mt-1 rounded-[8px] px-2 py-1 text-xs"
                  style={{ background: '#FEE2E2', color: '#EF4444' }}
                >
                  {errorNuevoRubro}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleCrearRubro}
                  disabled={guardandoRubro || !nuevoRubroNombre.trim()}
                  className="flex-1 bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] text-xs py-1.5 rounded-full font-semibold disabled:opacity-40 transition-colors"
                >
                  {guardandoRubro ? '…' : 'Crear'}
                </button>
                <button
                  onClick={() => {
                    setAgregandoRubro(false);
                    setNuevoRubroNombre('');
                    setErrorNuevoRubro(null);
                  }}
                  className="flex-1 text-xs py-1.5 rounded-full font-medium transition-colors"
                  style={{ color: '#6B7080' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* ── Panel derecho: ítems y mediciones ── */}
        <section className="flex-1 min-h-screen" style={{ background: 'rgba(255,255,255,0.20)' }}>
          {rubroSeleccionado === null ? (
            <div
              className="flex flex-col items-center justify-center gap-4"
              style={{ height: 'calc(100vh - 48px)' }}
            >
              {rubros.length === 0 && !cargandoRubros ? (
                <>
                  <div className="text-center">
                    <p className="text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>
                      Creá tu primer rubro para empezar
                    </p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>
                      Ej: Excavación, Hormigón Armado, Mampostería
                    </p>
                  </div>
                  <button
                    onClick={() => setAgregandoRubro(true)}
                    className="bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
                  >
                    + Crear primer rubro
                  </button>
                </>
              ) : (
                <p className="text-sm" style={{ color: '#6B7080' }}>
                  Seleccioná un rubro para ver sus ítems.
                </p>
              )}
            </div>
          ) : (
            <ContenidoRubro
              key={rubroSeleccionadoId!}
              rubroId={rubroSeleccionadoId!}
              rubroNombre={rubroSeleccionado.nombre}
              recetas={recetas}
              onSubtotalChange={handleSubtotalChange}
            />
          )}
        </section>
      </div>
    </div>
  );
}
