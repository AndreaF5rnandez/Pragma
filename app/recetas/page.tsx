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
  'w-full border border-black/[0.12] rounded-[10px] px-3.5 py-2.5 text-sm text-[#1A1A2E] bg-white/60 backdrop-blur-[8px] focus:outline-none focus:border-[#C8E64C] focus:shadow-[0_0_0_3px_rgba(200,230,76,0.2)] transition-all placeholder:text-[#9CA3AF]';

const INPUT_ING =
  'w-full border border-black/[0.12] rounded-[8px] px-2 py-1.5 text-sm text-[#1A1A2E] bg-white/60 focus:outline-none focus:border-[#C8E64C] focus:shadow-[0_0_0_3px_rgba(200,230,76,0.2)] transition-all placeholder:text-[#9CA3AF]';

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
          className="shrink-0 text-base leading-none transition-colors"
          style={{ color: '#6B7080' }}
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
    <div className="p-6">
      {/* Barra superior */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>Precios Unitarios</h1>
        <button
          onClick={abrirCrear}
          className="bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] px-5 py-2 rounded-full text-sm font-semibold transition-colors"
        >
          + Nuevo precio unitario
        </button>
      </div>

      {/* Contenido principal */}
      {cargando ? (
        <p className="text-center mt-20 text-sm" style={{ color: '#6B7080' }}>Cargando...</p>
      ) : error ? (
        <div
          className="mx-auto max-w-md mt-20 rounded-2xl px-4 py-3 text-sm text-center"
          style={{ background: '#FEE2E2', color: '#EF4444' }}
        >
          {error}
        </div>
      ) : recetas.length === 0 ? (
        <p className="text-center mt-20 text-sm" style={{ color: '#6B7080' }}>
          No hay precios unitarios todavía. Creá el primero con el botón de arriba.
        </p>
      ) : (
        <div
          className="rounded-2xl overflow-hidden backdrop-blur-[20px]"
          style={{
            background: 'rgba(255, 255, 255, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.60)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[45%]" style={{ color: '#9CA3AF' }}>Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[18%]" style={{ color: '#9CA3AF' }}>Unidad</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider w-[22%]" style={{ color: '#9CA3AF' }}>
                  Precio unitario
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider w-[15%]" style={{ color: '#9CA3AF' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {recetas.map((receta) => (
                <tr
                  key={receta.id}
                  className="hover:bg-black/[0.02] transition-colors"
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#1A1A2E' }}>{receta.nombre}</td>
                  <td className="px-4 py-3" style={{ color: '#6B7080' }}>{receta.unidad_medida}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums" style={{ color: '#1A1A2E' }}>
                    {formatPrecio(calcularPrecioReceta(receta))}
                  </td>
                  <td className="px-4 py-3 text-right space-x-4">
                    <button
                      onClick={() => abrirEditar(receta)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: '#C8E64C' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(receta)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: '#EF4444' }}
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
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 backdrop-blur-[24px]"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.60)',
              borderRadius: '20px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2 className="text-lg font-bold mb-5" style={{ color: '#1A1A2E' }}>
              {recetaEditando ? 'Editar precio unitario' : 'Nuevo precio unitario'}
            </h2>

            <div className="space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>Nombre</label>
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
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>Unidad</label>
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
                  <label className="block text-sm font-medium" style={{ color: '#1A1A2E' }}>
                    Ingredientes
                  </label>
                  {ingredientesForm.length > 0 && (
                    <span className="text-xs" style={{ color: '#6B7080' }}>
                      {ingredientesForm.filter((i) => i.insumo_id).length} insumo
                      {ingredientesForm.filter((i) => i.insumo_id).length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {ingredientesForm.length === 0 ? (
                  <div
                    className="text-sm text-center py-6 rounded-2xl border-dashed border"
                    style={{
                      color: '#6B7080',
                      background: 'rgba(255,255,255,0.40)',
                      borderColor: 'rgba(0,0,0,0.10)',
                    }}
                  >
                    Sin ingredientes todavía.
                  </div>
                ) : (
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.40)',
                      border: '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
                            Insumo
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider w-24" style={{ color: '#9CA3AF' }}>
                            Cantidad
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider w-16" style={{ color: '#9CA3AF' }}>
                            Unidad
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider w-28" style={{ color: '#9CA3AF' }}>
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
                            <tr
                              key={idx}
                              style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                            >
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
                              <td className="px-3 py-2 text-xs" style={{ color: '#9CA3AF' }}>
                                {insumoSel?.unidad_medida ?? '—'}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-semibold text-xs tabular-nums" style={{ color: '#1A1A2E' }}>
                                {ing.insumo_id ? formatPrecio(subtotalParcial) : '—'}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => quitarIngrediente(idx)}
                                  title="Quitar ingrediente"
                                  className="text-xl leading-none transition-colors"
                                  style={{ color: '#9CA3AF' }}
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
                  className="mt-2 text-sm font-medium hover:underline"
                  style={{ color: '#6B7080' }}
                >
                  + Agregar ingrediente
                </button>
              </div>

              {/* Precio calculado en tiempo real */}
              <div
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{
                  background: 'rgba(200,230,76,0.12)',
                  border: '1px solid rgba(200,230,76,0.30)',
                }}
              >
                <span className="text-sm font-medium" style={{ color: '#1A1A2E' }}>
                  Precio unitario calculado
                </span>
                <span className="text-xl font-bold font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                  {formatPrecio(calcularPrecioForm())}
                </span>
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
                onClick={cerrarModal}
                disabled={guardando}
                className="px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ color: '#6B7080' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando || !form.nombre.trim() || !form.unidad_medida}
                className="bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] px-5 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {guardando
                  ? 'Guardando…'
                  : recetaEditando
                  ? 'Guardar cambios'
                  : 'Crear precio unitario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
