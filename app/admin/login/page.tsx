'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const next = searchParams.get('next') ?? '/admin/map-editor';
      router.push(next);
    } else {
      setError('Contraseña incorrecta');
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
    }}>
      <div style={{
        background: '#1a1a2e',
        border: '2px solid #4a4a7a',
        borderRadius: 12,
        padding: '40px 48px',
        width: 360,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🗺️</div>
          <h1 style={{ color: '#e0e0ff', fontSize: 20, margin: 0, fontWeight: 700 }}>
            WeddingBoy
          </h1>
          <p style={{ color: '#888', fontSize: 13, margin: '6px 0 0' }}>
            Map Editor — Acceso Admin
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', color: '#aaa', fontSize: 12, marginBottom: 6 }}>
            CONTRASEÑA
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#0f0f1a',
              border: `1px solid ${error ? '#ff4444' : '#4a4a7a'}`,
              borderRadius: 6,
              color: '#e0e0ff',
              fontSize: 16,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 8,
            }}
          />
          {error && (
            <p style={{ color: '#ff6b6b', fontSize: 13, margin: '0 0 12px' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: '10px',
              background: loading ? '#2a2a4a' : '#5050b0',
              border: 'none',
              borderRadius: 6,
              color: loading ? '#666' : '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              marginTop: 8,
              fontFamily: 'monospace',
            }}
          >
            {loading ? 'Verificando...' : 'Entrar →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
