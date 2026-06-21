'use client';

import { useRef, useState } from 'react';
import { useInsumos } from '@/hooks/useInsumos';
import type { Insumo } from '@/types';

/* ─── Unidades predefinidas ────────────────────────────────────────────────── */

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

/* ─── Tipos y badges ───────────────────────────────────────────────────────── */

const TIPO_CONFIG: Record<Insumo['tipo'], { etiqueta: string; clases: string }> = {
  material:     { etiqueta: 'Material',     clases: 'bg-green-100 text-green-800' },
  mano_de_obra: { etiqueta: 'Mano de obra', clases: 'bg-blue-100 text-blue-800' },
  equipo:       { etiqueta: 'Equipo',       clases: 'bg-orange-100 text-orange-800' },
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

type FormData = Omit<Insumo, 'id' | 'created_at' | 'updated_at'>;

const FORM_INICIAL: FormData = {
  nombre: '',
  unidad_medida: '',
  tipo: 'material',
  precio_unitario: 0,
};

const INPUT_INLINE =
  'w-full border border-pragma-superficie rounded px-2 py-1.5 text-sm text-pragma-texto bg-white focus:outline-none focus:ring-1 focus:ring-pragma-accent';
const INPUT_MODAL =
  'w-full border border-pragma-superficie rounded-md px-3 py-2 text-sm text-pragma-texto bg-white focus:outline-none focus:ring-2 focus:ring-pragma-accent';

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(precio);
}

/* ─── Componente UnidadInput ───────────────────────────────────────────────── */
/*
 * Muestra un <select> con las unidades predefinidas + "Otra…".
 * Al elegir "Otra…" (o si el valor inicial no está en el listado) cambia a un
 * <input type="text"> con un botón ↩ para volver al select.
 */
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

/* ─── Página ───────────────────────────────────────────────────────────────── */

