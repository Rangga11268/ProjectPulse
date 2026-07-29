import React, { useEffect, useState, useMemo } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonBadge,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonTextarea,
  IonToast,
  IonList,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import { mobileApiRequest } from './services/api';

export const MemberApp: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // Auth Form State
  const [email, setEmail] = useState('dev@bilcode.com');
  const [password, setPassword] = useState('password123');

  // Navigation Segment: 'tasks' | 'history' | 'notifications'
  const [activeSegment, setActiveSegment] = useState<'tasks' | 'history' | 'notifications'>('tasks');

  // Tasks & Filter State
  const [tasks, setTasks] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Time Log Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [hoursInput, setHoursInput] = useState('2.5');
  const [noteInput, setNoteInput] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Pagination State (Performance optimization for large datasets)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const [toastMessage, setToastMessage] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);
  const [logLoading, setLogLoading] = useState(false);
  // Search Query & Category Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Performance Optimization: useMemo for memoized task filtering & pagination
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== 'done');
  }, [tasks]);

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'done');
  }, [tasks]);

  const filteredActiveTasks = useMemo(() => {
    return activeTasks.filter((t) => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.project?.name && t.project.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [activeTasks, statusFilter, categoryFilter, searchQuery]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredActiveTasks.length / itemsPerPage) || 1;
  }, [filteredActiveTasks.length, itemsPerPage]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredActiveTasks.slice(start, start + itemsPerPage);
  }, [filteredActiveTasks, currentPage, itemsPerPage]);

  const categoryLabels: Record<string, string> = {
    backend: 'Backend',
    frontend: 'Frontend',
    design: 'Design',
    qa: 'QA',
    general: 'General',
  };

  // Check persistent login on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('mobile_token');
    const savedUser = localStorage.getItem('mobile_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        fetchTasks(parsedUser.id);
      } catch {
        localStorage.removeItem('mobile_user');
        localStorage.removeItem('mobile_token');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginLoading) return;
    setLoginLoading(true);
    try {
      const data = await mobileApiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.data?.token) {
        localStorage.setItem('mobile_token', data.data.token);
        localStorage.setItem('mobile_user', JSON.stringify(data.data.user));
        setToken(data.data.token);
        setUser(data.data.user);
        fetchTasks(data.data.user.id);
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Login gagal.');
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchTasks = async (userId: number) => {
    try {
      // First try fetching tasks assigned to member
      let data = await mobileApiRequest(`/tasks?assignee_id=${userId}`);
      let taskList = data.data || [];
      
      // If no task specifically assigned yet, fetch all project tasks so user sees the team tasks
      if (taskList.length === 0) {
        data = await mobileApiRequest('/tasks');
        taskList = data.data || [];
      }

      setTasks(taskList);
      generateInAppNotifications(taskList);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('unauthenticated')) {
        handleLogout();
      } else {
        console.error(err);
      }
    }
  };

  const timeAgo = (rawDate: string) => {
    if (!rawDate) return 'Baru saja';
    const diff = Date.now() - new Date(rawDate).getTime();
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / 60000);
    if (mins < 1) return 'Baru saja';
    if (diff < 0) {
      if (mins < 60) return `${mins} menit lagi`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} jam lagi`;
      const days = Math.floor(hours / 24);
      return `${days} hari lagi`;
    }
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} hari lalu`;
    const months = Math.floor(days / 30);
    return `${months} bulan lalu`;
  };

  const generateInAppNotifications = (taskList: any[]) => {
    const notifs: any[] = [];

    taskList.forEach((t) => {
      if (t.status !== 'done') {
        notifs.push({
          id: `new-${t.id}`,
          title: 'Tugas Baru Di-assign',
          message: `Kamu mendapatkan tugas baru: "${t.title}" pada proyek ${t.project?.name || ''}.`,
          date: timeAgo(t.created_at),
          type: 'info',
        });
      }

      if (t.deadline && t.status !== 'done') {
        notifs.push({
          id: `deadline-${t.id}`,
          title: 'Pengingat Deadline Tugas',
          message: `Tugas "${t.title}" jatuh tempo pada ${t.deadline}. Segera perbarui progres!`,
          date: timeAgo(t.deadline),
          type: 'warning',
        });
      }
    });

    setNotifications(notifs);
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    if (statusLoading !== null) return;
    setStatusLoading(taskId);
    try {
      await mobileApiRequest(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setToastMessage('Status task berhasil diperbarui!');
      fetchTasks(user.id);
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Gagal memperbarui status task.');
    } finally {
      setStatusLoading(null);
    }
  };

  const handleAddTimeLog = async () => {
    if (!selectedTask || !hoursInput || logLoading) return;
    const parsedHours = parseFloat(hoursInput);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      setToastMessage('Durasi jam kerja harus berupa angka positif.');
      return;
    }
    if (!noteInput.trim()) {
      setToastMessage('Catatan progres pekerjaan tidak boleh kosong.');
      return;
    }

    setLogLoading(true);
    try {
      const res = await mobileApiRequest(`/tasks/${selectedTask.id}/time-logs`, {
        method: 'POST',
        body: JSON.stringify({
          hours: parsedHours,
          note: noteInput.trim(),
        }),
      });

      const newLog = res.data;
      const updatedLogs = [newLog, ...(selectedTask.time_logs || [])];

      // Instant optimistic state update on selectedTask so modal updates immediately without manual reload
      setSelectedTask((prev: any) => (prev ? { ...prev, time_logs: updatedLogs } : null));

      setToastMessage('✓ Log waktu kerja berhasil dicatat!');
      setShowLogModal(false);
      setNoteInput('');
      fetchTasks(user.id);
    } catch (err: any) {
      setToastMessage(err.message || 'Gagal menambah log waktu.');
    } finally {
      setLogLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mobile_token');
    localStorage.removeItem('mobile_user');
    setToken(null);
    setUser(null);
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


  if (!token) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="dark">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px' }}>
              <img src="/billcodeLogo.webp" alt="Bilcode" style={{ height: '26px', width: 'auto' }} />
              <IonTitle style={{ paddingLeft: 0, fontSize: '0.9rem', color: '#fff' }}>ProjectPulse</IonTitle>
            </div>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard style={{ overflow: 'hidden', marginTop: '16px' }}>
            <div style={{ background: '#0f172a', padding: '24px 16px', textAlign: 'center', borderBottom: '1px solid #1e293b' }}>
              <img src="/billcodeLogo.webp" alt="Bilcode Logo" style={{ height: '36px', width: 'auto', margin: '0 auto 8px auto' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em', margin: 0, textTransform: 'uppercase' }}>
                ProjectPulse Member
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', margin: 0 }}>
                Aplikasi Developer & Desainer Bilcode
              </p>
            </div>
            <IonCardContent>
              <form onSubmit={handleLogin}>
                <IonItem className="ion-margin-bottom">
                  <IonLabel position="stacked">Email Member</IonLabel>
                  <IonInput
                    type="email"
                    value={email}
                    onIonInput={(e) => setEmail(e.detail.value!)}
                    required
                  />
                </IonItem>
                <IonItem className="ion-margin-bottom">
                  <IonLabel position="stacked">Password</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value!)}
                    required
                  />
                </IonItem>
                <IonButton expand="block" type="submit" className="ion-margin-top" disabled={loginLoading}>
                  {loginLoading ? 'Memuat...' : 'Masuk ke App'}
                </IonButton>
              </form>
            </IonCardContent>
          </IonCard>
          <IonToast
            isOpen={!!toastMessage}
            message={toastMessage}
            duration={3000}
            onDidDismiss={() => setToastMessage('')}
          />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="dark">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px' }}>
            <img src="/billcodeLogo.webp" alt="Bilcode Logo" style={{ height: '26px', width: 'auto' }} />
            <IonTitle style={{ paddingLeft: 0, fontSize: '0.9rem', color: '#fff' }}>ProjectPulse</IonTitle>
          </div>
          <IonButton slot="end" fill="clear" color="light" size="small" onClick={handleLogout}>
            Logout
          </IonButton>
        </IonToolbar>
          <IonToolbar style={{ '--background': '#0f172a', '--border-color': '#1e293b', padding: '6px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button
                onClick={() => setActiveSegment('tasks')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  background: activeSegment === 'tasks' ? '#ffffff' : '#1e293b',
                  color: activeSegment === 'tasks' ? '#0f172a' : '#94a3b8',
                  border: activeSegment === 'tasks' ? '1px solid #ffffff' : '1px solid #334155',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                Aktif ({activeTasks.length})
              </button>

              <button
                onClick={() => setActiveSegment('history')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  background: activeSegment === 'history' ? '#ffffff' : '#1e293b',
                  color: activeSegment === 'history' ? '#0f172a' : '#94a3b8',
                  border: activeSegment === 'history' ? '1px solid #ffffff' : '1px solid #334155',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                Riwayat Selesai ({completedTasks.length})
              </button>

              <button
                onClick={() => setActiveSegment('notifications')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  background: activeSegment === 'notifications' ? '#ffffff' : '#1e293b',
                  color: activeSegment === 'notifications' ? '#0f172a' : '#94a3b8',
                  border: activeSegment === 'notifications' ? '1px solid #ffffff' : '1px solid #334155',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                Notifikasi ({notifications.length})
              </button>
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
          {/* Anti-Slop Member Profile Header */}
          <div style={{ background: '#0f172a', borderRadius: '14px', padding: '16px', color: '#ffffff', marginBottom: '16px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1e293b', border: '1px solid #334155', color: '#ffffff', fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', flexShrink: 0 }}>
                  {user?.name ? user.name.charAt(0) : 'M'}
                </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em' }}>
                  {user?.name || 'Member Workspace'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                  {user?.email || 'dev@bilcode.com'}
                </p>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', background: '#1e293b', color: '#cbd5e1', padding: '3px 8px', borderRadius: '4px', border: '1px solid #334155' }}>
              {user?.role || 'Member'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #1e293b' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Tugas Aktif</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#ffffff' }}>{activeTasks.length} Task</span>
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Task Selesai</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#10b981' }}>{completedTasks.length} Selesai</span>
            </div>
          </div>
        </div>

        {/* Active Tasks Tab */}
        {activeSegment === 'tasks' && (
          <>
            {/* Live Search Input & Filter Controls */}
            <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Cari nama task / proyek..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 32px 8px 12px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      color: '#64748b',
                      fontWeight: '800',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <IonItem style={{ '--background': '#ffffff', '--border-radius': '10px', border: '1px solid #cbd5e1', margin: 0, '--min-height': '38px' }}>
                  <IonSelect
                    value={statusFilter}
                    onIonChange={(e) => setStatusFilter(e.detail.value)}
                    style={{ fontSize: '0.72rem', fontWeight: '700', color: '#0f172a', width: '100%' }}
                  >
                    <IonSelectOption value="all">Semua Status</IonSelectOption>
                    <IonSelectOption value="todo">To Do</IonSelectOption>
                    <IonSelectOption value="in_progress">In Progress</IonSelectOption>
                    <IonSelectOption value="review">Review</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem style={{ '--background': '#ffffff', '--border-radius': '10px', border: '1px solid #cbd5e1', margin: 0, '--min-height': '38px' }}>
                  <IonSelect
                    value={categoryFilter}
                    onIonChange={(e) => setCategoryFilter(e.detail.value)}
                    style={{ fontSize: '0.72rem', fontWeight: '700', color: '#0f172a', width: '100%' }}
                  >
                    <IonSelectOption value="all">Semua Kategori</IonSelectOption>
                    <IonSelectOption value="backend">Backend</IonSelectOption>
                    <IonSelectOption value="frontend">Frontend</IonSelectOption>
                    <IonSelectOption value="design">Design / UI</IonSelectOption>
                    <IonSelectOption value="qa">QA / Testing</IonSelectOption>
                    <IonSelectOption value="general">General</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </div>
            </div>

            <IonList style={{ background: 'transparent', padding: 0 }}>
              {paginatedTasks.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>Tidak Ada Task Aktif</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: '#64748b' }}>Semua pekerjaan kamu saat ini telah diselesaikan dengan baik.</p>
                </div>
              ) : (
                paginatedTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '14px',
                      marginBottom: '10px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1'
                      }}>
                        {categoryLabels[t.category] || t.category}
                      </span>

                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: t.status === 'in_progress' ? '#fef3c7' : t.status === 'review' ? '#f3e8ff' : '#f1f5f9',
                        color: t.status === 'in_progress' ? '#b45309' : t.status === 'review' ? '#6b21a8' : '#334155',
                        border: '1px solid #cbd5e1'
                      }}>
                        {formatStatusLabel(t.status)}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', margin: '8px 0 3px 0', lineHeight: 1.3 }}>
                      {t.title}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      Proyek: <strong style={{ color: '#0f172a' }}>{t.project?.name || '-'}</strong> — {t.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '0.7rem', color: '#64748b' }}>
                      <span>Estimasi: <strong style={{ color: '#0f172a' }}>{t.estimated_hours} Jam</strong></span>
                      <span style={{ color: t.deadline || t.project?.deadline ? '#be123c' : '#64748b', fontWeight: '700' }}>
                        Deadline: {t.deadline || t.project?.deadline ? `${t.deadline || t.project?.deadline} (${timeAgo(t.deadline || t.project?.deadline)})` : 'Tidak ditetapkan'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </IonList>

            {/* Utilitarian Anti-Slop Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', padding: '10px 14px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    background: currentPage === 1 ? '#f1f5f9' : '#0f172a',
                    color: currentPage === 1 ? '#94a3b8' : '#ffffff',
                    border: 'none',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ← Sebelunmnya
                </button>
                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#475569' }}>
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    background: currentPage === totalPages ? '#f1f5f9' : '#0f172a',
                    color: currentPage === totalPages ? '#94a3b8' : '#ffffff',
                    border: 'none',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  Selanjutnya →
                </button>
              </div>
            )}
          </>
        )}

        {/* History Tab for Completed Tasks */}
        {activeSegment === 'history' && (
          <IonList>
            {completedTasks.length === 0 ? (
              <IonItem>
                <IonLabel className="ion-text-center">Belum ada tugas yang selesai.</IonLabel>
              </IonItem>
            ) : (
              completedTasks.map((t) => (
                <IonCard key={t.id} button onClick={() => setSelectedTask(t)}>
                  <IonCardHeader>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <IonBadge color="success">SELESAI</IonBadge>
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>{t.deadline || '-'}</span>
                    </div>
                    <IonCardTitle style={{ fontSize: '1rem', marginTop: '8px' }}>
                      {t.title}
                    </IonCardTitle>
                    <IonCardSubtitle>Proyek: {t.project?.name || '-'}</IonCardSubtitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p>{t.description}</p>
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#2dd36f', fontWeight: 'bold' }}>
                      ✓ Task Selesai — Total {t.time_logs?.reduce((acc: number, l: any) => acc + Number(l.hours), 0) || 0} jam dicatat
                    </div>
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </IonList>
        )}

        {/* Notifications Tab */}
        {activeSegment === 'notifications' && (
          <IonList>
            {notifications.length === 0 ? (
              <IonItem>
                <IonLabel className="ion-text-center">Tidak ada notifikasi baru.</IonLabel>
              </IonItem>
            ) : (
              notifications.map((n) => (
                <IonCard key={n.id}>
                  <IonCardHeader>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <IonCardTitle style={{ fontSize: '0.95rem' }}>{n.title}</IonCardTitle>
                      <IonBadge color={n.type === 'warning' ? 'warning' : 'primary'}>
                        {n.date}
                      </IonBadge>
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    <p style={{ fontSize: '0.85rem' }}>{n.message}</p>
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </IonList>
        )}

        {/* Task Detail Modal - Anti-Slop Hallmark Redesign */}
        <IonModal isOpen={!!selectedTask} onDidDismiss={() => setSelectedTask(null)}>
          {selectedTask && (
            <>
              <IonHeader>
                <IonToolbar style={{ '--background': '#0f172a', '--color': '#ffffff' }}>
                  <IonTitle style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Detail Task #{selectedTask.id}
                  </IonTitle>
                  <IonButton slot="end" fill="clear" color="light" size="small" onClick={() => setSelectedTask(null)} style={{ fontWeight: '700' }}>
                    Tutup
                  </IonButton>
                </IonToolbar>
              </IonHeader>
              <IonContent className="ion-padding" style={{ '--background': '#f8fafc' }}>
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', color: '#0369a1', background: '#e0f2fe', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                      {categoryLabels[selectedTask.category] || selectedTask.category}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      {formatStatusLabel(selectedTask.status)}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '4px 0 8px 0', lineHeight: 1.3 }}>
                    {selectedTask.title}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    {selectedTask.description || 'Tidak ada deskripsi rincian.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Proyek</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a' }}>{selectedTask.project?.name || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Deadline</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', color: selectedTask.deadline || selectedTask.project?.deadline ? '#be123c' : '#64748b' }}>
                        {selectedTask.deadline || selectedTask.project?.deadline
                          ? `${selectedTask.deadline || selectedTask.project?.deadline} (${timeAgo(selectedTask.deadline || selectedTask.project?.deadline)})`
                          : 'Tidak ditetapkan'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Update Control */}
                <div style={{ marginTop: '14px', background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <IonLabel style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '10px', letterSpacing: '0.04em' }}>
                    Pilih Status Pekerjaan:
                  </IonLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {['todo', 'in_progress', 'review', 'done'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedTask.id, st)}
                        disabled={statusLoading === selectedTask.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          background: selectedTask.status === st ? '#0f172a' : '#f8fafc',
                          color: selectedTask.status === st ? '#ffffff' : '#334155',
                          border: selectedTask.status === st ? '1px solid #0f172a' : '1px solid #cbd5e1',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {statusLoading === selectedTask.id ? '...' : formatStatusLabel(st)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowLogModal(true)}
                  style={{
                    width: '100%',
                    marginTop: '14px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                  }}
                >
                  + Catat Log Jam Kerja
                </button>

                {/* Log History */}
                <div style={{ marginTop: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
                      Riwayat Log Waktu:
                    </h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2563eb' }}>
                      Total: {selectedTask.time_logs?.reduce((acc: number, l: any) => acc + Number(l.hours), 0) || 0} Jam
                    </span>
                  </div>

                  {selectedTask.time_logs?.length === 0 ? (
                    <div style={{ padding: '14px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                      Belum ada log waktu kerja yang dicatat.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedTask.time_logs?.map((log: any) => (
                        <div key={log.id} style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{log.hours} Jam Kerja</h4>
                            <p style={{ fontSize: '0.72rem', color: '#475569', margin: '2px 0 0 0' }}>{log.note || 'Tanpa catatan'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </IonContent>
            </>
          )}
        </IonModal>

        {/* Time Log Modal */}
        <IonModal isOpen={showLogModal} onDidDismiss={() => setShowLogModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Catat Jam Kerja</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowLogModal(false)}>
                Batal
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem className="ion-margin-bottom">
              <IonLabel position="stacked">Durasi Jam (misal 2.5)</IonLabel>
              <IonInput
                type="number"
                value={hoursInput}
                onIonInput={(e) => setHoursInput(e.detail.value!)}
              />
            </IonItem>
            <IonItem className="ion-margin-bottom">
              <IonLabel position="stacked">Catatan Progress</IonLabel>
              <IonTextarea
                rows={4}
                value={noteInput}
                onIonInput={(e) => setNoteInput(e.detail.value!)}
                placeholder="Tuliskan pekerjaan yang diselesaikan..."
              />
            </IonItem>
                <IonButton expand="block" onClick={handleAddTimeLog} disabled={logLoading}>
                  {logLoading ? 'Menyimpan...' : 'Simpan Log Waktu'}
                </IonButton>
          </IonContent>
        </IonModal>

        {/* Custom High-Contrast Floating Toast Banner */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            width: '90%',
            maxWidth: '380px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #334155',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            animation: 'fadeInDown 0.2s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '800',
                flexShrink: 0,
              }}>✓</span>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: '#f8fafc', lineHeight: 1.3 }}>
                {toastMessage}
              </p>
            </div>
            <button
              onClick={() => setToastMessage('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '1rem',
                fontWeight: '800',
                cursor: 'pointer',
                padding: '0 4px',
              }}
            >
              ✕
            </button>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default MemberApp;
