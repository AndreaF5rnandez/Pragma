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

const TIPO_CONFIG: Record<Insumo['tipo'], { etiqueta: string; bg: string; color: string }> = {
  material:     { etiqueta: 'Material',     bg: '#DCFCE7', color: '#22C55E' },
  mano_de_obra: { etiqueta: 'Mano de obra', bg: '#DBEAFE', color: '#3B82F6' },
  equipo:       { etiqueta: 'Equipo',       bg: '#FEF3C7', color: '#F59E0B' },
};

const FILTROS: { valor: Insumo['tipo'] | undefined; etiqueta: string }[] = [
  { valor: undefined,      etiqueta: 'Todos' },
  { valor: 'material',     etiqueta: 'Materiales' },
  { valor: 'mano_de_obra', etiqueta: 'Mano de obra' },
  { valor: 'equipo',       etiqueta: 'Equipos' },
];

/* Prefijo de código sugerido según el tipo. La categoría real vive en `tipo`;
   el prefijo es solo una ayuda editable para que los códigos queden ordenados. */
const PREFIJO_TIPO: Record<Insumo['tipo'], string> = {
  material: 'M-',
  mano_de_obra: 'MO-',
  equipo: 'E-',
};
const PREFIJOS = new Set(Object.values(PREFIJO_TIPO));

/* Aplica el prefijo del nuevo tipo solo si el código está vacío o es un prefijo
   suelto (sin número todavía); si el usuario ya escribió un código, lo respeta. */
function sugerirCodigo(codigoActual: string | undefined, nuevoTipo: Insumo['tipo']): string {
  const actual = codigoActual ?? '';
  return actual === '' || PREFIJOS.has(actual) ? PREFIJO_TIPO[nuevoTipo] : actual;
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

type FormData = Omit<Insumo, 'id' | 'created_at' | 'updated_at'>;

const FORM_INICIAL: FormData = {
  codigo: '',
  nombre: '',
  unidad_medida: '',
  tipo: 'material',
  precio_unitario: 0,
};

const INPUT_INLINE =
  'w-full border border-transparent rounded-[8px] px-2 py-1.5 text-sm text-[#1A1A2E] bg-transparent focus:outline-none focus:border-black/[0.12] focus:bg-white/60 focus:shadow-[0_0_0_3px_rgba(200,230,76,0.2)] transition-all placeholder:text-[#9CA3AF]';

const INPUT_MODAL =
  'w-full border border-black/[0.12] rounded-[10px] px-3.5 py-2.5 text-sm text-[#1A1A2E] bg-white/60 backdrop-blur-[8px] focus:outline-none focus:border-[#C8E64C] focus:shadow-[0_0_0_3px_rgba(200,230,76,0.2)] transition-all placeholder:text-[#9CA3AF]';

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(precio);
}

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

/* ─── Página ───────────────────────────────────────────────────────────────── */

