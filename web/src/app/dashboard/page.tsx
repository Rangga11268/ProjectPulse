'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { ClientModal, ProjectModal, TaskModal, AiTaskModal, ConfirmDialog } from './modals';

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
  const [savingAi, setSavingAi] = useState<number | null>(null);
  const savingAiRef = useRef<number | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [clientLoading, setClientLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);

  // Live Search Filter, Status, Category & Client Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // Bulk Selection State
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<number>>(new Set());
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [selectedClientIds, setSelectedClientIds] = useState<Set<number>>(new Set());

  // Task View Mode (table or kanban)
  const [taskViewMode, setTaskViewMode] = useState<'table' | 'kanban'>('table');

  const [projectPage, setProjectPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const [clientPage, setClientPage] = useState(1);
  const itemsPerPage = 6;

  const showNotification = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const toggleSelect = (setter: React.Dispatch<React.SetStateAction<Set<number>>>, id: number) =>
    setter(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const toggleSelectAll = (setter: React.Dispatch<React.SetStateAction<Set<number>>>, ids: number[]) =>
    setter(prev => prev.size === ids.length ? new Set() : new Set(ids));

  const handleBulkDelete = (ids: number[], entity: string, apiPath: string, clearSelection: () => void) => {
    if (ids.length === 0) return;
    setConfirmDialog({
      message: `Apakah Anda yakin ingin menghapus ${ids.length} ${entity} sekaligus?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await Promise.all(ids.map(id => apiRequest(`${apiPath}/${id}`, { method: 'DELETE' })));
          showNotification(`✓ ${ids.length} ${entity} berhasil dihapus!`);
          clearSelection();
          fetchDashboardData();
        } catch (err: any) {
          showNotification('❌ ' + (err.message || 'Gagal menghapus data.'), 'error');
          fetchDashboardData();
        }
      },
    });
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client?.name && p.client.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedProjects = filteredProjects.slice((projectPage - 1) * itemsPerPage, projectPage * itemsPerPage);
  const totalProjectPages = Math.ceil(filteredProjects.length / itemsPerPage) || 1;

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.project?.name && t.project.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.assignee?.name && t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const paginatedTasks = filteredTasks.slice((taskPage - 1) * itemsPerPage, taskPage * itemsPerPage);
  const totalTaskPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCompany = clientFilter === 'all' || (c.company && c.company.toLowerCase() === clientFilter.toLowerCase());
    return matchesSearch && matchesCompany;
  });

  const paginatedClients = filteredClients.slice((clientPage - 1) * itemsPerPage, clientPage * itemsPerPage);
  const totalClientPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;

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
    setClientLoading(true);
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
      showNotification('✓ Klien berhasil disimpan!');
      setShowClientModal(false);
      fetchDashboardData();
    } catch (err: any) {
      showNotification('❌ ' + (err.message || 'Gagal menyimpan klien.'));
    } finally {
      setClientLoading(false);
    }
  };

  const handleDeleteClient = async (id: number) => {
    setConfirmDialog({
      message: 'Apakah Anda yakin ingin menghapus klien ini?',
      onConfirm: async () => {
        setConfirmDialog(null);
        setClientLoading(true);
        setClients(prev => prev.filter(c => c.id !== id));
        try {
          await apiRequest(`/clients/${id}`, { method: 'DELETE' });
          showNotification('✓ Klien berhasil dihapus!');
          fetchDashboardData();
        } catch (err: any) {
          showNotification('❌ ' + (err.message || 'Gagal menghapus klien.'), 'error');
          fetchDashboardData();
        } finally {
          setClientLoading(false);
        }
      },
    });
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
    setProjectLoading(true);
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
      showNotification('✓ Proyek berhasil disimpan!');
      setShowProjectModal(false);
      fetchDashboardData();
    } catch (err: any) {
      showNotification('❌ ' + (err.message || 'Gagal menyimpan proyek.'));
    } finally {
      setProjectLoading(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    setConfirmDialog({
      message: 'Apakah Anda yakin ingin menghapus proyek ini?',
      onConfirm: async () => {
        setConfirmDialog(null);
        setProjectLoading(true);
        setProjects(prev => prev.filter(p => p.id !== id));
        try {
          await apiRequest(`/projects/${id}`, { method: 'DELETE' });
          showNotification('✓ Proyek berhasil dihapus!');
          fetchDashboardData();
        } catch (err: any) {
          showNotification('❌ ' + (err.message || 'Gagal menghapus proyek.'), 'error');
          fetchDashboardData();
        } finally {
          setProjectLoading(false);
        }
      },
    });
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

  const handleTaskDrop = async (taskId: number, newStatus: string) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      await apiRequest(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchDashboardData();
    } catch (err: any) {
      showNotification('❌ ' + (err.message || 'Gagal mengubah status task.'), 'error');
      fetchDashboardData(); // revert
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskLoading(true);
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
      fetchDashboardData();
    } catch (err: any) {
      showNotification('❌ ' + (err.message || 'Gagal menyimpan task.'));
    } finally {
      setTaskLoading(false);
    }
  };

  const handleInlineStatusChange = async (taskId: number, newStatus: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    setTaskLoading(true);
    try {
      await apiRequest(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showNotification('✓ Status task berhasil diubah!');
      fetchDashboardData();
    } catch (err: any) {
      showNotification('❌ Gagal mengubah status task.', 'error');
      fetchDashboardData();
    } finally {
      setTaskLoading(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    setConfirmDialog({
      message: 'Apakah Anda yakin ingin menghapus task ini?',
      onConfirm: async () => {
        setConfirmDialog(null);
        setTaskLoading(true);
        setTasks(prev => prev.filter(t => t.id !== id));
        try {
          await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
          showNotification('✓ Task berhasil dihapus!');
          fetchDashboardData();
        } catch (err: any) {
          showNotification('❌ ' + (err.message || 'Gagal menghapus task.'), 'error');
          fetchDashboardData();
        } finally {
          setTaskLoading(false);
        }
      },
    });
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
      showNotification('✓ Task AI berhasil digenerate! Silakan edit lalu simpan.');
    } catch (err: any) {
      showNotification('❌ ' + (err.message || 'Gagal menghasilkan task AI.'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdateAiTaskField = (idx: number, field: string, val: any) => {
    const updated = [...aiTasks];
    updated[idx] = { ...updated[idx], [field]: val };
    setAiTasks(updated);
  };

  const handleDeleteAiTask = (idx: number) => {
    setAiTasks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAiTask = async (idx: number) => {
    const task = aiTasks[idx];
    if (!selectedProjectId || !task || savingAiRef.current !== null) return;
    savingAiRef.current = idx;
    setSavingAi(idx);
    try {
      await apiRequest(`/projects/${selectedProjectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          category: task.category,
          estimated_hours: task.estimated_hours || 1, // Fallback to 1 if empty/0
          assignee_id: task.assignee_id || null,
          status: 'todo',
        }),
      });
      setAiTasks(prev => prev.filter((_, i) => i !== idx));
      showNotification('✓ Task berhasil dibuat dari rekomendasi AI!');
      fetchDashboardData();
    } catch (err: any) {
      showNotification('❌ ' + (err.message || 'Gagal menyimpan task.'), 'error');
    } finally {
      savingAiRef.current = null;
      setSavingAi(null);
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const token = localStorage.getItem('token');
    window.open(`${baseUrl}/tasks/export/csv?token=${token}`, '_blank');
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

        {/* Option A: Master-Detail Split View (Main Data Table 68% + Live Activity Sidebar 32%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Master Workspace (Col Span 8) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Primary Action Toolbar: Navigation Tabs & Actions */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {activeTab === 'projects' && (
                    <>
                      <button
                        onClick={handleOpenCreateProject}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-blue-700 transition shadow-xs whitespace-nowrap"
                      >
                        + Proyek
                      </button>
                      {selectedProjectIds.size > 0 && (
                        <button
                          onClick={() => handleBulkDelete(
                            [...selectedProjectIds], 'proyek', '/projects',
                            () => setSelectedProjectIds(new Set())
                          )}
                          className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-rose-700 transition shadow-xs whitespace-nowrap"
                        >
                          Hapus ({selectedProjectIds.size})
                        </button>
                      )}
                    </>
                  )}

                  {activeTab === 'tasks' && (
                    <>
                      <button
                        onClick={handleOpenCreateTask}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-blue-700 transition shadow-xs whitespace-nowrap"
                      >
                        + Task
                      </button>
                      
                      <div className="flex bg-slate-100 rounded-lg p-0.5 shadow-inner">
                        <button
                          onClick={() => setTaskViewMode('table')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition uppercase tracking-wider ${taskViewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Tabel
                        </button>
                        <button
                          onClick={() => setTaskViewMode('kanban')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition uppercase tracking-wider ${taskViewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          Kanban
                        </button>
                      </div>

                      <button
                        onClick={handleExportCsv}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-emerald-700 transition shadow-xs whitespace-nowrap"
                      >
                        CSV
                      </button>
                      {selectedTaskIds.size > 0 && (
                        <button
                          onClick={() => handleBulkDelete(
                            [...selectedTaskIds], 'task', '/tasks',
                            () => setSelectedTaskIds(new Set())
                          )}
                          className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-rose-700 transition shadow-xs whitespace-nowrap"
                        >
                          Hapus ({selectedTaskIds.size})
                        </button>
                      )}
                    </>
                  )}

                  {activeTab === 'clients' && (
                    <>
                      <button
                        onClick={handleOpenCreateClient}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-blue-700 transition shadow-xs whitespace-nowrap"
                      >
                        + Klien
                      </button>
                      {selectedClientIds.size > 0 && (
                        <button
                          onClick={() => handleBulkDelete(
                            [...selectedClientIds], 'klien', '/clients',
                            () => setSelectedClientIds(new Set())
                          )}
                          className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-rose-700 transition shadow-xs whitespace-nowrap"
                        >
                          Hapus ({selectedClientIds.size})
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Dedicated Search & Filter Sub-Bar */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={`Cari nama ${activeTab === 'projects' ? 'proyek / klien' : activeTab === 'tasks' ? 'task / assignee' : 'klien / perusahaan'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Dropdown Filter */}
                  {(activeTab === 'projects' || activeTab === 'tasks') && (
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="py-2 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer min-w-[120px]"
                    >
                      <option value="all">Semua Status</option>
                      {activeTab === 'projects' ? (
                        <>
                          <option value="planning">Planning</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </>
                      ) : (
                        <>
                          <option value="todo">To-Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </>
                      )}
                    </select>
                  )}

                  {/* Category Dropdown Filter for Tasks */}
                  {activeTab === 'tasks' && (
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="py-2 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer min-w-[130px]"
                    >
                      <option value="all">Semua Kategori</option>
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                      <option value="ui_ux">UI/UX</option>
                      <option value="qa">QA / Testing</option>
                      <option value="devops">DevOps</option>
                    </select>
                  )}

                  {/* Company Dropdown Filter for Clients */}
                  {activeTab === 'clients' && (
                    <select
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className="py-2 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer min-w-[140px]"
                    >
                      <option value="all">Semua Perusahaan</option>
                      {Array.from(new Set(clients.map(c => c.company).filter(Boolean))).map((comp: any) => (
                        <option key={comp} value={comp}>{comp}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

        {/* Tab 1: Projects Data Table */}
        {activeTab === 'projects' && (
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left border-collapse text-xs min-w-[640px]">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-2 w-10">
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.size === paginatedProjects.length && paginatedProjects.length > 0}
                      onChange={() => toggleSelectAll(setSelectedProjectIds, paginatedProjects.map(p => p.id))}
                      className="accent-white w-3.5 h-3.5 rounded cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 min-w-[200px]">Nama Proyek</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Klien</th>
                  <th className="py-3.5 px-4 min-w-[100px]">Status</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Progres Task</th>
                  <th className="py-3.5 px-4 min-w-[100px]">Deadline</th>
                  <th className="py-3.5 px-4 text-right min-w-[80px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedProjects.map((proj) => (
                  <tr key={proj.id} className={`hover:bg-slate-50/80 transition-colors duration-150 ${selectedProjectIds.has(proj.id) ? 'bg-blue-50/60' : ''}`}>
                    <td className="py-4 px-2">
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.has(proj.id)}
                        onChange={() => toggleSelect(setSelectedProjectIds, proj.id)}
                        className="accent-blue-600 w-3.5 h-3.5 rounded cursor-pointer"
                      />
                    </td>
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
                          {proj.completed_tasks_count ?? 0} / {proj.tasks_count ?? 0}
                        </span>
                        <span className="text-[10px] text-slate-600 font-normal">Selesai</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-600 tabular-nums">{proj.deadline ?? '-'}</td>
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
                          disabled={projectLoading}
                          className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition border border-rose-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
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

            {/* Pagination Controls */}
            {totalProjectPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200/80 text-xs">
                <button
                  onClick={() => setProjectPage((p) => Math.max(1, p - 1))}
                  disabled={projectPage === 1}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-md font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  ← Sebelumnya
                </button>
                <span className="font-semibold text-slate-600">
                  Halaman <strong className="text-slate-900">{projectPage}</strong> dari {totalProjectPages}
                </span>
                <button
                  onClick={() => setProjectPage((p) => Math.min(totalProjectPages, p + 1))}
                  disabled={projectPage === totalProjectPages}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-md font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  Selanjutnya →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Tasks Data Table / Kanban */}
        {activeTab === 'tasks' && (
          <>
            {taskViewMode === 'table' ? (
              <div className="bg-white border border-slate-200/80 rounded-xl overflow-x-auto shadow-xs">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[10.5px]">
                      <th className="py-3.5 px-2 w-10">
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.size === paginatedTasks.length && paginatedTasks.length > 0}
                          onChange={() => toggleSelectAll(setSelectedTaskIds, paginatedTasks.map(t => t.id))}
                          className="accent-white w-3.5 h-3.5 rounded cursor-pointer"
                        />
                      </th>
                      <th className="py-3.5 px-4 min-w-[180px]">Judul Task</th>
                      <th className="py-3.5 px-4 min-w-[140px]">Proyek</th>
                      <th className="py-3.5 px-4 min-w-[120px]">Assignee</th>
                      <th className="py-3.5 px-4 min-w-[100px]">Kategori</th>
                      <th className="py-3.5 px-4 min-w-[110px]">Status</th>
                      <th className="py-3.5 px-4 min-w-[90px]">Estimasi</th>
                      <th className="py-3.5 px-4 text-right min-w-[80px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paginatedTasks.map((t) => (
                      <tr key={t.id} className={`hover:bg-slate-50/80 transition-colors duration-150 ${selectedTaskIds.has(t.id) ? 'bg-blue-50/60' : ''}`}>
                        <td className="py-4 px-2">
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.has(t.id)}
                            onChange={() => toggleSelect(setSelectedTaskIds, t.id)}
                            className="accent-blue-600 w-3.5 h-3.5 rounded cursor-pointer"
                          />
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900 text-[13px]">{t.title}</td>
                        <td className="py-4 px-4 text-slate-600">{t.project?.name || '-'}</td>
                        <td className="py-4 px-4 text-slate-600">
                          {t.assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                                {t.assignee.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate max-w-[100px]">{t.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${t.category === 'frontend' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : t.category === 'backend' ? 'bg-orange-50 text-orange-700 border-orange-200' : t.category === 'design' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {t.category}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded-md border ${t.status === 'done' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : t.status === 'in_progress' ? 'bg-blue-50 text-blue-800 border-blue-200' : t.status === 'review' ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'done' ? 'bg-emerald-500' : t.status === 'in_progress' ? 'bg-blue-500' : t.status === 'review' ? 'bg-purple-500' : 'bg-slate-400'}`} />
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-600 tabular-nums">{t.estimated_hours}h</td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditTask(t)}
                              title="Detail / Edit Task"
                              className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition border border-blue-200/60"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteTask(t.id)}
                              title="Hapus Task"
                              disabled={taskLoading}
                              className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition border border-rose-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
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

                {/* Pagination Controls */}
                {totalTaskPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200/80 text-xs">
                    <button
                      onClick={() => setTaskPage((p) => Math.max(1, p - 1))}
                      disabled={taskPage === 1}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-md font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                    >
                      ← Sebelumnya
                    </button>
                    <span className="font-semibold text-slate-600">
                      Halaman <strong className="text-slate-900">{taskPage}</strong> dari {totalTaskPages}
                    </span>
                    <button
                      onClick={() => setTaskPage((p) => Math.min(totalTaskPages, p + 1))}
                      disabled={taskPage === totalTaskPages}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-md font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                    >
                      Selanjutnya →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)] min-h-[500px]">
                {['todo', 'in_progress', 'review', 'done'].map(statusCol => {
                  const columnTasks = filteredTasks.filter(t => t.status === statusCol);
                  const statusColors: any = {
                    todo: 'border-slate-300 bg-slate-50 text-slate-800',
                    in_progress: 'border-blue-300 bg-blue-50 text-blue-800',
                    review: 'border-purple-300 bg-purple-50 text-purple-800',
                    done: 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  };
                  
                  return (
                    <div 
                      key={statusCol}
                      className="flex-shrink-0 w-80 flex flex-col bg-slate-100/50 rounded-xl border border-slate-200/60"
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-slate-200/60'); }}
                      onDragLeave={(e) => { e.currentTarget.classList.remove('bg-slate-200/60'); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-slate-200/60');
                        const taskIdStr = e.dataTransfer.getData('text/plain');
                        if (taskIdStr) {
                          handleTaskDrop(parseInt(taskIdStr), statusCol);
                        }
                      }}
                    >
                      <div className="px-4 py-3 border-b border-slate-200/60 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                          {statusCol.replace('_', ' ')}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${statusColors[statusCol]}`}>
                          {columnTasks.length}
                        </span>
                      </div>
                      
                      <div className="flex-1 p-3 overflow-y-auto space-y-3">
                        {columnTasks.map(t => (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', t.id.toString());
                              e.currentTarget.style.opacity = '0.4';
                            }}
                            onDragEnd={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                            onClick={() => handleOpenEditTask(t)}
                            className="bg-white p-4 rounded-lg shadow-sm border border-slate-200/80 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition group"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${t.category === 'frontend' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : t.category === 'backend' ? 'bg-orange-50 text-orange-700 border-orange-200' : t.category === 'design' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {t.category}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400">{t.estimated_hours}h</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm leading-tight mb-2 group-hover:text-blue-700 transition">
                              {t.title}
                            </h4>
                            <div className="text-xs text-slate-500 mb-3 line-clamp-2">
                              {t.project?.name}
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-100">
                              {t.assignee ? (
                                <div className="flex items-center gap-1.5" title={t.assignee.name}>
                                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                                    {t.assignee.name.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                              )}
                              
                              {t.deadline && (
                                <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                  {new Date(t.deadline).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {columnTasks.length === 0 && (
                          <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-medium italic">
                            Drag task ke sini
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Tab 3: Clients Data Table */}
        {activeTab === 'clients' && (
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-x-auto shadow-xs">
            <table className="w-full text-left border-collapse text-xs min-w-[600px]">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3.5 px-2 w-10">
                    <input
                      type="checkbox"
                      checked={selectedClientIds.size === paginatedClients.length && paginatedClients.length > 0}
                      onChange={() => toggleSelectAll(setSelectedClientIds, paginatedClients.map(c => c.id))}
                      className="accent-white w-3.5 h-3.5 rounded cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 min-w-[140px]">Nama Klien</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Perusahaan</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Contact Person</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Email</th>
                  <th className="py-3.5 px-4 min-w-[100px]">Total Proyek</th>
                  <th className="py-3.5 px-4 text-right min-w-[80px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedClients.map((c) => (
                  <tr key={c.id} className={`hover:bg-slate-50/80 transition-colors duration-150 ${selectedClientIds.has(c.id) ? 'bg-blue-50/60' : ''}`}>
                    <td className="py-4 px-2">
                      <input
                        type="checkbox"
                        checked={selectedClientIds.has(c.id)}
                        onChange={() => toggleSelect(setSelectedClientIds, c.id)}
                        className="accent-blue-600 w-3.5 h-3.5 rounded cursor-pointer"
                      />
                    </td>
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
                          disabled={clientLoading}
                          className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition border border-rose-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
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

            {/* Pagination Controls */}
            {totalClientPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200/80 text-xs">
                <button
                  onClick={() => setClientPage((p) => Math.max(1, p - 1))}
                  disabled={clientPage === 1}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-md font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  ← Sebelumnya
                </button>
                <span className="font-semibold text-slate-600">
                  Halaman <strong className="text-slate-900">{clientPage}</strong> dari {totalClientPages}
                </span>
                <button
                  onClick={() => setClientPage((p) => Math.min(totalClientPages, p + 1))}
                  disabled={clientPage === totalClientPages}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-md font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  Selanjutnya →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Detail Sidebar (Col Span 4) */}
      <div className="lg:col-span-4 space-y-5">
        {/* AI Brief Breakdown Quick Shortcut Card */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md border border-slate-800 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-700/50">
                AI Powered Feature
              </span>
              <h3 className="text-sm font-extrabold mt-2 tracking-tight">AI Brief Breakdown</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Uraikan brief klien menjadi daftar task otomatis menggunakan Gemini AI.
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => {
              if (projects.length > 0) {
                setSelectedProjectId(projects[0].id);
                setBriefInput(projects[0].client_brief || '');
              }
              setShowAiModal(true);
            }}
            className="w-full mt-4 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition uppercase tracking-wider shadow-xs flex items-center justify-center gap-2"
          >
            <span>Mulai AI Breakdown</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* Team Workload & Activity Feed Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Beban Kerja Tim ({members.length})</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-600 uppercase">Aktif</span>
          </div>

          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-2">Belum ada data anggota tim.</p>
            ) : (
              members.map((m: any) => (
                <div key={m.id || m.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center uppercase shadow-xs">
                      {m.name ? m.name.charAt(0) : '?'}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">{m.name}</span>
                      <span className="block text-[10px] text-slate-600 font-medium">{m.email || 'Member Team'}</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {m.active_tasks_count !== undefined
                      ? m.active_tasks_count
                      : tasks.filter((t: any) => t.assignee_id === m.id || t.assignee?.id === m.id).length}{' '}
                    Task
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  </main>

      <ClientModal show={showClientModal} onClose={() => setShowClientModal(false)} form={clientForm} setForm={setClientForm} editing={editingClient} onSave={handleSaveClient} loading={clientLoading} />

      <ProjectModal show={showProjectModal} onClose={() => setShowProjectModal(false)} form={projectForm} setForm={setProjectForm} editing={editingProject} onSave={handleSaveProject} loading={projectLoading} clients={clients} />

      <TaskModal show={showTaskModal} onClose={() => setShowTaskModal(false)} form={taskForm} setForm={setTaskForm} editing={editingTask} onSave={handleSaveTask} loading={taskLoading} projects={projects} members={members} />

      <AiTaskModal
        show={showAiModal}
        onClose={() => setShowAiModal(false)}
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        briefInput={briefInput}
        setBriefInput={setBriefInput}
        onGenerate={handleGenerateAiTasks}
        aiLoading={aiLoading}
        aiTasks={aiTasks}
        onUpdateField={handleUpdateAiTaskField}
        onSaveTask={handleSaveAiTask}
        onDeleteTask={handleDeleteAiTask}
        savingAi={savingAi}
        members={members}
      />

      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {toast && (
        <div
          className="fixed top-5 right-5 z-50 flex items-start gap-3 bg-white px-4 py-3 rounded-lg shadow-lg border border-slate-200 animate-in slide-in-from-right-2 fade-in duration-300 max-w-sm"
          style={{
            borderLeftWidth: '4px',
            borderLeftColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
          }}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
            toast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            ) : toast.type === 'error' ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="flex-1 text-xs font-semibold text-slate-800 leading-snug pt-0.5">{toast.message}</p>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
