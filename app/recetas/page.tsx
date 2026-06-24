'use client';

import { useState } from 'react';
import { useRecetas } from '@/hooks/useRecetas';
import { useInsumos } from '@/hooks/useInsumos';
import type { RecetaConInsumos } from '@/types';

/* ─── Unidades predefinidas (mismas que insumos) ───────────────────────────── */

const UNIDADES = [
  { valor: 'm2',  etiqueta: 'm² — metro cuadrado' },
  { valor: 'u',   etiqueta: 'u — unidad' },
  { valor: 'm',   etiqueta: 'm — metro' },
  { valor: 'm3',  etiqueta: 'm³ — metro cúbico' },
  { valor: 'kg',  etiqueta: 'kg — kilogramo' },
  { valor: 'km',  etiqueta: 'km — kilómetro' },
  { valor: 't',   etiqueta: 't — tonelada' },
  { valor: 'l',   etiqueta: 'l — litro' },
  { valor: 'h',   etiqueta: 'h — hora' },
  { valor: 'd',   etiqueta: 'd — día' },
  { valor: 'a',   etiqueta: 'a — área' },
  { valor: 'ha',  etiqueta: 'ha — hectárea' },
  { valor: 'cm3', etiqueta: 'cm³ — centímetro cúbico' },
  { valor: 'cm2', etiqueta: 'cm² — centímetro cuadrado' },
  { valor: 'dm3', etiqueta: 'dm³ — decímetro cúbico' },
  { valor: 'mu',  etiqueta: 'mu — mil unidades' },
  { valor: 'cu',  etiqueta: 'cu — cien unidades' },
  { valor: 'mes', etiqueta: 'mes — mes' },
];

const VALORES_PREDEFINIDOS = new Set(UNIDADES.map((u) => u.valor));
const SENTINEL_OTRA = '__otra__';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(precio);
}

const INPUT_MODAL =
  'w-full border border-pragma-superficie rounded-md px-3 py-2 text-sm text-pragma-texto bg-white focus:outline-none focus:ring-2 focus:ring-pragma-accent';
const INPUT_ING =
  'w-full border border-pragma-superficie rounded px-2 py-1.5 text-sm text-pragma-texto bg-white focus:outline-none focus:ring-1 focus:ring-pragma-accent';

/* ─── Componente UnidadInput ───────────────────────────────────────────────── */

function UnidadInput({
  value,
  onChange,
  inputClass,
}: {
  value: string;
  onChange: (v: string) => void;
  inputClass: string;
}) {
  const [modoTexto, setModoTexto] = useState(
    () => value !== '' && !VALORES_PREDEFINIDOS.has(value),
  );

  if (modoTexto) {
    return (
      <span className="flex items-center gap-1 min-w-0">
        <input
          type="text"
          value={value}
          autoFocus={value === ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ej: glb, viaje"
          className={inputClass}
        />
        <button
          type="button"
          title="Volver al listado"
          onClick={() => { setModoTexto(false); onChange(''); }}
          className="shrink-0 text-base leading-none text-pragma-textoClaro hover:text-pragma-texto"
        >
          ↩
        </button>
      </span>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === SENTINEL_OTRA) {
          setModoTexto(true);
          onChange('');
        } else {
          onChange(e.target.value);
        }
      }}
      className={inputClass}
    >
      <option value="">— Elegir —</option>
      {UNIDADES.map(({ valor, etiqueta }) => (
        <option key={valor} value={valor}>
          {etiqueta}
        </option>
      ))}
      <option value={SENTINEL_OTRA}>Otra…</option>
    </select>
  );
}

/* ─── Tipos del formulario ─────────────────────────────────────────────────── */

type IngredienteForm = { insumo_id: string; cantidad: number };
type FormReceta = { nombre: string; unidad_medida: string };

const FORM_INICIAL: FormReceta = { nombre: '', unidad_medida: '' };

/* ─── Página ───────────────────────────────────────────────────────────────── */

