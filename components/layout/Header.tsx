'use client';

import { useEffect, useState } from 'react';

export default function Header() {
  const [saludo, setSaludo] = useState('');
  const [fechaTexto, setFechaTexto] = useState('');

  useEffect(() => {
    const now = new Date();
    const h = now.getHours();
    setSaludo(h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches');
    setFechaTexto(
      now.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    );
  }, []);

  return (
    <header
      className="mx-4 mt-4 mb-3 px-5 flex items-center justify-between rounded-2xl shrink-0"
      style={{
        height: '56px',
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.60)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight" style={{ color: '#1A1A2E' }}>
          {saludo || 'Bienvenida'}
        </p>
        <p className="text-xs capitalize leading-tight mt-0.5" style={{ color: '#6B7080' }}>
          {fechaTexto || '—'}
        </p>
      </div>
      <div
        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ml-4"
        style={{ background: '#C8E64C', color: '#2A3300' }}
      >
        P
      </div>
    </header>
  );
}
