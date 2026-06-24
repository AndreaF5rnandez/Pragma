'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/* ── Íconos SVG con stroke ────────────────────────────────────────────────── */

function IconObras() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 19V9.2L10 3l8 6.2V19" />
      <rect x="7" y="13" width="6" height="6" />
    </svg>
  );
}

function IconInsumos() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 1.5L18.5 6.25V13.75L10 18.5L1.5 13.75V6.25L10 1.5Z" />
      <path d="M1.5 6.25L10 11L18.5 6.25" />
      <line x1="10" y1="11" x2="10" y2="18.5" />
    </svg>
  );
}

function IconRecetas() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="12" height="16" rx="2" />
      <line x1="7" y1="7" x2="13" y2="7" />
      <line x1="7" y1="10.5" x2="13" y2="10.5" />
      <line x1="7" y1="14" x2="10" y2="14" />
    </svg>
  );
}

/* ── Navegación ───────────────────────────────────────────────────────────── */

const NAV = [
  { href: '/obras',   label: 'Obras',    Icon: IconObras },
  { href: '/insumos', label: 'Insumos',  Icon: IconInsumos },
  { href: '/recetas', label: 'Precios Unitarios',  Icon: IconRecetas },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      className="my-4 ml-4 w-[220px] shrink-0 flex flex-col overflow-hidden rounded-[20px] border backdrop-blur-xl"
      style={{
        height: 'calc(100vh - 32px)',
        background: 'rgba(255, 255, 255, 0.45)',
        borderColor: 'rgba(255, 255, 255, 0.50)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Logo / Brand */}
      <div className="px-4 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          {/* Ícono de marca con fondo lima */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#C8E64C' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#2A3300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 14V7.8L8 2.5l6.5 5.3V14" />
              <rect x="5.5" y="9.5" width="5" height="4.5" />
            </svg>
          </div>
          <span className="text-base font-bold" style={{ color: '#1A1A2E' }}>Pragma</span>
        </div>
        <p className="text-xs mt-3" style={{ color: '#6B7080' }}>Sin obra activa</p>
      </div>

      {/* Separador */}
      <div className="mx-4 mb-2" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)' }} />

      {/* Navegación */}
      <nav className="flex-1 px-3 pt-1 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const activo = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                activo ? 'font-semibold' : 'font-medium hover:bg-black/[0.04]'
              }`}
              style={
                activo
                  ? { background: '#C8E64C', color: '#2A3300' }
                  : { color: '#1A1A2E' }
              }
            >
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 space-y-2">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-black/[0.04]"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6B7080'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesión
        </button>
        <p className="text-xs px-3.5" style={{ color: '#9CA3AF' }}>Pragma v1.0</p>
      </div>
    </aside>
  );
}
