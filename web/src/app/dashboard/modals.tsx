'use client';

import { FormEvent, useState, useEffect } from 'react';

export function ClientModal({
  show, onClose, form, setForm, editing, onSave, loading,
}: {
  show: boolean; onClose: () => void; form: any; setForm: (f: any) => void;
  editing: any; onSave: (e: FormEvent) => Promise<void>; loading: boolean;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 border border-[var(--color-paper-3)]">
        <div className="flex items-center justify-between border-b border-[var(--color-paper-3)] pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
            {editing ? 'Edit Data Klien' : 'Tambah Klien Baru'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
        </div>
        <form onSubmit={onSave} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Nama Klien</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full text-xs p-2 border rounded" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Perusahaan</label>
            <input type="text" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full text-xs p-2 border rounded" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Contact Person</label>
            <input type="text" required value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="w-full text-xs p-2 border rounded" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full text-xs p-2 border rounded" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded mt-2 disabled:opacity-50">
            {loading ? 'Menyimpan...' : editing ? 'Update Klien' : 'Simpan Klien'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function ProjectModal({
  show, onClose, form, setForm, editing, onSave, loading, clients,
}: {
  show: boolean; onClose: () => void; form: any; setForm: (f: any) => void;
  editing: any; onSave: (e: FormEvent) => Promise<void>; loading: boolean; clients: any[];
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 border border-[var(--color-paper-3)]">
        <div className="flex items-center justify-between border-b border-[var(--color-paper-3)] pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
            {editing ? 'Edit Data Proyek' : 'Buat Proyek Baru'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
        </div>
        <form onSubmit={onSave} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Klien Terkait</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="w-full text-xs p-2 border rounded">
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Nama Proyek</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full text-xs p-2 border rounded" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Brief Klien</label>
            <textarea rows={3} value={form.client_brief} onChange={(e) => setForm({ ...form, client_brief: e.target.value })} placeholder="Deskripsikan persyaratan klien..." className="w-full text-xs p-2 border rounded" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Deadline</label>
            <input type="date" required value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full text-xs p-2 border rounded" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded mt-2 disabled:opacity-50">
            {loading ? 'Menyimpan...' : editing ? 'Update Proyek' : 'Simpan Proyek'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function TaskModal({
  show, onClose, form, setForm, editing, onSave, loading, projects, members,
}: {
  show: boolean; onClose: () => void; form: any; setForm: (f: any) => void;
  editing: any; onSave: (e: FormEvent) => Promise<void>; loading: boolean;
  projects: any[]; members: any[];
}) {
  const [activeTab, setActiveTab] = useState<'detail' | 'comments'>('detail');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [editingComment, setEditingComment] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (show && editing?.id && activeTab === 'comments') {
      fetchComments();
    }
  }, [show, editing?.id, activeTab]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/api/tasks/${editing.id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setComments(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      if (editingComment) {
        const res = await fetch(`http://localhost:8000/api/comments/${editingComment.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newComment })
        });
        const data = await res.json();
        if (data.status === 'success') {
          setNewComment('');
          setEditingComment(null);
          fetchComments();
        }
      } else {
        const res = await fetch(`http://localhost:8000/api/tasks/${editing.id}/comments`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newComment })
        });
        const data = await res.json();
        if (data.status === 'success') {
          setNewComment('');
          fetchComments();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchComments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuoteComment = (comment: any) => {
    const quoteText = `> **${comment.user?.name}** menulis:\n> ${comment.content.split('\n').join('\n> ')}\n\n`;
    setNewComment((prev) => prev ? prev + '\n' + quoteText : quoteText);
    setEditingComment(null);
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 border border-[var(--color-paper-3)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--color-paper-3)] pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">
            {editing ? 'Detail Task' : 'Tambah Task Baru'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
        </div>

        {editing && (
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('detail')}
              className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition ${activeTab === 'detail' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Detail Task
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`pb-2 px-4 text-xs font-bold uppercase tracking-wider transition ${activeTab === 'comments' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Diskusi & Komentar
            </button>
          </div>
        )}

        {activeTab === 'detail' && (
          <form onSubmit={onSave} className="space-y-3 mt-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Proyek Target</label>
              <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="w-full text-xs p-2 border rounded" disabled={!!editing}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Assignee Member</label>
              <select value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })} className="w-full text-xs p-2 border rounded">
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Judul Task</label>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full text-xs p-2 border rounded" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Kategori & Status</label>
              <div className="grid grid-cols-2 gap-2">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full text-xs p-2 border rounded font-semibold">
                  <option value="backend">Backend</option>
                  <option value="frontend">Frontend</option>
                      <option value="design">Design</option>
                  <option value="QA">QA</option>
                </select>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full text-xs p-2 border rounded font-semibold">
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Estimasi Jam Kerja</label>
              <input type="number" required min={1} value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: Number(e.target.value) })} className="w-full text-xs p-2 border rounded" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded mt-2 disabled:opacity-50">
              {loading ? 'Menyimpan...' : editing ? 'Update Task' : 'Simpan Task'}
            </button>
          </form>
        )}

        {activeTab === 'comments' && editing && (
          <div className="space-y-4 mt-4">
            <div className="max-h-60 overflow-y-auto space-y-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
              {loadingComments ? (
                <div className="text-center text-xs text-slate-500 py-4">Memuat komentar...</div>
              ) : comments.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-4">Belum ada diskusi untuk task ini.</div>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className="bg-white p-3 rounded shadow-xs border border-slate-100 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex-shrink-0 flex items-center justify-center font-bold text-xs uppercase">
                      {c.user?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-slate-800 text-[11px]">{c.user?.name}</span>
                        <span className="text-[9px] text-slate-400">{new Date(c.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <p className="text-slate-600 text-xs whitespace-pre-wrap">{c.content}</p>
                      
                      <div className="mt-2 flex gap-2 justify-end">
                        <button onClick={() => handleQuoteComment(c)} className="text-[10px] text-blue-600 hover:underline">Quote</button>
                        {(currentUser?.role === 'admin' || currentUser?.id === c.user_id) && (
                          <>
                            <button onClick={() => { setEditingComment(c); setNewComment(c.content); }} className="text-[10px] text-slate-600 hover:underline">Edit</button>
                            <button onClick={() => { 
                              setConfirmDelete({
                                message: 'Apakah Anda yakin ingin menghapus komentar ini?',
                                onConfirm: () => {
                                  handleDeleteComment(c.id);
                                  setConfirmDelete(null);
                                }
                              });
                            }} className="text-[10px] text-red-600 hover:underline">Hapus</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                required
                disabled={isSubmittingComment}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={editingComment ? "Edit komentar..." : "Ketik komentar..."}
                className="flex-1 text-xs p-2 border border-slate-300 rounded focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
              <button type="submit" disabled={isSubmittingComment || !newComment.trim()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isSubmittingComment ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Proses...
                  </>
                ) : (
                  editingComment ? 'Update' : 'Kirim'
                )}
              </button>
              {editingComment && !isSubmittingComment && (
                <button type="button" onClick={() => { setEditingComment(null); setNewComment(''); }} className="px-3 py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase rounded hover:bg-slate-300 transition">
                  Batal
                </button>
              )}
            </form>
          </div>
        )}
      </div>
      <ConfirmDialog dialog={confirmDelete} onClose={() => setConfirmDelete(null)} />
    </div>
  );
}

export function AiTaskModal({
  show, onClose, projects, selectedProjectId, setSelectedProjectId,
  briefInput, setBriefInput, onGenerate, aiLoading, aiTasks,
  onUpdateField, onSaveTask, onDeleteTask, savingAi, members,
}: {
  show: boolean; onClose: () => void; projects: any[];
  selectedProjectId: number | null; setSelectedProjectId: (id: number | null) => void;
  briefInput: string; setBriefInput: (v: string) => void;
  onGenerate: () => Promise<void>; aiLoading: boolean;
  aiTasks: any[]; onUpdateField: (idx: number, field: string, val: any) => void;
  onSaveTask: (idx: number) => Promise<void>; onDeleteTask: (idx: number) => void; savingAi: number | null; members: any[];
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 border border-[var(--color-paper-3)]">
        <div className="flex items-center justify-between border-b border-[var(--color-paper-3)] pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]">AI Task Breakdown Brief</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Pilih Proyek Target</label>
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
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <label className="block text-[11px] font-bold uppercase text-[var(--color-ink-muted)] mb-1">Brief Persyaratan Klien</label>
          <textarea
            rows={4} value={briefInput}
            onChange={(e) => setBriefInput(e.target.value)}
            placeholder="Tempelkan brief persyaratan dari klien di sini..."
            className="w-full text-xs p-2.5 border border-[var(--color-paper-3)] rounded focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <button
          onClick={onGenerate}
          disabled={aiLoading || !briefInput}
          className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider rounded transition disabled:opacity-50"
        >
          {aiLoading ? 'Memproses Brief via LLM API...' : 'Jalankan Breakdown Brief'}
        </button>
        {aiTasks.length > 0 && (
          <div className="space-y-3 mt-4 max-h-60 overflow-y-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] block">Edit & Sesuaikan Hasil Rekomendasi:</span>
            {aiTasks.map((t, idx) => (
              <div key={idx} className="p-3 border border-[var(--color-paper-3)] rounded text-xs bg-[var(--color-paper)] space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={t.title} onChange={(e) => onUpdateField(idx, 'title', e.target.value)} className="col-span-2 p-1.5 border rounded font-semibold text-[var(--color-ink)]" />
                  <select value={t.category} onChange={(e) => onUpdateField(idx, 'category', e.target.value)} className="p-1.5 border rounded font-bold uppercase text-[10px]">
                    <option value="backend">backend</option>
                    <option value="frontend">frontend</option>
                    <option value="design">design</option>
                    <option value="QA">QA</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <select value={t.assignee_id || ''} onChange={(e) => onUpdateField(idx, 'assignee_id', Number(e.target.value) || null)} className="p-1.5 border rounded font-semibold flex-1">
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <input type="number" value={t.estimated_hours} onChange={(e) => onUpdateField(idx, 'estimated_hours', e.target.value ? Number(e.target.value) : '')} className="w-20 p-1.5 border rounded" />
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSaveTask(idx)}
                      disabled={savingAi !== null}
                      className={`px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition ${savingAi === idx ? 'bg-green-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800 text-white'}`}
                    >
                      {savingAi === idx ? 'Menyimpan...' : 'Simpan Task'}
                    </button>
                    <button
                      onClick={() => onDeleteTask(idx)}
                      disabled={savingAi !== null}
                      className="px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition bg-rose-100 hover:bg-rose-200 text-rose-700"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  dialog, onClose,
}: {
  dialog: { message: string; onConfirm: () => void } | null;
  onClose: () => void;
}) {
  if (!dialog) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-[var(--color-paper-3)] text-center space-y-5">
        <div className="w-12 h-12 mx-auto bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-[var(--color-ink)]">{dialog.message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[var(--color-paper-3)] text-[var(--color-ink-muted)] hover:bg-[var(--color-paper)] transition">Batal</button>
          <button onClick={dialog.onConfirm} className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition">Ya, Hapus</button>
        </div>
      </div>
    </div>
  );
}
