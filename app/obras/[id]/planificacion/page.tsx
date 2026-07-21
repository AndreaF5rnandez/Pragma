'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { usePlanificacion } from '@/hooks/usePlanificacion';

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

export default function PlanificacionPage() {
  const params = useParams();
  const obraId = params.id as string;
  const { datos, cargando, error } = usePlanificacion(obraId);

  // Obtener el nombre de la obra desde los datos si están disponibles
  const obraNombre = datos?.obra_id
    ? `Obra ${datos.obra_id.substring(0, 8)}`
    : 'Cargando obra...';

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: MESH_GRADIENT }}
    >
      {/* ── Header con tabs ── */}
      <header
        className="flex h-14 items-center justify-between px-6"
        style={{
          background: 'rgba(255, 255, 255, 0.55)',
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
            className="px-5 flex items-center text-sm font-medium border-b-2 border-transparent transition-colors"
            style={{ color: '#6B7080' }}
          >
            Presupuesto
          </Link>
          <Link
            href={`/obras/${obraId}/planificacion`}
            className="px-5 flex items-center text-sm font-semibold border-b-2"
            style={{ borderColor: '#1A1A2E', color: '#1A1A2E' }}
          >
            Planificación
          </Link>
        </nav>
      </header>

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {cargando && (
          <div className="flex items-center justify-center h-64">
            <p style={{ color: '#7A6A5A' }}>Cargando planificación...</p>
          </div>
        )}

        {error && (
          <div
            className="p-4 rounded-2xl mb-6"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.30)',
            }}
          >
            <p style={{ color: '#DC2626' }} className="text-sm font-medium">
              {error}
            </p>
          </div>
        )}

        {datos && !error && (
          <div className="space-y-6">
            {/* Placeholder con datos de verificación */}
            <div style={GLASS_CARD} className="p-6">
              <div className="space-y-4">
                <div>
                  <p style={{ color: '#6B7080' }} className="text-sm font-medium uppercase tracking-wide">
                    Planificación
                  </p>
                  <p style={{ color: '#1A1A2E' }} className="text-lg font-semibold mt-1">
                    Grilla en construcción
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/30">
                  <div>
                    <p style={{ color: '#6B7080' }} className="text-xs font-medium uppercase tracking-wide">
                      Total Costo-Costo
                    </p>
                    <p style={{ color: '#1A1A2E' }} className="text-xl font-bold mt-1">
                      ${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(datos.total_costo_costo)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#6B7080' }} className="text-xs font-medium uppercase tracking-wide">
                      Rubros
                    </p>
                    <p style={{ color: '#1A1A2E' }} className="text-xl font-bold mt-1">
                      {datos.rubros.length}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/30">
                  <div>
                    <p style={{ color: '#6B7080' }} className="text-xs font-medium uppercase tracking-wide">
                      Plazo
                    </p>
                    <p style={{ color: '#1A1A2E' }} className="text-sm font-medium mt-1">
                      {datos.plazo_meses ? `${datos.plazo_meses} meses` : 'No configurado'}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#6B7080' }} className="text-xs font-medium uppercase tracking-wide">
                      Fecha Inicio
                    </p>
                    <p style={{ color: '#1A1A2E' }} className="text-sm font-medium mt-1">
                      {datos.fecha_inicio || 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info de items cargados */}
            <div style={GLASS_CARD} className="p-6">
              <p style={{ color: '#6B7080' }} className="text-xs font-medium uppercase tracking-wide mb-3">
                Ítems cargados por rubro
              </p>
              <div className="space-y-2">
                {datos.rubros.map((rubro) => (
                  <div key={rubro.rubro_id} className="flex justify-between items-center py-2 px-3 rounded-lg" style={{ background: 'rgba(0, 0, 0, 0.02)' }}>
                    <span style={{ color: '#1A1A2E' }} className="text-sm font-medium">
                      {rubro.rubro_nombre}
                    </span>
                    <span style={{ color: '#6B7080' }} className="text-sm">
                      {rubro.items.length} ítems
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
