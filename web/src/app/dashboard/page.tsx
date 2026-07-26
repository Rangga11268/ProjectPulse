'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // AI Task Breakdown Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [briefInput, setBriefInput] = useState('');
  const [aiTasks, setAiTasks] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [sumRes, projRes, clientRes] = await Promise.all([
        apiRequest('/dashboard/summary'),
        apiRequest('/projects'),
        apiRequest('/clients'),
      ]);
      setSummary(sumRes.data);
      setProjects(projRes.data);
      setClients(clientRes.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiTasks = async () => {
    if (!selectedProjectId || !briefInput) return;
    setAiLoading(true);
    try {
      const res = await apiRequest(`/projects/${selectedProjectId}/tasks/generate`, {
        method: 'POST',
        body: JSON.stringify({ client_brief: briefInput }),
      });
      setAiTasks(res.data.suggested_tasks || []);
    } catch (err: any) {
      alert(err.message || 'Gagal menghasilkan task AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAiTask = async (task: any) => {
    if (!selectedProjectId) return;
    try {
      await apiRequest(`/projects/${selectedProjectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          category: task.category,
          estimated_hours: task.estimated_hours,
          status: 'todo',
        }),
      });
      setAiTasks(aiTasks.filter((t) => t.title !== task.title));
      alert(`Task "${task.title}" berhasil disimpan ke proyek!`);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan task.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-medium text-[var(--color-ink-muted)]">
        Memuat Dashboard ProjectPulse...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[var(--color-paper-3)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-[var(--color-ink)] tracking-tight">ProjectPulse</span>
          <span className="text-xs px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
            Admin Console
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-[var(--color-ink-muted)]">
          <span>{user?.name} ({user?.email})</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[var(--color-paper-3)] shadow-xs">
            <span className="text-xs font-semibold uppercase text-[var(--color-ink-muted)]">Proyek Aktif</span>
            <div className="text-2xl font-bold text-[var(--color-ink)] mt-1">{summary?.active_projects || 0}</div>
            <span className="text-[11px] text-[var(--color-ink-muted)]">dari {summary?.total_projects} total proyek</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[var(--color-paper-3)] shadow-xs">
            <span className="text-xs font-semibold uppercase text-[var(--color-ink-muted)]">Task Overdue</span>
            <div className="text-2xl font-bold text-red-600 mt-1">{summary?.overdue_tasks || 0}</div>
            <span className="text-[11px] text-red-500">perlu tindakan segera</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[var(--color-paper-3)] shadow-xs">
            <span className="text-xs font-semibold uppercase text-[var(--color-ink-muted)]">Task Selesai</span>
            <div className="text-2xl font-bold text-green-600 mt-1">{summary?.completed_tasks || 0}</div>
            <span className="text-[11px] text-[var(--color-ink-muted)]">dari {summary?.total_tasks} total task</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[var(--color-paper-3)] shadow-xs">
            <span className="text-xs font-semibold uppercase text-[var(--color-ink-muted)]">Klien Terdaftar</span>
            <div className="text-2xl font-bold text-[var(--color-ink)] mt-1">{clients.length}</div>
            <span className="text-[11px] text-[var(--color-ink-muted)]">klien aktif</span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[var(--color-paper-3)]">
          <div>
            <h2 className="text-base font-bold text-[var(--color-ink)]">Daftar Proyek Internal</h2>
            <p className="text-xs text-[var(--color-ink-muted)]">Kelola proyek, task tim, dan integrasi AI Brief.</p>
          </div>
          <button
            onClick={() => {
              if (projects.length > 0) {
                setSelectedProjectId(projects[0].id);
                setBriefInput(projects[0].client_brief || '');
              }
              setShowAiModal(true);
            }}
            className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            ✨ Generate Task via AI Brief
          </button>
        </div>

        {/* Projects Table */}
        <div className="bg-white border border-[var(--color-paper-3)] rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--color-paper-2)] border-b border-[var(--color-paper-3)] text-[var(--color-ink-muted)] font-semibold uppercase">
                <th className="p-3.5">Nama Proyek</th>
                <th className="p-3.5">Klien</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Progres Task</th>
                <th className="p-3.5">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-paper-2)]">
              {projects.map((proj) => (
                <tr key={proj.id} className="hover:bg-[var(--color-paper)] transition">
                  <td className="p-3.5 font-medium text-[var(--color-ink)]">
                    {proj.name}
                    {proj.client_brief && (
                      <span className="block text-[11px] text-[var(--color-ink-muted)] truncate max-w-xs mt-0.5">
                        Brief: {proj.client_brief}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-[var(--color-ink-muted)]">{proj.client?.name || '-'}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                        proj.status === 'active'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {proj.completed_tasks_count} / {proj.tasks_count} Task Done
                  </td>
                  <td className="p-3.5 text-[var(--color-ink-muted)]">{proj.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* AI Task Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-[var(--color-paper-3)]">
            <div className="flex items-center justify-between border-b border-[var(--color-paper-3)] pb-3">
              <h3 className="text-base font-bold text-[var(--color-ink)]">✨ AI Task Breakdown Brief</h3>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-muted)] uppercase mb-1">
                Pilih Proyek
              </label>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedProjectId(id);
                  const p = projects.find((x) => x.id === id);
                  if (p) setBriefInput(p.client_brief || '');
                }}
                className="w-full text-xs p-2 border border-[var(--color-paper-3)] rounded-lg mb-3"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <label className="block text-xs font-semibold text-[var(--color-ink-muted)] uppercase mb-1">
                Brief Klien (Teks Bebas)
              </label>
              <textarea
                rows={4}
                value={briefInput}
                onChange={(e) => setBriefInput(e.target.value)}
                placeholder="Tempelkan brief persyaratan dari klien di sini..."
                className="w-full text-xs p-2.5 border border-[var(--color-paper-3)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <button
              onClick={handleGenerateAiTasks}
              disabled={aiLoading || !briefInput}
              className="w-full py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              {aiLoading ? '🤖 Memproses Brief via LLM API...' : 'Hasilkan Rekomendasi Task'}
            </button>

            {/* AI Suggested Tasks Results */}
            {aiTasks.length > 0 && (
              <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                <span className="text-xs font-bold text-[var(--color-ink)] block">Hasil Saran AI:</span>
                {aiTasks.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-[var(--color-paper-3)] rounded-lg flex items-center justify-between text-xs bg-[var(--color-paper)]"
                  >
                    <div>
                      <span className="font-semibold text-[var(--color-ink)] block">{t.title}</span>
                      <span className="text-[11px] text-[var(--color-ink-muted)]">{t.description}</span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] rounded font-bold uppercase">
                          {t.category}
                        </span>
                        <span className="text-[10px] text-gray-500">{t.estimated_hours} jam kerja</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSaveAiTask(t)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-[11px] font-semibold"
                    >
                      Terima & Simpan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
