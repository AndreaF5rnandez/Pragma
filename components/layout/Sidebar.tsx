'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/obras',   label: 'Obras',    icon: '◉' },
  { href: '/insumos', label: 'Insumos',  icon: '◈' },
  { href: '/recetas', label: 'Recetas',  icon: '◇' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="m-4 w-[250px] shrink-0 bg-pragma-sidebar rounded-xl flex flex-col overflow-hidden"
      style={{ height: 'calc(100vh - 32px)', boxShadow: '0 20px 27px 0 rgba(28,20,16,0.06)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-3">
        <span className="text-white text-xl font-bold tracking-wide">Pragma</span>
      </div>

      {/* Obra activa */}
      <div className="px-5 pb-4">
        <p className="text-xs text-white/40 leading-relaxed">Sin obra activa</p>
      </div>

      {/* Separador */}
      <div className="mx-4 mb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

      {/* Navegación */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon }) => {
          const activo = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activo
                  ? 'bg-pragma-accent text-white'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/10'
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4">
        <p className="text-xs text-white/30">Pragma v1.0</p>
      </div>
    </aside>
  );
}
