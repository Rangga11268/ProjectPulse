'use me';
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@bilcode.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-paper)]">
      <div className="w-full max-w-md bg-white border border-[var(--color-paper-3)] rounded-2xl overflow-hidden shadow-sm">
        {/* Brand Slate Navy Header Banner for Logo Contrast */}
        <div className="bg-slate-900 p-8 text-center border-b border-slate-800">
          <img src="/billcodeLogo.webp" alt="Bilcode Logo" className="h-12 w-auto mx-auto object-contain mb-3" />
          <h1 className="text-xl font-extrabold text-white tracking-tight uppercase">ProjectPulse</h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">Platform Manajemen Klien & Proyek Internal</p>
        </div>

        <div className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1.5">
                Email Admin
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-[var(--color-paper-3)] rounded-lg focus:outline-none focus:border-blue-600 font-medium transition"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-[var(--color-paper-3)] rounded-lg focus:outline-none focus:border-blue-600 font-medium transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition duration-150 disabled:opacity-50 mt-2 shadow-xs"
            >
              {loading ? 'Memproses Login...' : 'Masuk ke Admin Console'}
            </button>
          </form>

          <div className="pt-3 border-t border-[var(--color-paper-2)] text-center text-xs text-[var(--color-ink-muted)]">
            Protip: Login Admin via <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono">admin@bilcode.com</code>
          </div>
        </div>
      </div>
    </div>
  );
}