export default function InsumosPage() {
  const [filtroTipo, setFiltroTipo] = useState<Insumo['tipo'] | undefined>(undefined);
  const [busqueda, setBusqueda] = useState('');
  const { insumos, cargando, error, crearInsumo, actualizarInsumo, eliminarInsumo } =
    useInsumos(filtroTipo);

  /* Filtrado por código o nombre (case-insensitive), sobre lo ya filtrado por tipo */
  const termino = busqueda.trim().toLowerCase();
  const insumosFiltrados = termino
    ? insumos.filter(
        (i) =>
          (i.codigo ?? '').toLowerCase().includes(termino) ||
          i.nombre.toLowerCase().includes(termino),
      )
    : insumos;

  /* Modal — sólo para editar */
  const [insumoEditando, setInsumoEditando] = useState<Insumo | null>(null);
  const [form, setForm] = useState<FormData>(FORM_INICIAL);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [guardandoModal, setGuardandoModal] = useState(false);

  /* Fila de creación rápida */
  const [fila, setFila] = useState<FormData>(FORM_INICIAL);
  const [errorFila, setErrorFila] = useState<string | null>(null);
  const [guardandoFila, setGuardandoFila] = useState(false);
  const [filaClave, setFilaClave] = useState(0);
  const nombreRef = useRef<HTMLInputElement>(null);

  /* ── Modal ── */

  function abrirEditar(insumo: Insumo) {
    setInsumoEditando(insumo);
    setForm({
      codigo: insumo.codigo ?? '',
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
    <div className="p-6">
      {/* Barra superior */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>Lista de insumos</h1>
        <button
          onClick={() => nombreRef.current?.focus()}
          className="bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] px-5 py-2 rounded-full text-sm font-semibold transition-colors"
        >
          + Nuevo insumo
        </button>
      </div>

      {/* Pills de filtro + buscador */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {FILTROS.map(({ valor, etiqueta }) => (
            <button
              key={etiqueta}
              onClick={() => setFiltroTipo(valor)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtroTipo === valor
                  ? 'bg-[#C8E64C] text-[#2A3300]'
                  : 'text-[#6B7080] hover:bg-black/[0.06]'
              }`}
              style={filtroTipo !== valor ? { background: 'rgba(255,255,255,0.55)' } : undefined}
            >
              {etiqueta}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por código o nombre…"
          className="w-64 border border-black/[0.12] rounded-full px-4 py-1.5 text-sm text-[#1A1A2E] bg-white/60 backdrop-blur-[8px] focus:outline-none focus:border-[#C8E64C] focus:shadow-[0_0_0_3px_rgba(200,230,76,0.2)] transition-all placeholder:text-[#9CA3AF]"
        />
      </div>

      {cargando ? (
        <p className="text-center mt-20 text-sm" style={{ color: '#6B7080' }}>Cargando...</p>
      ) : error ? (
        <div
          className="mx-auto max-w-md mt-20 rounded-2xl px-4 py-3 text-sm text-center"
          style={{ background: '#FEE2E2', color: '#EF4444' }}
        >
          {error}
        </div>
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
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[12%]" style={{ color: '#9CA3AF' }}>Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[26%]" style={{ color: '#9CA3AF' }}>Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[18%]" style={{ color: '#9CA3AF' }}>Unidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider w-[13%]" style={{ color: '#9CA3AF' }}>Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider w-[16%]" style={{ color: '#9CA3AF' }}>
                  Precio unitario
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider w-[15%]" style={{ color: '#9CA3AF' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {insumosFiltrados.map((insumo) => {
                const { etiqueta, bg, color } = TIPO_CONFIG[insumo.tipo];
                return (
                  <tr
                    key={insumo.id}
                    className="hover:bg-black/[0.02] transition-colors"
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: insumo.codigo ? '#6B7080' : '#C7C7CC' }}>
                      {insumo.codigo || '—'}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#1A1A2E' }}>{insumo.nombre}</td>
                    <td className="px-4 py-3" style={{ color: '#6B7080' }}>{insumo.unidad_medida}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: bg, color }}
                      >
                        {etiqueta}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums" style={{ color: '#1A1A2E' }}>
                      {formatPrecio(insumo.precio_unitario)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-4">
                      <button
                        onClick={() => abrirEditar(insumo)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: '#C8E64C' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(insumo)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: '#EF4444' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* ── Fila de creación rápida ── */}
              <tr style={{ borderTop: '2px solid rgba(200,230,76,0.3)' }}>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={fila.codigo ?? ''}
                    onChange={(e) => setFila((f) => ({ ...f, codigo: e.target.value }))}
                    placeholder={PREFIJO_TIPO[fila.tipo]}
                    className={`${INPUT_INLINE} font-mono text-xs`}
                  />
                </td>
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
                    onChange={(e) => {
                      const nuevoTipo = e.target.value as Insumo['tipo'];
                      setFila((f) => ({
                        ...f,
                        tipo: nuevoTipo,
                        codigo: sugerirCodigo(f.codigo, nuevoTipo),
                      }));
                    }}
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
                    className={`${INPUT_INLINE} text-right font-mono`}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={handleGuardarFila}
                    disabled={guardandoFila || !fila.nombre.trim() || !fila.unidad_medida}
                    className="bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] px-4 py-1.5 rounded-full text-xs font-semibold disabled:opacity-40 transition-colors"
                  >
                    {guardandoFila ? '…' : 'Guardar'}
                  </button>
                </td>
              </tr>

              {errorFila && (
                <tr>
                  <td colSpan={6} className="px-4 py-2">
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
        </div>
      )}

      {/* ── Modal de edición ── */}
      {insumoEditando && (
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
            <h2 className="text-lg font-bold mb-5" style={{ color: '#1A1A2E' }}>Editar insumo</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>Código</label>
                <input
                  type="text"
                  value={form.codigo ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                  className={`${INPUT_MODAL} font-mono`}
                  placeholder={`Ej: ${PREFIJO_TIPO[form.tipo]}001 (opcional)`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  className={INPUT_MODAL}
                  placeholder="Ej: Cemento Portland"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>Unidad</label>
                <UnidadInput
                  key={insumoEditando.id}
                  value={form.unidad_medida}
                  onChange={(v) => setForm((f) => ({ ...f, unidad_medida: v }))}
                  inputClass={INPUT_MODAL}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => {
                    const nuevoTipo = e.target.value as Insumo['tipo'];
                    setForm((f) => ({
                      ...f,
                      tipo: nuevoTipo,
                      codigo: sugerirCodigo(f.codigo, nuevoTipo),
                    }));
                  }}
                  className={INPUT_MODAL}
                >
                  <option value="material">Material</option>
                  <option value="mano_de_obra">Mano de obra</option>
                  <option value="equipo">Equipo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#1A1A2E' }}>
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
                disabled={guardandoModal}
                className="px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ color: '#6B7080' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarModal}
                disabled={guardandoModal}
                className="bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] px-5 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
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
