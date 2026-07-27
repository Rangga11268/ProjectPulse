import React, { useEffect, useState } from 'react';
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
  
  const [toastMessage, setToastMessage] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);
  const [logLoading, setLogLoading] = useState(false);

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
    setLogLoading(true);
    try {
      await mobileApiRequest(`/tasks/${selectedTask.id}/time-logs`, {
        method: 'POST',
        body: JSON.stringify({
          hours: parseFloat(hoursInput),
          note: noteInput || '',
        }),
      });
      setToastMessage('Log waktu kerja berhasil dicatat!');
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

  const activeTasks = tasks.filter((t) => t.status !== 'done' && (statusFilter === 'all' || t.status === statusFilter));
  const completedTasks = tasks.filter((t) => t.status === 'done');

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
        <IonToolbar>
          <IonSegment
            value={activeSegment}
            onIonChange={(e) => setActiveSegment(e.detail.value as any)}
          >
            <IonSegmentButton value="tasks">
              <IonLabel>Aktif ({activeTasks.length})</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="history">
              <IonLabel>Riwayat Selesai ({completedTasks.length})</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="notifications">
              <IonLabel>Notifikasi</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Active Tasks Tab */}
        {activeSegment === 'tasks' && (
          <>
            <IonItem className="ion-margin-bottom">
              <IonLabel>Filter Status</IonLabel>
              <IonSelect
                value={statusFilter}
                onIonChange={(e) => setStatusFilter(e.detail.value)}
              >
                <IonSelectOption value="all">Semua Task Aktif</IonSelectOption>
                <IonSelectOption value="todo">To Do</IonSelectOption>
                <IonSelectOption value="in_progress">In Progress</IonSelectOption>
                <IonSelectOption value="review">Review</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonList>
              {activeTasks.map((t) => (
                <IonCard key={t.id} button onClick={() => setSelectedTask(t)}>
                  <IonCardHeader>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <IonBadge color={t.category === 'backend' ? 'tertiary' : 'secondary'}>
                        {categoryLabels[t.category] || t.category}
                      </IonBadge>
                      <IonBadge color={t.status === 'in_progress' ? 'warning' : 'medium'}>
                        {formatStatusLabel(t.status)}
                      </IonBadge>
                    </div>
                    <IonCardTitle style={{ fontSize: '1rem', marginTop: '8px' }}>
                      {t.title}
                    </IonCardTitle>
                    <IonCardSubtitle>Proyek: {t.project?.name || '-'}</IonCardSubtitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p>{t.description}</p>
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666' }}>
                      Estimasi: {t.estimated_hours} jam | Deadline: {t.deadline || '-'}
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </IonList>
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

        {/* Task Detail Modal */}
        <IonModal isOpen={!!selectedTask} onDidDismiss={() => setSelectedTask(null)}>
          {selectedTask && (
            <>
              <IonHeader>
                <IonToolbar color="dark">
                  <IonTitle style={{ fontSize: '0.9rem' }}>Detail Task #{selectedTask.id}</IonTitle>
                  <IonButton slot="end" fill="clear" color="light" size="small" onClick={() => setSelectedTask(null)}>
                    Tutup
                  </IonButton>
                </IonToolbar>
              </IonHeader>
              <IonContent className="ion-padding" style={{ '--background': '#fafafa' }}>
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#0369a1', background: '#e0f2fe', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                      {categoryLabels[selectedTask.category] || selectedTask.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0f172a', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                      {formatStatusLabel(selectedTask.status)}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '4px 0 8px 0', lineHeight: 1.3 }}>
                    {selectedTask.title}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    {selectedTask.description || 'Tidak ada deskripsi rincian.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Proyek</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a' }}>{selectedTask.project?.name || '-'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>Deadline</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#e11d48' }}>{selectedTask.deadline || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Status Update Control */}
                <div style={{ marginTop: '16px', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <IonLabel style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '10px' }}>
                    Update Status Pekerjaan:
                  </IonLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {['todo', 'in_progress', 'review', 'done'].map((st) => (
                      <IonButton
                        key={st}
                        size="small"
                        color={selectedTask.status === st ? 'secondary' : 'light'}
                        onClick={() => handleUpdateStatus(selectedTask.id, st)}
                        disabled={statusLoading === selectedTask.id}
                        style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '0.7rem' }}
                      >
                        {statusLoading === selectedTask.id ? '...' : formatStatusLabel(st)}
                      </IonButton>
                    ))}
                  </div>
                </div>

                <IonButton
                  expand="block"
                  color="tertiary"
                  onClick={() => setShowLogModal(true)}
                  style={{ marginTop: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  + Catat Log Jam Kerja
                </IonButton>

                {/* Log History */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', margin: 0 }}>
                      Riwayat Log Waktu:
                    </h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2563eb' }}>
                      Total: {selectedTask.time_logs?.reduce((acc: number, l: any) => acc + Number(l.hours), 0) || 0} Jam
                    </span>
                  </div>

                  {selectedTask.time_logs?.length === 0 ? (
                    <div style={{ padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                      Belum ada log waktu kerja yang dicatat.
                    </div>
                  ) : (
                    <IonList style={{ background: 'transparent', padding: 0 }}>
                      {selectedTask.time_logs?.map((log: any) => (
                        <IonItem key={log.id} style={{ '--background': '#ffffff', borderRadius: '8px', marginBottom: '6px', border: '1px solid #e2e8f0' }}>
                          <IonLabel>
                            <h2 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>{log.hours} Jam Kerja</h2>
                            <p style={{ fontSize: '0.75rem', color: '#475569' }}>{log.note || 'Tanpa catatan'}</p>
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
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

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setToastMessage('')}
        />
      </IonContent>
    </IonPage>
  );
};

export default MemberApp;
