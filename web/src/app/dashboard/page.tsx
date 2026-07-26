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

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Search Filter State
  const [searchQuery, setSearchQuery] = useState('');

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.client?.name && p.client.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.project?.name && t.project.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.assignee?.name && t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      const [sumRes, projRes, clientRes, taskRes] = await Promise.allSettled([
        apiRequest('/dashboard/summary'),
        apiRequest('/projects'),
        apiRequest('/clients'),
        apiRequest('/tasks'),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
      if (projRes.status === 'fulfilled') setProjects(projRes.value.data);
      if (clientRes.status === 'fulfilled') setClients(clientRes.value.data);
      if (taskRes.status === 'fulfilled') setTasks(taskRes.value.data);

      if (sumRes.status === 'fulfilled' && sumRes.value.data?.workload_per_member) {
        setMembers(sumRes.value.data.workload_per_member);
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
        showNotification('✓ Task berhasil diperbarui!');
      } else {
        await apiRequest(`/projects/${taskForm.project_id}/tasks`, {
          method: 'POST',
          body: JSON.stringify(taskForm),
        });
        showNotification('✓ Task baru berhasil dibuat!');
      }
      setShowTaskModal(false);
      await fetchDashboardData();
    } catch (err: any) {
      showNotification('❌ ' + (err.message || 'Gagal menyimpan task.'));
    }
  };

  const handleInlineStatusChange = async (taskId: number, newStatus: string) => {
    // Optimistic UI update
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await apiRequest(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showNotification('✓ Status task berhasil diubah!');
      await fetchDashboardData();
    } catch (err: any) {
      showNotification('❌ Gagal mengubah status task.');
      await fetchDashboardData();
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus task ini?')) return;
    try {
      await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
      showNotification('✓ Task berhasil dihapus!');
      await fetchDashboardData();
    } catch (err: any) {
      showNotification('❌ ' + (err.message || 'Gagal menghapus task.'));
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

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'IN PROGRESS';
      case 'todo':
        return 'TO DO';
      case 'review':
        return 'REVIEW';
      case 'done':
        return 'DONE';
      default:
        return status ? status.toUpperCase() : '-';
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
      {/* High Visibility Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-2 px-5 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl border-2 border-emerald-500 transition-all duration-300 transform scale-105">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar - Royal Slate Navy (#0f172a) Responsive Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
          <img src="/billcodeLogo.webp" alt="Bilcode Logo" className="h-8 w-auto object-contain" />
          <span className="font-extrabold text-base tracking-tight text-white uppercase">
            ProjectPulse
          </span>
          <span className="text-[10px] px-2.5 py-0.5 bg-blue-950 text-blue-300 rounded-full font-bold uppercase tracking-wider border border-blue-800/80">
            {user?.role === 'admin' ? 'Admin Console' : 'Member Workspace'}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 text-xs font-medium text-slate-300 flex-wrap justify-center">
          <span className="truncate max-w-[200px] sm:max-w-none">{user?.name} ({user?.email})</span>
          <button
            onClick={handleLogout}
            className="px-3.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-[11px] transition border border-slate-700 shrink-0"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
        {/* Hallmark Vibrant Rich Data Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Proyek Aktif */}
          <div className="stat-card bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border-blue-200/90 hover:border-blue-300 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="stat-card-title text-blue-900">Proyek Aktif</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="stat-card-value text-blue-950 mt-2">{summary?.active_projects || 0}</div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium text-blue-800">
                <span>Total Portofolio</span>
                <span className="font-bold">{summary?.total_projects || 0} Proyek</span>
              </div>
              <div className="w-full bg-blue-200/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary?.total_projects ? Math.min(100, Math.round(((summary?.active_projects || 0) / summary.total_projects) * 100)) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Task Overdue */}
          <div className="stat-card bg-gradient-to-br from-rose-50/80 to-red-50/40 border-rose-200/90 hover:border-rose-300 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="stat-card-title text-rose-900">Task Overdue</span>
              <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-700 flex items-center justify-center">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="stat-card-value text-rose-950 mt-2">{summary?.overdue_tasks || 0}</div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-rose-800">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{summary?.overdue_tasks ? 'Perlu tindakan segera!' : 'Semua deadline terkendali'}</span>
            </div>
          </div>

          {/* Card 3: Task Selesai */}
          <div className="stat-card bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border-emerald-200/90 hover:border-emerald-300 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="stat-card-title text-emerald-900">Task Selesai</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="stat-card-value text-emerald-950 mt-2">{summary?.completed_tasks || 0}</div>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium text-emerald-800">
                <span>Rasio Penyelesaian</span>
                <span className="font-bold">{summary?.total_tasks ? Math.round(((summary?.completed_tasks || 0) / summary.total_tasks) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary?.total_tasks ? Math.round(((summary?.completed_tasks || 0) / summary.total_tasks) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Klien Terdaftar */}
          <div className="stat-card bg-gradient-to-br from-purple-50/80 to-violet-50/40 border-purple-200/90 hover:border-purple-300 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="stat-card-title text-purple-900">Klien Terdaftar</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100/80 text-purple-700 flex items-center justify-center">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h5m0 0h5m-5 0V7a2 2 0 00-2-2H9a2 2 0 00-2 2v14" />
                </svg>
              </div>
            </div>
            <div className="stat-card-value text-purple-950 mt-2">{clients.length}</div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-purple-800">
              <span>{clients.length} Perusahaan Klien Aktif</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs, Search Bar & Primary Action Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition uppercase tracking-wider whitespace-nowrap ${
                activeTab === 'projects'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Proyek ({filteredProjects.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition uppercase tracking-wider whitespace-nowrap ${
                activeTab === 'tasks'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Task ({filteredTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition uppercase tracking-wider whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Klien ({filteredClients.length})
            </button>
          </div>

          {/* Live Instant Search Bar */}
          <div className="relative flex-1 max-w-md mx-0 md:mx-3">
            <input
              type="text"
              placeholder={`Cari nama ${activeTab === 'projects' ? 'proyek' : activeTab === 'tasks' ? 'task / assignee' : 'klien'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
            {activeTab === 'projects' && (
              <>
                <button
                  onClick={handleOpenCreateProject}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-blue-700 transition shadow-xs whitespace-nowrap"
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
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-indigo-700 transition shadow-xs whitespace-nowrap"
                >
                  AI Brief Breakdown
                </button>
              </>
            )}

            {activeTab === 'tasks' && (
              <>
                <button
                  onClick={handleOpenCreateTask}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-blue-700 transition shadow-xs whitespace-nowrap"
                >
                  + Task Baru
                </button>
                <button
                  onClick={handleExportCsv}
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-emerald-700 transition shadow-xs whitespace-nowrap"
                >
                  Ekspor CSV
                </button>
              </>
            )}

            {activeTab === 'clients' && (
              <button
                onClick={handleOpenCreateClient}
                className="w-full sm:w-auto px-3.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-blue-700 transition shadow-xs whitespace-nowrap"
              >
                + Klien Baru
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Projects Data Table (Responsive Overflow Wrapper) */}
        {activeTab === 'projects' && (
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-4">Nama Proyek</th>
                  <th className="py-3.5 px-4">Klien</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Progres Task</th>
                  <th className="py-3.5 px-4">Deadline</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProjects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-[13px]">{proj.name}</div>
                      {proj.client_brief && (
                        <div className="text-[11px] font-normal text-slate-500 truncate max-w-sm mt-0.5">
                          Brief: {proj.client_brief}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">{proj.client?.name || '-'}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded-md border ${
                          proj.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${proj.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {proj.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 tabular-nums">
                          {proj.completed_tasks_count} / {proj.tasks_count}
                        </span>
                        <span className="text-[10px] text-slate-600 font-normal">Selesai</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-600 tabular-nums">{proj.deadline}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditProject(proj)}
                          title="Edit Proyek"
                          className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition border border-blue-200/60"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          title="Hapus Proyek"
                          className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition border border-rose-200/60"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Tasks Data Table */}
        {activeTab === 'tasks' && (
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left border-collapse text-xs min-w-[750px]">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-4">Judul Task</th>
                  <th className="py-3.5 px-4">Proyek</th>
                  <th className="py-3.5 px-4">Assignee</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Estimasi</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-[13px]">{t.title}</div>
                      {t.description && (
                        <div className="text-[11px] font-normal text-slate-500 truncate max-w-md mt-0.5">
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">{t.project?.name || '-'}</td>
                    <td className="py-4 px-4">
                      <div className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-extrabold uppercase">
                          {t.assignee?.name ? t.assignee.name.charAt(0) : '?'}
                        </div>
                        <span>{t.assignee?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-md border ${
                        t.category === 'backend'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : t.category === 'design'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : t.category === 'frontend'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={t.status}
                        onChange={(e) => handleInlineStatusChange(t.id, e.target.value)}
                        className={`text-[10.5px] font-extrabold uppercase rounded-md px-2.5 py-1 border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          t.status === 'done'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : t.status === 'in_progress'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : t.status === 'review'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="todo">TO DO</option>
                        <option value="in_progress">IN PROGRESS</option>
                        <option value="review">REVIEW</option>
                        <option value="done">DONE</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800 tabular-nums">{t.estimated_hours} Jam</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditTask(t)}
                          title="Edit Task"
                          className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition border border-blue-200/60"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          title="Hapus Task"
                          className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition border border-rose-200/60"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Clients Data Table */}
        {activeTab === 'clients' && (
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left border-collapse text-xs min-w-[650px]">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-4">Nama Klien</th>
                  <th className="py-3.5 px-4">Perusahaan</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Total Proyek</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="py-4 px-4 font-bold text-slate-900 text-[13px]">{c.name}</td>
                    <td className="py-4 px-4 font-semibold text-slate-700">{c.company}</td>
                    <td className="py-4 px-4 text-slate-800">{c.contact_person}</td>
                    <td className="py-4 px-4 text-slate-600 font-mono text-[11px]">{c.email}</td>
                    <td className="py-4 px-4 font-bold text-slate-800 tabular-nums">{c.projects_count || 0} Proyek</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditClient(c)}
                          title="Edit Klien"
                          className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition border border-blue-200/60"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClient(c.id)}
                          title="Hapus Klien"
                          className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition border border-rose-200/60"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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
