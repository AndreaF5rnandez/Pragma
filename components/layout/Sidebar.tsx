'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/obras', label: 'Obras' },
  { href: '/insumos', label: 'Lista de insumos' },
  { href: '/recetas', label: 'Recetas' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 bg-pragma-sidebar flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 pt-8 pb-4">
        <span className="text-white text-2xl font-bold tracking-tight">Pragma</span>
      </div>

      {/* Obra activa */}
      <div className="px-6 pb-6">
        <p className="text-xs text-white/40">Sin obra activa</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, label }) => {
          const activo = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activo
                  ? 'bg-pragma-accent text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
