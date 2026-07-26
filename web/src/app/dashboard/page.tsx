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

  // Tab State: 'projects' | 'clients'
  const [activeTab, setActiveTab] = useState<'projects' | 'clients'>('projects');

  // New Client Modal
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', contact_person: '', email: '', company: '' });

  // New Project Modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ client_id: '', name: '', description: '', client_brief: '', deadline: '', status: 'planning' });

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
      if (clientRes.data.length > 0 && !projectForm.client_id) {
        setProjectForm((prev) => ({ ...prev, client_id: clientRes.data[0].id }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/clients', {
        method: 'POST',
        body: JSON.stringify(clientForm),
      });
      setShowClientModal(false);
      setClientForm({ name: '', contact_person: '', email: '', company: '' });
      fetchDashboardData();
      alert('Klien berhasil ditambahkan!');
    } catch (err: any) {
      alert(err.message || 'Gagal membuat klien.');
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus klien ini?')) return;
    try {
      await apiRequest(`/clients/${id}`, { method: 'DELETE' });
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus klien.');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(projectForm),
      });
      setShowProjectModal(false);
      setProjectForm({ client_id: clients[0]?.id || '', name: '', description: '', client_brief: '', deadline: '', status: 'planning' });
      fetchDashboardData();
      alert('Proyek berhasil dibuat!');
    } catch (err: any) {
      alert(err.message || 'Gagal membuat proyek.');
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus proyek ini?')) return;
    try {
      await apiRequest(`/projects/${id}`, { method: 'DELETE' });
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus proyek.');
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

        {/* Navigation Tabs & Action Toolbar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[var(--color-paper-3)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'projects'
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Manajemen Proyek
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'clients'
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Manajemen Klien
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'projects' && (
              <>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="px-3 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition"
                >
                  + Proyek Baru
                </button>
                <button
                  onClick={() => {
                    if (projects.length > 0) {
                      setSelectedProjectId(projects[0].id);
                      setBriefInput(projects[0].client_brief || '');
                    }
                    setShowAiModal(true);
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  ✨ AI Brief Generator
                </button>
              </>
            )}

            {activeTab === 'clients' && (
              <button
                onClick={() => setShowClientModal(true)}
                className="px-3 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition"
              >
                + Klien Baru
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Projects Table */}
        {activeTab === 'projects' && (
          <div className="bg-white border border-[var(--color-paper-3)] rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--color-paper-2)] border-b border-[var(--color-paper-3)] text-[var(--color-ink-muted)] font-semibold uppercase">
                  <th className="p-3.5">Nama Proyek</th>
                  <th className="p-3.5">Klien</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Progres Task</th>
                  <th className="p-3.5">Deadline</th>
                  <th className="p-3.5 text-right">Aksi</th>
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
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Clients Table */}
        {activeTab === 'clients' && (
          <div className="bg-white border border-[var(--color-paper-3)] rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--color-paper-2)] border-b border-[var(--color-paper-3)] text-[var(--color-ink-muted)] font-semibold uppercase">
                  <th className="p-3.5">Nama Klien</th>
                  <th className="p-3.5">Perusahaan</th>
                  <th className="p-3.5">Contact Person</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Total Proyek</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-paper-2)]">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--color-paper)] transition">
                    <td className="p-3.5 font-medium text-[var(--color-ink)]">{c.name}</td>
                    <td className="p-3.5 text-[var(--color-ink-muted)]">{c.company}</td>
                    <td className="p-3.5">{c.contact_person}</td>
                    <td className="p-3.5 text-[var(--color-ink-muted)]">{c.email}</td>
                    <td className="p-3.5 font-semibold">{c.projects_count || 0} Proyek</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteClient(c.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* New Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[var(--color-paper-3)]">
            <div className="flex items-center justify-between border-b border-[var(--color-paper-3)] pb-3">
              <h3 className="text-base font-bold text-[var(--color-ink)]">+ Tambah Klien Baru</h3>
              <button onClick={() => setShowClientModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Nama Klien</label>
                <input
                  type="text"
                  required
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Perusahaan</label>
                <input
                  type="text"
                  required
                  value={clientForm.company}
                  onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Contact Person</label>
                <input
                  type="text"
                  required
                  value={clientForm.contact_person}
                  onChange={(e) => setClientForm({ ...clientForm, contact_person: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-lg"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-black text-white text-xs font-semibold rounded-lg mt-2">
                Simpan Klien
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[var(--color-paper-3)]">
            <div className="flex items-center justify-between border-b border-[var(--color-paper-3)] pb-3">
              <h3 className="text-base font-bold text-[var(--color-ink)]">+ Buat Proyek Baru</h3>
              <button onClick={() => setShowProjectModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Klien Terkait</label>
                <select
                  value={projectForm.client_id}
                  onChange={(e) => setProjectForm({ ...projectForm, client_id: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-lg"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Nama Proyek</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Brief Klien (Untuk AI Task)</label>
                <textarea
                  rows={3}
                  value={projectForm.client_brief}
                  onChange={(e) => setProjectForm({ ...projectForm, client_brief: e.target.value })}
                  placeholder="Deskripsikan keinginan klien..."
                  className="w-full text-xs p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Deadline Proyek</label>
                <input
                  type="date"
                  required
                  value={projectForm.deadline}
                  onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-lg"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-black text-white text-xs font-semibold rounded-lg mt-2">
                Simpan Proyek
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Task Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-[var(--color-paper-3)]">
            <div className="flex items-center justify-between border-b border-[var(--color-paper-3)] pb-3">
              <h3 className="text-base font-bold text-[var(--color-ink)]">✨ AI Task Breakdown Brief</h3>
              <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600 text-sm">
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