export default function InsumosPage() {
  const [filtroTipo, setFiltroTipo] = useState<Insumo['tipo'] | undefined>(undefined);
  const { insumos, cargando, error, crearInsumo, actualizarInsumo, eliminarInsumo } =
    useInsumos(filtroTipo);

  /* Modal — sólo para editar */
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null);
  const [form, setForm] = useState<FormData>(FORM_INICIAL);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [guardandoModal, setGuardandoModal] = useState(false);

  /* Fila de creación rápida */
  const [fila, setFila] = useState<FormData>(FORM_INICIAL);
  const [errorFila, setErrorFila] = useState<string | null>(null);
  const [guardandoFila, setGuardandoFila] = useState(false);
  const [filaClave, setFilaClave] = useState(0); // fuerza remount de UnidadInput al limpiar la fila
  const nombreRef = useRef<HTMLInputElement>(null);

  /* ── Modal ── */

  function abrirEditar(insumo: Insumo) {
    setInsumoEditando(insumo);
    setForm({
      nombre: insumo.nombre,
      unidad_medida: insumo.unidad_medida,
      tipo: insumo.tipo,
      precio_unitario: insumo.precio_unitario,
    });
    setErrorModal(null);
  }

  function cerrarModal() {
    setInsumoEditando(null);
  }

  async function handleGuardarModal() {
    if (!insumoEditando) return;
    setGuardandoModal(true);
    setErrorModal(null);
    try {
      await actualizarInsumo(insumoEditando.id, form);
      cerrarModal();
    } catch (err) {
      setErrorModal(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardandoModal(false);
    }
  }

  /* ── Fila rápida ── */

  async function handleGuardarFila() {
    if (!fila.nombre.trim() || !fila.unidad_medida || guardandoFila) return;
    setGuardandoFila(true);
    setErrorFila(null);
    try {
      await crearInsumo(fila);
      setFila(FORM_INICIAL);
      setFilaClave((n) => n + 1);
      // Devuelve el foco al primer campo para seguir cargando
      setTimeout(() => nombreRef.current?.focus(), 0);
    } catch (err) {
      setErrorFila(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setGuardandoFila(false);
    }
  }

  /* ── Eliminar ── */

  async function handleEliminar(insumo: Insumo) {
    if (!window.confirm(`¿Eliminás "${insumo.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarInsumo(insumo.id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  /* ── Render ── */

  return (
    <div className="p-8">
      {/* Barra superior */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-pragma-texto">Lista de insumos</h1>
          <select
            value={filtroTipo ?? ''}
            onChange={(e) =>
              setFiltroTipo(
                e.target.value === '' ? undefined : (e.target.value as Insumo['tipo']),
              )
            }
            className="text-sm border border-pragma-superficie rounded-md px-3 py-1.5 bg-white text-pragma-texto focus:outline-none focus:ring-2 focus:ring-pragma-accent"
          >
            <option value="">Todos</option>
            <option value="material">Material</option>
            <option value="mano_de_obra">Mano de obra</option>
            <option value="equipo">Equipo</option>
          </select>
        </div>
        {/* El botón lleva el foco directamente a la fila de creación */}
        <button
          onClick={() => nombreRef.current?.focus()}
          className="bg-pragma-accent text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Nuevo insumo
        </button>
      </div>

      {cargando ? (
        <p className="text-center text-pragma-textoClaro mt-20">Cargando...</p>
      ) : error ? (
        <p className="text-center text-red-600 mt-20">{error}</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-pragma-superficie">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-pragma-superficie text-left">
                <th className="px-4 py-3 font-medium text-pragma-textoClaro w-[30%]">Nombre</th>
                <th className="px-4 py-3 font-medium text-pragma-textoClaro w-[22%]">Unidad</th>
                <th className="px-4 py-3 font-medium text-pragma-textoClaro w-[14%]">Tipo</th>
                <th className="px-4 py-3 font-medium text-pragma-textoClaro text-right w-[18%]">
                  Precio unitario
                </th>
                <th className="px-4 py-3 font-medium text-pragma-textoClaro text-right w-[16%]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Filas de datos existentes */}
              {insumos.map((insumo) => {
                const { etiqueta, clases } = TIPO_CONFIG[insumo.tipo];
                return (
                  <tr
                    key={insumo.id}
                    className="border-t border-pragma-superficie/60 hover:bg-pragma-fondo/70 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-pragma-texto">{insumo.nombre}</td>
                    <td className="px-4 py-3 text-pragma-textoClaro">{insumo.unidad_medida}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${clases}`}
                      >
                        {etiqueta}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-pragma-texto tabular-nums">
                      {formatPrecio(insumo.precio_unitario)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-4">
                      <button
                        onClick={() => abrirEditar(insumo)}
                        className="text-pragma-accent font-medium hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(insumo)}
                        className="text-red-500 font-medium hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* ── Fila de creación rápida ── */}
              <tr className="border-t-2 border-pragma-accent/20 bg-pragma-fondo/50">
                <td className="px-4 py-2">
                  <input
                    ref={nombreRef}
                    type="text"
                    value={fila.nombre}
                    onChange={(e) => setFila((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Nombre del insumo…"
                    className={INPUT_INLINE}
                  />
                </td>
                <td className="px-4 py-2">
                  <UnidadInput
                    key={filaClave}
                    value={fila.unidad_medida}
                    onChange={(v) => setFila((f) => ({ ...f, unidad_medida: v }))}
                    inputClass={INPUT_INLINE}
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={fila.tipo}
                    onChange={(e) =>
                      setFila((f) => ({ ...f, tipo: e.target.value as Insumo['tipo'] }))
                    }
                    className={INPUT_INLINE}
                  >
                    <option value="material">Material</option>
                    <option value="mano_de_obra">Mano de obra</option>
                    <option value="equipo">Equipo</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={fila.precio_unitario === 0 ? '' : fila.precio_unitario}
                    onChange={(e) =>
                      setFila((f) => ({
                        ...f,
                        precio_unitario: e.target.value === '' ? 0 : Number(e.target.value),
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGuardarFila();
                      }
                    }}
                    placeholder="0.00"
                    className={`${INPUT_INLINE} text-right`}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={handleGuardarFila}
                    disabled={guardandoFila || !fila.nombre.trim() || !fila.unidad_medida}
                    className="bg-pragma-accent text-white px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    {guardandoFila ? '…' : 'Guardar'}
                  </button>
                </td>
              </tr>

              {errorFila && (
                <tr className="bg-red-50">
                  <td colSpan={5} className="px-4 py-2 text-xs text-red-600">
                    {errorFila}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal de edición ── */}
      {insumoEditando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-pragma-texto mb-5">Editar insumo</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-pragma-texto mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  className={INPUT_MODAL}
                  placeholder="Ej: Cemento Portland"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pragma-texto mb-1">Unidad</label>
                {/* key={insumoEditando.id} remonta el componente al abrir un insumo distinto */}
                <UnidadInput
                  key={insumoEditando.id}
                  value={form.unidad_medida}
                  onChange={(v) => setForm((f) => ({ ...f, unidad_medida: v }))}
                  inputClass={INPUT_MODAL}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pragma-texto mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tipo: e.target.value as Insumo['tipo'] }))
                  }
                  className={INPUT_MODAL}
                >
                  <option value="material">Material</option>
                  <option value="mano_de_obra">Mano de obra</option>
                  <option value="equipo">Equipo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-pragma-texto mb-1">
                  Precio unitario
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio_unitario === 0 ? '' : form.precio_unitario}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      precio_unitario: e.target.value === '' ? 0 : Number(e.target.value),
                    }))
                  }
                  className={INPUT_MODAL}
                  placeholder="0.00"
                />
              </div>
            </div>

            {errorModal && <p className="mt-4 text-sm text-red-600">{errorModal}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cerrarModal}
                disabled={guardandoModal}
                className="px-4 py-2 text-sm font-medium text-pragma-textoClaro hover:text-pragma-texto transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarModal}
                disabled={guardandoModal}
                className="bg-pragma-accent text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {guardandoModal ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
