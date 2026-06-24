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
  'w-full border border-pragma-superficie rounded-md px-3 py-2 text-sm text-pragma-texto bg-white focus:outline-none focus:ring-2 focus:ring-pragma-accent';

/* Inputs de medición: borde solo visible en focus, planilla limpia en reposo */
const INPUT_FILA =
  'w-full border border-transparent rounded px-2 py-1 text-sm text-pragma-texto bg-transparent focus:outline-none focus:border-pragma-superficie focus:bg-white focus:ring-1 focus:ring-pragma-accent transition-colors';

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
    <div className="border border-pragma-superficie rounded-xl mb-4 overflow-hidden bg-white shadow-[0_2px_9px_-5px_rgba(28,20,16,0.15)]">
      {/* Cabecera del ítem */}
      <div className="border-l-[3px] border-pragma-accent px-4 py-3 flex items-start justify-between gap-4 border-b border-pragma-superficie bg-white">
        <div className="min-w-0">
          <p className="font-medium text-pragma-texto truncate">{item.descripcion}</p>
          <p className="text-xs text-pragma-textoClaro mt-0.5">
            {item.receta.nombre} · {item.receta.unidad_medida}
          </p>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <div className="text-right">
            <p className="text-xs text-pragma-textoClaro">Cantidad</p>
            <p className="text-sm font-medium text-pragma-texto font-mono tabular-nums">
              {formatNum(cantidadTotal)} {item.receta.unidad_medida}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-pragma-textoClaro">P. Unitario</p>
            <p className="text-sm font-medium text-pragma-texto font-mono tabular-nums">
              {formatPrecio(precioUnitario)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-pragma-textoClaro">Subtotal</p>
            <p className="text-sm font-bold text-pragma-totales font-mono tabular-nums">
              {formatPrecio(subtotal)}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onEditar}
              className="text-xs text-pragma-accent font-medium hover:underline"
            >
              Editar
            </button>
            <button
              onClick={onEliminar}
              className="text-xs text-red-400 font-medium hover:underline hover:text-red-600"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de mediciones */}
      {cargando ? (
        <p className="px-4 py-3 text-sm text-pragma-textoClaro">Cargando mediciones…</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-pragma-fondo border-b border-pragma-superficie">
              <th className="px-4 py-2 text-left text-xs font-medium text-pragma-textoClaro uppercase tracking-wider">Descripción</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-pragma-textoClaro uppercase tracking-wider w-20">N</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-pragma-textoClaro uppercase tracking-wider w-20">Largo</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-pragma-textoClaro uppercase tracking-wider w-20">Ancho</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-pragma-textoClaro uppercase tracking-wider w-20">Alto</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-pragma-textoClaro uppercase tracking-wider w-24">Cantidad</th>
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
                    className="border-b border-pragma-superficie/40 bg-pragma-accent/5"
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
                        type="number"
                        min="0"
                        step="0.001"
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
                        type="number"
                        min="0"
                        step="0.001"
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
                        type="number"
                        min="0"
                        step="0.001"
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
                        type="number"
                        min="0"
                        step="0.001"
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
                    <td className="px-3 py-2 text-right font-mono font-medium text-pragma-textoClaro tabular-nums">
                      {formatNum(m.cantidad_calculada)}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button
                        onClick={() => setEditandoId(null)}
                        title="Cancelar edición (Esc)"
                        className="text-xl leading-none text-pragma-textoClaro hover:text-red-500 transition-colors"
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
                  className="border-b border-pragma-superficie/40 hover:bg-pragma-fondo/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-2 text-pragma-texto">{m.descripcion}</td>
                  <td className="px-3 py-2 text-right text-pragma-textoClaro font-mono tabular-nums">{m.n}</td>
                  <td className="px-3 py-2 text-right text-pragma-textoClaro font-mono tabular-nums">
                    {m.largo ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-pragma-textoClaro font-mono tabular-nums">
                    {m.ancho ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-pragma-textoClaro font-mono tabular-nums">
                    {m.alto ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-pragma-texto tabular-nums">
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
                      className="text-xl leading-none text-pragma-textoClaro hover:text-red-500 transition-colors"
                      title="Eliminar medición"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Fila de nueva medición */}
            <tr className="border-t-2 border-pragma-accent/20 bg-pragma-fondo/50">
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
                  type="number"
                  min="0"
                  step="0.001"
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
                  type="number"
                  min="0"
                  step="0.001"
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
                  type="number"
                  min="0"
                  step="0.001"
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
                  type="number"
                  min="0"
                  step="0.001"
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
                  className="font-bold text-base leading-none text-pragma-accent hover:text-pragma-totales disabled:opacity-30 transition-colors"
                >
                  ↵
                </button>
              </td>
            </tr>

            {errorFila && (
              <tr>
                <td colSpan={7} className="px-4 py-1.5">
                  <div className="bg-red-50 border border-red-200 rounded px-3 py-1.5 text-xs text-red-700">
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
  const [formItem, setFormItem] = useState({ descripcion: '', receta_id: '' });
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [guardandoModal, setGuardandoModal] = useState(false);

  function abrirCrear() {
    setItemEditando(null);
    setFormItem({ descripcion: '', receta_id: '' });
    setErrorModal(null);
    setModalAbierto(true);
  }

  function abrirEditar(item: ItemConReceta) {
    setItemEditando(item);
    setFormItem({ descripcion: item.descripcion, receta_id: item.receta_id });
    setErrorModal(null);
    setModalAbierto(true);
  }

  async function handleGuardarModal() {
    if (!formItem.descripcion.trim() || !formItem.receta_id || guardandoModal) return;
    setGuardandoModal(true);
    setErrorModal(null);
    try {
      if (itemEditando) {
        await actualizarItem(itemEditando.id, {
          descripcion: formItem.descripcion.trim(),
          receta_id: formItem.receta_id,
          orden: itemEditando.orden,
        });
      } else {
        await crearItem({
          descripcion: formItem.descripcion.trim(),
          receta_id: formItem.receta_id,
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
        <h2 className="text-xl font-bold text-pragma-texto">{rubroNombre}</h2>
        <button
          onClick={abrirCrear}
          className="bg-pragma-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Nuevo ítem
        </button>
      </div>

      {cargando ? (
        <p className="text-center text-pragma-textoClaro mt-16">Cargando ítems…</p>
      ) : error ? (
        <div className="mx-auto max-w-md mt-16 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm text-center">
          {error}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-pragma-textoClaro mt-16">
          No hay ítems en este rubro. Creá el primero con el botón de arriba.
        </p>
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
            <div className="bg-pragma-totales/10 border border-pragma-totales/20 rounded-xl px-5 py-3 text-right">
              <p className="text-xs text-pragma-textoClaro mb-0.5">Subtotal {rubroNombre}</p>
              <p className="text-xl font-bold text-pragma-totales font-mono tabular-nums">
                {formatPrecio(subtotalRubro)}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Modal ítem */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-pragma-texto mb-5">
              {itemEditando ? 'Editar ítem' : 'Nuevo ítem'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-pragma-texto mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formItem.descripcion}
                  onChange={(e) => setFormItem((f) => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Tabique de ladrillos huecos 0.18"
                  className={INPUT_MODAL}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pragma-texto mb-1">
                  Receta (APU)
                </label>
                <select
                  value={formItem.receta_id}
                  onChange={(e) => setFormItem((f) => ({ ...f, receta_id: e.target.value }))}
                  className={INPUT_MODAL}
                >
                  <option value="">— Elegir receta —</option>
                  {recetas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} ({r.unidad_medida})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errorModal && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-700">
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
                className="px-4 py-2 text-sm font-medium text-pragma-textoClaro hover:text-pragma-texto transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarModal}
                disabled={
                  guardandoModal || !formItem.descripcion.trim() || !formItem.receta_id
                }
                className="bg-pragma-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
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
      <header className="sticky top-0 z-10 bg-white border-b border-pragma-superficie px-6 flex items-stretch gap-4 shrink-0" style={{ height: '48px' }}>
        <span className="font-semibold text-pragma-texto text-sm truncate flex-1 flex items-center">
          {obraNombre || '…'}
        </span>
        <nav className="flex h-full">
          <Link
            href={`/obras/${obraId}/medicion`}
            className="px-5 flex items-center text-sm font-medium border-b-2 border-pragma-accent text-pragma-texto"
          >
            Cómputo
          </Link>
          <Link
            href={`/obras/${obraId}/presupuesto`}
            className="px-5 flex items-center text-sm font-medium border-b-2 border-transparent text-pragma-textoClaro hover:text-pragma-texto transition-colors"
          >
            Presupuesto
          </Link>
        </nav>
      </header>

      {/* ── Contenido de dos paneles ── */}
      <div className="flex flex-1">
        {/* ── Panel izquierdo: rubros ── */}
        <aside className="w-[260px] shrink-0 bg-pragma-superficie border-r border-pragma-superficie/60 flex flex-col sticky top-12 h-[calc(100vh-3rem)] overflow-hidden">
          {/* Lista de rubros */}
          {cargandoRubros ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-pragma-textoClaro">Cargando…</p>
            </div>
          ) : errorRubros ? (
            <div className="flex-1 flex items-center justify-center px-4">
              <p className="text-sm text-red-500 text-center">{errorRubros}</p>
            </div>
          ) : rubros.length === 0 && !agregandoRubro ? (
            <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
              <p className="text-sm font-medium text-pragma-texto mb-2">
                Creá tu primer rubro para empezar
              </p>
              <p className="text-xs text-pragma-textoClaro leading-relaxed">
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
                    className={`group flex items-stretch transition-colors border-l-[3px] ${
                      activo ? 'border-pragma-accent' : 'border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => setRubroSeleccionadoId(rubro.id)}
                      className={`flex-1 min-w-0 text-left px-4 py-3 flex items-center justify-between gap-2 transition-colors ${
                        activo
                          ? 'bg-white/40 text-pragma-texto'
                          : 'text-pragma-texto hover:bg-black/5'
                      }`}
                    >
                      <span className="text-sm font-medium truncate">{rubro.nombre}</span>
                      <span
                        className={`text-xs font-mono tabular-nums shrink-0 ${
                          activo ? 'text-pragma-totales font-semibold' : 'text-pragma-textoClaro'
                        }`}
                      >
                        {subtotales[rubro.id] !== undefined
                          ? formatPrecio(subtotales[rubro.id])
                          : '—'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleEliminarRubro(rubro)}
                      title="Eliminar rubro"
                      className="px-2 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none text-pragma-textoClaro hover:text-red-500"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer: agregar rubro */}
          <div className="border-t border-black/10 p-3 shrink-0">
            {agregandoRubro ? (
              <div>
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
                  className="w-full border border-pragma-accent/40 rounded-md px-2 py-1.5 text-sm text-pragma-texto bg-white focus:outline-none focus:ring-1 focus:ring-pragma-accent"
                />
                {errorNuevoRubro && (
                  <div className="mt-1 bg-red-50 border border-red-200 rounded px-2 py-1 text-xs text-red-700">
                    {errorNuevoRubro}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleCrearRubro}
                    disabled={guardandoRubro || !nuevoRubroNombre.trim()}
                    className="flex-1 bg-pragma-accent text-white text-xs py-1.5 rounded-md font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    {guardandoRubro ? '…' : 'Crear'}
                  </button>
                  <button
                    onClick={() => {
                      setAgregandoRubro(false);
                      setNuevoRubroNombre('');
                      setErrorNuevoRubro(null);
                    }}
                    className="flex-1 text-xs py-1.5 rounded-md font-medium text-pragma-textoClaro hover:text-pragma-texto transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAgregandoRubro(true)}
                className="w-full text-sm text-pragma-accent font-medium hover:underline text-left py-0.5"
              >
                + Agregar rubro
              </button>
            )}
          </div>
        </aside>

        {/* ── Panel derecho: ítems y mediciones ── */}
        <section className="flex-1 bg-pragma-fondo min-h-screen">
          {rubroSeleccionado === null ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-pragma-textoClaro text-sm">
                {rubros.length === 0 && !cargandoRubros
                  ? 'Creá un rubro en el panel izquierdo para comenzar.'
                  : 'Seleccioná un rubro para ver sus ítems.'}
              </p>
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
