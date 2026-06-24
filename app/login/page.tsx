'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const INPUT_CLASS =
  'w-full border border-black/[0.12] rounded-[10px] px-3.5 py-2.5 text-sm text-[#1A1A2E] bg-white/60 backdrop-blur-[8px] focus:outline-none focus:border-[#C8E64C] focus:shadow-[0_0_0_3px_rgba(200,230,76,0.2)] transition-all placeholder:text-[#9CA3AF]';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password || cargando) return;
    setCargando(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError('Email o contraseña incorrectos.');
      setCargando(false);
      return;
    }

    router.push('/obras');
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(ellipse at 15% 80%, rgba(200, 230, 76, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 85% 20%, rgba(200, 180, 220, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 85%, rgba(180, 220, 210, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(215, 210, 220, 0.3) 0%, transparent 70%),
          linear-gradient(135deg, #D8D6DE 0%, #CDCBD5 50%, #D2D0D8 100%)
        `,
      }}
    >
      <div
        className="w-full max-w-sm p-8 backdrop-blur-[24px]"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.60)',
          borderRadius: '20px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: '#C8E64C' }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 16 16"
              fill="none"
              stroke="#2A3300"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1.5 14V7.8L8 2.5l6.5 5.3V14" />
              <rect x="5.5" y="9.5" width="5" height="4.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A2E' }}>
            Pragma
          </h1>
          <p className="text-sm mt-1 text-center" style={{ color: '#6B7080' }}>
            Sistema de presupuestación de obras
          </p>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#1A1A2E' }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="tu@email.com"
              className={INPUT_CLASS}
              autoFocus
              autoComplete="email"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#1A1A2E' }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••"
              className={INPUT_CLASS}
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && (
          <div
            className="mt-4 rounded-[10px] px-3.5 py-2.5 text-sm"
            style={{ background: '#FEE2E2', color: '#EF4444' }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={cargando || !email.trim() || !password}
          className="w-full mt-6 bg-[#C8E64C] text-[#2A3300] hover:bg-[#B8D63C] py-2.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </div>
    </div>
  );
}