export default function RecetasPage() {
  const { recetas, cargando, error, crearReceta, actualizarReceta, eliminarReceta } = useRecetas();
  const { insumos } = useInsumos();

  /* Estado del modal */
  const [modalAbierto, setModalAbierto] = useState(false);
  const [recetaEditando, setRecetaEditando] = useState<RecetaConInsumos | null>(null);
  const [form, setForm] = useState<FormReceta>(FORM_INICIAL);
  const [ingredientesForm, setIngredientesForm] = useState<IngredienteForm[]>([]);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [unidadKey, setUnidadKey] = useState(0);

  /* ── Precio calculado en tiempo real ── */

  function calcularPrecioForm(): number {
    return ingredientesForm.reduce((total, ing) => {
      if (!ing.insumo_id) return total;
      const insumo = insumos.find((i) => i.id === ing.insumo_id);
      return total + (insumo ? ing.cantidad * insumo.precio_unitario : 0);
    }, 0);
  }

  function calcularPrecioReceta(receta: RecetaConInsumos): number {
    return receta.ingredientes.reduce(
      (total, ing) => total + ing.cantidad * ing.insumo.precio_unitario,
      0,
    );
  }

  /* ── Modal ── */

  function abrirCrear() {
    setRecetaEditando(null);
    setForm(FORM_INICIAL);
    setIngredientesForm([]);
    setErrorModal(null);
    setUnidadKey((k) => k + 1);
    setModalAbierto(true);
  }

  function abrirEditar(receta: RecetaConInsumos) {
    setRecetaEditando(receta);
    setForm({ nombre: receta.nombre, unidad_medida: receta.unidad_medida });
    setIngredientesForm(
      receta.ingredientes.map((ing) => ({ insumo_id: ing.insumo_id, cantidad: ing.cantidad })),
    );
    setErrorModal(null);
    setUnidadKey((k) => k + 1);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setRecetaEditando(null);
  }

  async function handleGuardar() {
    if (!form.nombre.trim() || !form.unidad_medida || guardando) return;
    setGuardando(true);
    setErrorModal(null);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        unidad_medida: form.unidad_medida,
        ingredientes: ingredientesForm
          .filter((i) => i.insumo_id !== '' && i.cantidad > 0)
          .map((i) => ({ insumo_id: i.insumo_id, cantidad: i.cantidad })),
      };
      if (recetaEditando) {
        await actualizarReceta(recetaEditando.id, payload);
      } else {
        await crearReceta(payload);
      }
      cerrarModal();
    } catch (err) {
      setErrorModal(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  /* ── Eliminar ── */

  async function handleEliminar(receta: RecetaConInsumos) {
    if (!window.confirm(`¿Eliminás "${receta.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarReceta(receta.id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  /* ── Ingredientes del formulario ── */

  function agregarIngrediente() {
    setIngredientesForm((prev) => [...prev, { insumo_id: '', cantidad: 1 }]);
  }

  function actualizarIngrediente(idx: number, update: Partial<IngredienteForm>) {
    setIngredientesForm((prev) =>
      prev.map((ing, i) => (i !== idx ? ing : { ...ing, ...update })),
    );
  }

  function quitarIngrediente(idx: number) {
    setIngredientesForm((prev) => prev.filter((_, i) => i !== idx));
  }

  /* ── Render ── */

  return (
    <div className="p-8">
      {/* Barra superior */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-pragma-texto">Recetas (APU)</h1>
        <button
          onClick={abrirCrear}
          className="bg-pragma-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Nueva receta
        </button>
      </div>

      {/* Contenido principal */}
      {cargando ? (
        <p className="text-center text-pragma-textoClaro mt-20">Cargando...</p>
      ) : error ? (
        <div className="mx-auto max-w-md mt-20 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm text-center">
          {error}
        </div>
      ) : recetas.length === 0 ? (
        <p className="text-center text-pragma-textoClaro mt-20">
          No hay recetas todavía. Creá la primera con el botón de arriba.
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow-[0_4px_6px_-1px_rgba(28,20,16,0.08),0_2px_4px_-1px_rgba(28,20,16,0.05)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-pragma-superficie text-left">
                <th className="px-4 py-3 text-xs font-medium text-pragma-textoClaro uppercase tracking-wider w-[45%]">Nombre</th>
                <th className="px-4 py-3 text-xs font-medium text-pragma-textoClaro uppercase tracking-wider w-[18%]">Unidad</th>
                <th className="px-4 py-3 text-xs font-medium text-pragma-textoClaro uppercase tracking-wider text-right w-[22%]">
                  Precio unitario
                </th>
                <th className="px-4 py-3 text-xs font-medium text-pragma-textoClaro uppercase tracking-wider text-right w-[15%]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {recetas.map((receta, i) => (
                <tr
                  key={receta.id}
                  className={`border-t border-pragma-superficie/60 hover:bg-pragma-fondo/80 transition-colors ${
                    i % 2 === 0 ? 'bg-white' : 'bg-pragma-fondo/40'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-pragma-texto">{receta.nombre}</td>
                  <td className="px-4 py-3 text-pragma-textoClaro">{receta.unidad_medida}</td>
                  <td className="px-4 py-3 text-right text-pragma-totales font-mono font-semibold tabular-nums">
                    {formatPrecio(calcularPrecioReceta(receta))}
                  </td>
                  <td className="px-4 py-3 text-right space-x-4">
                    <button
                      onClick={() => abrirEditar(receta)}
                      className="text-pragma-accent text-xs font-medium hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(receta)}
                      className="text-red-400 text-xs font-medium hover:underline hover:text-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal crear / editar ── */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-pragma-texto mb-5">
              {recetaEditando ? 'Editar receta' : 'Nueva receta'}
            </h2>

            <div className="space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-pragma-texto mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Revoque fino de pared"
                  className={INPUT_MODAL}
                  autoFocus
                />
              </div>

              {/* Unidad */}
              <div>
                <label className="block text-sm font-medium text-pragma-texto mb-1">Unidad</label>
                <UnidadInput
                  key={unidadKey}
                  value={form.unidad_medida}
                  onChange={(v) => setForm((f) => ({ ...f, unidad_medida: v }))}
                  inputClass={INPUT_MODAL}
                />
              </div>

              {/* Ingredientes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-pragma-texto">
                    Ingredientes
                  </label>
                  {ingredientesForm.length > 0 && (
                    <span className="text-xs text-pragma-textoClaro">
                      {ingredientesForm.filter((i) => i.insumo_id).length} insumo
                      {ingredientesForm.filter((i) => i.insumo_id).length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {ingredientesForm.length === 0 ? (
                  <div className="text-sm text-pragma-textoClaro text-center py-6 bg-pragma-fondo rounded-lg border border-pragma-superficie border-dashed">
                    Sin ingredientes todavía.
                  </div>
                ) : (
                  <div className="bg-pragma-fondo rounded-lg border border-pragma-superficie overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-pragma-superficie/60">
                          <th className="px-3 py-2 text-left text-xs font-medium text-pragma-textoClaro uppercase tracking-wider">
                            Insumo
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-pragma-textoClaro uppercase tracking-wider w-24">
                            Cantidad
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-pragma-textoClaro uppercase tracking-wider w-16">
                            Unidad
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-pragma-textoClaro uppercase tracking-wider w-28">
                            Subtotal
                          </th>
                          <th className="px-3 py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {ingredientesForm.map((ing, idx) => {
                          const insumoSel = insumos.find((i) => i.id === ing.insumo_id);
                          const subtotalParcial = insumoSel
                            ? ing.cantidad * insumoSel.precio_unitario
                            : 0;
                          return (
                            <tr key={idx} className="border-t border-pragma-superficie/40 bg-white">
                              <td className="px-3 py-2">
                                <select
                                  value={ing.insumo_id}
                                  onChange={(e) =>
                                    actualizarIngrediente(idx, { insumo_id: e.target.value })
                                  }
                                  className={INPUT_ING}
                                >
                                  <option value="">— Elegir insumo —</option>
                                  {insumos.map((insumo) => (
                                    <option key={insumo.id} value={insumo.id}>
                                      {insumo.nombre}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  value={ing.cantidad === 0 ? '' : ing.cantidad}
                                  onChange={(e) =>
                                    actualizarIngrediente(idx, {
                                      cantidad:
                                        e.target.value === '' ? 0 : Number(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className={`${INPUT_ING} text-right font-mono`}
                                />
                              </td>
                              <td className="px-3 py-2 text-pragma-textoClaro text-xs">
                                {insumoSel?.unidad_medida ?? '—'}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-pragma-totales text-xs font-semibold tabular-nums">
                                {ing.insumo_id ? formatPrecio(subtotalParcial) : '—'}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => quitarIngrediente(idx)}
                                  title="Quitar ingrediente"
                                  className="text-xl leading-none text-pragma-textoClaro hover:text-red-500 transition-colors"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  onClick={agregarIngrediente}
                  className="mt-2 text-sm text-pragma-accent font-medium hover:underline"
                >
                  + Agregar ingrediente
                </button>
              </div>

              {/* Precio calculado en tiempo real */}
              <div className="flex items-center justify-between bg-pragma-totales/10 border border-pragma-totales/20 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-pragma-texto">
                  Precio unitario calculado
                </span>
                <span className="text-xl font-bold text-pragma-totales font-mono tabular-nums">
                  {formatPrecio(calcularPrecioForm())}
                </span>
              </div>
            </div>

            {errorModal && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-700">
                {errorModal}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={cerrarModal}
                disabled={guardando}
                className="px-4 py-2 text-sm font-medium text-pragma-textoClaro hover:text-pragma-texto transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !form.nombre.trim() || !form.unidad_medida}
                className="bg-pragma-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {guardando
                  ? 'Guardando…'
                  : recetaEditando
                  ? 'Guardar cambios'
                  : 'Crear receta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
