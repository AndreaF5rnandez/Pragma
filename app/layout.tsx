import type { ReactNode } from 'react';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="flex h-screen overflow-hidden bg-pragma-fondo">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
