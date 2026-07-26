'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Tab State: 'projects' | 'tasks' | 'clients'
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks' | 'clients'>('projects');

  // Client Modal State (Create / Edit)
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [clientForm, setClientForm] = useState({ name: '', contact_person: '', email: '', company: '' });

  // Project Modal State (Create / Edit)
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [projectForm, setProjectForm] = useState({ client_id: '', name: '', description: '', client_brief: '', deadline: '', status: 'planning' });

  // Task Modal State (Create / Edit)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({ project_id: '', assignee_id: '', title: '', description: '', category: 'backend', status: 'todo', estimated_hours: 8, deadline: '' });

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
      const [sumRes, projRes, clientRes, taskRes] = await Promise.all([
        apiRequest('/dashboard/summary'),
        apiRequest('/projects'),
        apiRequest('/clients'),
        apiRequest('/tasks'),
      ]);
      setSummary(sumRes.data);
      setProjects(projRes.data);
      setClients(clientRes.data);
      setTasks(taskRes.data);
      setMembers(sumRes.data?.workload_per_member || []);
      
      if (clientRes.data.length > 0 && !projectForm.client_id) {
        setProjectForm((prev) => ({ ...prev, client_id: clientRes.data[0].id }));
      }
      if (projRes.data.length > 0 && !taskForm.project_id) {
        setTaskForm((prev) => ({ ...prev, project_id: projRes.data[0].id }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // CLIENT HANDLERS
  const handleOpenCreateClient = () => {
    setEditingClient(null);
    setClientForm({ name: '', contact_person: '', email: '', company: '' });
    setShowClientModal(true);
  };

  const handleOpenEditClient = (c: any) => {
    setEditingClient(c);
    setClientForm({ name: c.name, contact_person: c.contact_person, email: c.email, company: c.company });
    setShowClientModal(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await apiRequest(`/clients/${editingClient.id}`, {
          method: 'PUT',
          body: JSON.stringify(clientForm),
        });
      } else {
        await apiRequest('/clients', {
          method: 'POST',
          body: JSON.stringify(clientForm),
        });
      }
      setShowClientModal(false);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan klien.');
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

  // PROJECT HANDLERS
  const handleOpenCreateProject = () => {
    setEditingProject(null);
    setProjectForm({ client_id: clients[0]?.id || '', name: '', description: '', client_brief: '', deadline: '', status: 'planning' });
    setShowProjectModal(true);
  };

  const handleOpenEditProject = (p: any) => {
    setEditingProject(p);
    setProjectForm({ client_id: p.client_id, name: p.name, description: p.description || '', client_brief: p.client_brief || '', deadline: p.deadline, status: p.status });
    setShowProjectModal(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await apiRequest(`/projects/${editingProject.id}`, {
          method: 'PUT',
          body: JSON.stringify(projectForm),
        });
      } else {
        await apiRequest('/projects', {
          method: 'POST',
          body: JSON.stringify(projectForm),
        });
      }
      setShowProjectModal(false);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan proyek.');
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

  // TASK HANDLERS
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskForm({ project_id: projects[0]?.id || '', assignee_id: members[0]?.id || '', title: '', description: '', category: 'backend', status: 'todo', estimated_hours: 8, deadline: '' });
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (t: any) => {
    setEditingTask(t);
    setTaskForm({ project_id: t.project_id, assignee_id: t.assignee_id || '', title: t.title, description: t.description || '', category: t.category, status: t.status, estimated_hours: t.estimated_hours, deadline: t.deadline || '' });
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await apiRequest(`/tasks/${editingTask.id}`, {
          method: 'PATCH',
          body: JSON.stringify(taskForm),
        });
      } else {
        await apiRequest(`/projects/${taskForm.project_id}/tasks`, {
          method: 'POST',
          body: JSON.stringify(taskForm),
        });
      }
      setShowTaskModal(false);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan task.');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus task ini?')) return;
    try {
      await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus task.');
    }
  };

  // AI TASK HANDLERS
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

  const handleUpdateAiTaskField = (idx: number, field: string, val: any) => {
    const updated = [...aiTasks];
    updated[idx] = { ...updated[idx], [field]: val };
    setAiTasks(updated);
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

  const handleExportCsv = () => {
    const token = localStorage.getItem('token');
    window.open(`http://localhost:8000/api/tasks/export/csv?token=${token}`, '_blank');
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        Memuat Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-[var(--color-paper-3)] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-base tracking-tight text-[var(--color-ink)] uppercase">
            ProjectPulse
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-bold uppercase tracking-wider border border-gray-200">
            {user?.role === 'admin' ? 'Admin Console' : 'Member Workspace'}
          </span>
        </div>
        <div className="flex items-center gap-5 text-xs font-medium text-[var(--color-ink-muted)]">
          <span>{user?.name} ({user?.email})</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[var(--color-ink)] rounded font-semibold text-[11px] transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Hallmark Stat-Led Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <span className="stat-card-title">Proyek Aktif</span>
            <div className="stat-card-value">{summary?.active_projects || 0}</div>
            <span className="text-[11px] text-[var(--color-ink-muted)] block mt-1">
              dari {summary?.total_projects} total proyek
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-card-title text-red-600">Task Overdue</span>
            <div className="stat-card-value text-red-600">{summary?.overdue_tasks || 0}</div>
            <span className="text-[11px] text-red-500 block mt-1 font-medium">perlu penanganan segera</span>
          </div>

          <div className="stat-card">
            <span className="stat-card-title text-green-700">Task Selesai</span>
            <div className="stat-card-value text-green-700">{summary?.completed_tasks || 0}</div>
            <span className="text-[11px] text-[var(--color-ink-muted)] block mt-1">
              dari {summary?.total_tasks} total task
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-card-title">Klien Terdaftar</span>
            <div className="stat-card-value">{clients.length}</div>
            <span className="text-[11px] text-[var(--color-ink-muted)] block mt-1">klien aktif</span>
          </div>
        </div>

        {/* Navigation Tabs & Primary Action Toolbar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-[var(--color-paper-3)]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded transition uppercase tracking-wider ${
                activeTab === 'projects'
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Proyek ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded transition uppercase tracking-wider ${
                activeTab === 'tasks'
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Task ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded transition uppercase tracking-wider ${
                activeTab === 'clients'
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Klien ({clients.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'projects' && (
              <>
                <button
                  onClick={handleOpenCreateProject}
                  className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded uppercase tracking-wider hover:bg-gray-800 transition"
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
                  className="px-3 py-1.5 bg-blue-700 text-white text-xs font-bold rounded uppercase tracking-wider hover:bg-blue-800 transition"
                >
                  AI Brief Breakdown
                </button>
              </>
            )}

            {activeTab === 'tasks' && (
              <>
                <button
                  onClick={handleOpenCreateTask}
                  className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded uppercase tracking-wider hover:bg-gray-800 transition"
                >
                  + Task Baru
                </button>
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 bg-green-700 text-white text-xs font-bold rounded uppercase tracking-wider hover:bg-green-800 transition"
                >
                  Ekspor CSV
                </button>
              </>
            )}

            {activeTab === 'clients' && (
              <button
                onClick={handleOpenCreateClient}
                className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded uppercase tracking-wider hover:bg-gray-800 transition"
              >
                + Klien Baru
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Projects Data Table */}
        {activeTab === 'projects' && (
          <div className="bg-white border border-[var(--color-paper-3)] rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--color-paper-2)] border-b border-[var(--color-paper-3)] text-[var(--color-ink-muted)] font-bold uppercase tracking-wider">
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
                    <td className="p-3.5 font-semibold text-[var(--color-ink)]">
                      {proj.name}
                      {proj.client_brief && (
                        <span className="block text-[11px] font-normal text-[var(--color-ink-muted)] truncate max-w-xs mt-0.5">
                          Brief: {proj.client_brief}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-[var(--color-ink-muted)]">{proj.client?.name || '-'}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          proj.status === 'active'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {proj.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium">
                      {proj.completed_tasks_count} / {proj.tasks_count} Task Done
                    </td>
                    <td className="p-3.5 text-[var(--color-ink-muted)]">{proj.deadline}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditProject(proj)}
                        className="text-blue-700 hover:underline font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="text-red-600 hover:underline font-semibold"
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

        {/* Tab 2: Tasks Data Table */}
        {activeTab === 'tasks' && (
          <div className="bg-white border border-[var(--color-paper-3)] rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--color-paper-2)] border-b border-[var(--color-paper-3)] text-[var(--color-ink-muted)] font-bold uppercase tracking-wider">
                  <th className="p-3.5">Judul Task</th>
                  <th className="p-3.5">Proyek</th>
                  <th className="p-3.5">Assignee</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Jam Kerja</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-paper-2)]">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--color-paper)] transition">
                    <td className="p-3.5 font-semibold text-[var(--color-ink)]">
                      {t.title}
                      {t.description && (
                        <span className="block text-[11px] font-normal text-[var(--color-ink-muted)] truncate max-w-xs mt-0.5">
                          {t.description}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-[var(--color-ink-muted)]">{t.project?.name || '-'}</td>
                    <td className="p-3.5 font-medium">{t.assignee?.name || 'Unassigned'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-[10px] font-bold uppercase rounded">
                        {t.category}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          t.status === 'done'
                            ? 'bg-green-100 text-green-800'
                            : t.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold">{t.estimated_hours} Jam</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditTask(t)}
                        className="text-blue-700 hover:underline font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="text-red-600 hover:underline font-semibold"
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

        {/* Tab 3: Clients Data Table */}
        {activeTab === 'clients' && (
          <div className="bg-white border border-[var(--color-paper-3)] rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--color-paper-2)] border-b border-[var(--color-paper-3)] text-[var(--color-ink-muted)] font-bold uppercase tracking-wider">
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
                    <td className="p-3.5 font-semibold text-[var(--color-ink)]">{c.name}</td>
                    <td className="p-3.5 text-[var(--color-ink-muted)]">{c.company}</td>
                    <td className="p-3.5">{c.contact_person}</td>
                    <td className="p-3.5 text-[var(--color-ink-muted)]">{c.email}</td>
                    <td className="p-3.5 font-semibold">{c.projects_count || 0} Proyek</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditClient(c)}
                        className="text-blue-700 hover:underline font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClient(c.id)}
                        className="text-red-600 hover:underline font-semibold"
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

      {/* Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 border border-[var(--color-paper-3)]">
            <div className="flex items-center justify-between border-b border-[var(--color-paper-3)] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
                {editingClient ? 'Edit Data Klien' : 'Tambah Klien Baru'}
              </h3>
              <button onClick={() => setShowClientModal(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleSaveClient} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Nama Klien</label>
                <input
                  type="text"
                  required
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full text-xs p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Perusahaan</label>
                <input
                  type="text"
                  required
                  value={clientForm.company}
                  onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                  className="w-full text-xs p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Contact Person</label>
                <input
                  type="text"
                  required
                  value={clientForm.contact_person}
                  onChange={(e) => setClientForm({ ...clientForm, contact_person: e.target.value })}
                  className="w-full text-xs p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full text-xs p-2 border rounded"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded mt-2">
                {editingClient ? 'Update Klien' : 'Simpan Klien'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 border border-[var(--color-paper-3)]">
            <div className="flex items-center justify-between border-b border-[var(--color-paper-3)] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
                {editingProject ? 'Edit Data Proyek' : 'Buat Proyek Baru'}
              </h3>
              <button onClick={() => setShowProjectModal(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleSaveProject} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Klien Terkait</label>
                <select
                  value={projectForm.client_id}
                  onChange={(e) => setProjectForm({ ...projectForm, client_id: e.target.value })}
                  className="w-full text-xs p-2 border rounded"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Nama Proyek</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full text-xs p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Brief Klien</label>
                <textarea
                  rows={3}
                  value={projectForm.client_brief}
                  onChange={(e) => setProjectForm({ ...projectForm, client_brief: e.target.value })}
                  placeholder="Deskripsikan persyaratan klien..."
                  className="w-full text-xs p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Deadline</label>
                <input
                  type="date"
                  required
                  value={projectForm.deadline}
                  onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
                  className="w-full text-xs p-2 border rounded"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded mt-2">
                {editingProject ? 'Update Proyek' : 'Simpan Proyek'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 border border-[var(--color-paper-3)]">
            <div className="flex items-center justify-between border-b border-[var(--color-paper-3)] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
                {editingTask ? 'Edit Task' : 'Tambah Task Baru'}
              </h3>
              <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleSaveTask} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Proyek Target</label>
                <select
                  value={taskForm.project_id}
                  onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value })}
                  className="w-full text-xs p-2 border rounded"
                  disabled={!!editingTask}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Assignee Member</label>
                <select
                  value={taskForm.assignee_id}
                  onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
                  className="w-full text-xs p-2 border rounded"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Judul Task</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full text-xs p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Kategori & Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    className="w-full text-xs p-2 border rounded font-semibold"
                  >
                    <option value="backend">Backend</option>
                    <option value="frontend">Frontend</option>
                    <option value="design">Design</option>
                    <option value="QA">QA</option>
                  </select>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full text-xs p-2 border rounded font-semibold"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Estimasi Jam Kerja</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={taskForm.estimated_hours}
                  onChange={(e) => setTaskForm({ ...taskForm, estimated_hours: Number(e.target.value) })}
                  className="w-full text-xs p-2 border rounded"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded mt-2">
                {editingTask ? 'Update Task' : 'Simpan Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Task Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 border border-[var(--color-paper-3)]">
            <div className="flex items-center justify-between border-b border-[var(--color-paper-3)] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
                AI Task Breakdown Brief
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600 text-sm">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">
                Pilih Proyek Target
              </label>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedProjectId(id);
                  const p = projects.find((x) => x.id === id);
                  if (p) setBriefInput(p.client_brief || '');
                }}
                className="w-full text-xs p-2 border border-[var(--color-paper-3)] rounded mb-3"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">
                Brief Persyaratan Klien
              </label>
              <textarea
                rows={4}
                value={briefInput}
                onChange={(e) => setBriefInput(e.target.value)}
                placeholder="Tempelkan brief persyaratan dari klien di sini..."
                className="w-full text-xs p-2.5 border border-[var(--color-paper-3)] rounded focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <button
              onClick={handleGenerateAiTasks}
              disabled={aiLoading || !briefInput}
              className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider rounded transition disabled:opacity-50"
            >
              {aiLoading ? 'Memproses Brief via LLM API...' : 'Jalankan Breakdown Brief'}
            </button>

            {/* AI Suggested Tasks Results with Inline Editing */}
            {aiTasks.length > 0 && (
              <div className="space-y-3 mt-4 max-h-60 overflow-y-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] block">
                  Edit & Sesuaikan Hasil Rekomendasi:
                </span>
                {aiTasks.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-[var(--color-paper-3)] rounded text-xs bg-[var(--color-paper)] space-y-2"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={t.title}
                        onChange={(e) => handleUpdateAiTaskField(idx, 'title', e.target.value)}
                        className="col-span-2 p-1.5 border rounded font-semibold text-[var(--color-ink)]"
                      />
                      <select
                        value={t.category}
                        onChange={(e) => handleUpdateAiTaskField(idx, 'category', e.target.value)}
                        className="p-1.5 border rounded font-bold uppercase text-[10px]"
                      >
                        <option value="backend">backend</option>
                        <option value="frontend">frontend</option>
                        <option value="design">design</option>
                        <option value="QA">QA</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="number"
                        value={t.estimated_hours}
                        onChange={(e) => handleUpdateAiTaskField(idx, 'estimated_hours', Number(e.target.value))}
                        className="w-20 p-1.5 border rounded"
                      />
                      <button
                        onClick={() => handleSaveAiTask(t)}
                        className="px-3 py-1 bg-green-700 hover:bg-green-800 text-white rounded text-[11px] font-bold uppercase tracking-wider"
                      >
                        Simpan Task
                      </button>
                    </div>
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
