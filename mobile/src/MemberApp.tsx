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
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import '@ionic/react/css/core.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

const API_BASE_URL = 'http://localhost:8000/api';

export const MemberApp: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Auth Form State
  const [email, setEmail] = useState('dev@bilcode.com');
  const [password, setPassword] = useState('password123');

  // Tasks & Filter State
  const [tasks, setTasks] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Time Log Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [hoursInput, setHoursInput] = useState('2.5');
  const [noteInput, setNoteInput] = useState('');
  
  const [toastMessage, setToastMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.data?.token) {
        setToken(data.data.token);
        setUser(data.data.user);
        fetchTasks(data.data.token, data.data.user.id);
      } else {
        setToastMessage(data.message || 'Login gagal.');
      }
    } catch (err) {
      setToastMessage('Gagal terhubung ke backend API.');
    }
  };

  const fetchTasks = async (authToken: string, userId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks?assignee_id=${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setToastMessage('Status task berhasil diperbarui!');
        fetchTasks(token!, user.id);
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...selectedTask, status: newStatus });
        }
      }
    } catch (err) {
      setToastMessage('Gagal memperbarui status task.');
    }
  };

  const handleAddTimeLog = async () => {
    if (!selectedTask || !hoursInput || !noteInput) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${selectedTask.id}/time-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hours: parseFloat(hoursInput),
          note: noteInput,
        }),
      });
      if (res.ok) {
        setToastMessage('Log waktu kerja berhasil dicatat!');
        setShowLogModal(false);
        setNoteInput('');
        fetchTasks(token!, user.id);
      }
    } catch (err) {
      setToastMessage('Gagal menambah log waktu.');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

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
          <IonTitle>Tugasku ({user?.name})</IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            color="light"
            onClick={() => {
              setToken(null);
              setUser(null);
            }}
          >
            Logout
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Status Filter */}
        <IonItem className="ion-margin-bottom">
          <IonLabel>Filter Status Task</IonLabel>
          <IonSelect
            value={statusFilter}
            onIonChange={(e) => setStatusFilter(e.detail.value)}
          >
            <IonSelectOption value="all">Semua Task</IonSelectOption>
            <IonSelectOption value="todo">To Do</IonSelectOption>
            <IonSelectOption value="in_progress">In Progress</IonSelectOption>
            <IonSelectOption value="review">Review</IonSelectOption>
            <IonSelectOption value="done">Done</IonSelectOption>
          </IonSelect>
        </IonItem>

        {/* Task Cards List */}
        <IonList>
          {filteredTasks.map((t) => (
            <IonCard key={t.id} button onClick={() => setSelectedTask(t)}>
              <IonCardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IonBadge color={t.category === 'backend' ? 'tertiary' : 'secondary'}>
                    {t.category}
                  </IonBadge>
                  <IonBadge
                    color={
                      t.status === 'done'
                        ? 'success'
                        : t.status === 'in_progress'
                        ? 'warning'
                        : 'medium'
                    }
                  >
                    {t.status}
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
                        {st}
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
                  ⏱ Catat Log Waktu Kerja
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
