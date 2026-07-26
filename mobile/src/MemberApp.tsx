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

  // Check persistent login on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('mobile_token');
    const savedUser = localStorage.getItem('mobile_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchTasks(parsedUser.id);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const formatDateStr = (rawDate: string) => {
    if (!rawDate) return 'Hari ini';
    return rawDate.split('T')[0];
  };

  const generateInAppNotifications = (taskList: any[]) => {
    const notifs: any[] = [];

    taskList.forEach((t) => {
      if (t.status !== 'done') {
        notifs.push({
          id: `new-${t.id}`,
          title: 'Tugas Baru Di-assign',
          message: `Kamu mendapatkan tugas baru: "${t.title}" pada proyek ${t.project?.name || ''}.`,
          date: formatDateStr(t.created_at),
          type: 'info',
        });
      }

      if (t.deadline && t.status !== 'done') {
        notifs.push({
          id: `deadline-${t.id}`,
          title: 'Pengingat Deadline Tugas',
          message: `Tugas "${t.title}" jatuh tempo pada ${t.deadline}. Segera perbarui progres!`,
          date: t.deadline,
          type: 'warning',
        });
      }
    });

    setNotifications(notifs);
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
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
    }
  };

  const handleAddTimeLog = async () => {
    if (!selectedTask || !hoursInput || !noteInput) return;
    try {
      await mobileApiRequest(`/tasks/${selectedTask.id}/time-logs`, {
        method: 'POST',
        body: JSON.stringify({
          hours: parseFloat(hoursInput),
          note: noteInput,
        }),
      });
      setToastMessage('Log waktu kerja berhasil dicatat!');
      setShowLogModal(false);
      setNoteInput('');
      fetchTasks(user.id);
    } catch (err: any) {
      setToastMessage(err.message || 'Gagal menambah log waktu.');
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
          <IonToolbar color="primary">
            <IonTitle>ProjectPulse Member</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Member App Login</IonCardTitle>
              <IonCardSubtitle>Aplikasi Developer & Desainer Bilcode</IonCardSubtitle>
            </IonCardHeader>
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
                <IonButton expand="block" type="submit" className="ion-margin-top">
                  Masuk ke App
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
        <IonToolbar color="primary">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '12px' }}>
            <img src="/billcodeLogo.webp" alt="Bilcode Logo" style={{ height: '28px', width: 'auto' }} />
            <IonTitle style={{ paddingLeft: 0 }}>Tugasku ({user?.name})</IonTitle>
          </div>
          <IonButton slot="end" fill="clear" color="light" onClick={handleLogout}>
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
                        {t.category}
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
                <IonToolbar>
                  <IonTitle>Detail Task #{selectedTask.id}</IonTitle>
                  <IonButton slot="end" fill="clear" onClick={() => setSelectedTask(null)}>
                    Tutup
                  </IonButton>
                </IonToolbar>
              </IonHeader>
              <IonContent className="ion-padding">
                <h2>{selectedTask.title}</h2>
                <p style={{ color: '#666' }}>{selectedTask.description}</p>

                <div style={{ margin: '20px 0' }}>
                  <IonLabel><strong>Update Status Progress:</strong></IonLabel>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {['todo', 'in_progress', 'review', 'done'].map((st) => (
                      <IonButton
                        key={st}
                        size="small"
                        fill={selectedTask.status === st ? 'solid' : 'outline'}
                        onClick={() => handleUpdateStatus(selectedTask.id, st)}
                      >
                        {formatStatusLabel(st)}
                      </IonButton>
                    ))}
                  </div>
                </div>

                <IonButton
                  expand="block"
                  color="tertiary"
                  onClick={() => setShowLogModal(true)}
                  className="ion-margin-top"
                >
                  Catat Log Waktu Kerja
                </IonButton>

                {/* Log History */}
                <h3 style={{ marginTop: '24px' }}>Riwayat Log Waktu:</h3>
                {selectedTask.time_logs?.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#888' }}>Belum ada log waktu.</p>
                ) : (
                  <IonList>
                    {selectedTask.time_logs?.map((log: any) => (
                      <IonItem key={log.id}>
                        <IonLabel>
                          <h2>{log.hours} Jam</h2>
                          <p>{log.note}</p>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                )}
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
            <IonButton expand="block" onClick={handleAddTimeLog}>
              Simpan Log Waktu
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
