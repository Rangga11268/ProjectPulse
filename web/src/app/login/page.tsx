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
      <div className="w-full max-w-md bg-white border border-[var(--color-paper-3)] rounded-xl p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[var(--color-accent)] rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
            Bilcode Technology
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">ProjectPulse Admin</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">Platform Manajemen Klien & Proyek Internal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">
              Email Admin
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--color-paper-3)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--color-paper-3)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium text-sm rounded-lg transition duration-150 disabled:opacity-50"
          >
            {loading ? 'Memproses Login...' : 'Masuk ke Dashboard'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--color-paper-2)] text-center text-xs text-[var(--color-ink-muted)]">
          Protip: Gunakan akun seeder <code className="bg-[var(--color-paper-2)] px-1 py-0.5 rounded">admin@bilcode.com</code>
        </div>
      </div>
    </div>
  );
}
