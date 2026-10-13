'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/Icons';

interface ConversationItem {
  id: string;
  school_id: string;
  contact_id: string;
  channel_id: string;
  assigned_user_id: string | null;
  topic: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  contact_name: string;
  contact_phone: string;
  contact_type: string;
  lead_temp: string | null;
  edu_level: string | null;
  channel_name: string;
  channel_type: string;
  assigned_name: string | null;
  last_message_content: string | null;
  last_message_time: string | null;
  last_message_role: string | null;
}

interface MessageItem {
  id: string;
  conversation_id: string;
  sent_by_user_id: string | null;
  role: 'parent' | 'agent' | 'bot' | 'internal_note';
  source: 'human' | 'ai' | 'system';
  content: string;
  is_visible_to_parent: boolean;
  created_at: string;
  sender_name?: string | null;
}

const STAT_MAP: Record<string, [string, string]> = {
  new: ['blue', 'Baru Masuk'],
  in_progress: ['purple', 'Sedang Ditangani'],
  pending_internal: ['yellow', 'Menunggu Internal'],
  pending_parent: ['gray', 'Menunggu Orang Tua'],
  needs_followup: ['red', 'Perlu Follow-up'],
  closed: ['green', 'Selesai'],
};

export function InboxClient({
  initialConversations,
}: {
  initialConversations: ConversationItem[];
}) {
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string>(initialConversations[0]?.id || '');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  // Search & filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');

  // Modal states
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');

  const chatBodyRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedId);

  // Fetch messages when selectedId changes
  useEffect(() => {
    if (!selectedId) return;

    let isMounted = true;
    setLoadingMessages(true);

    fetch(`/api/conversations/${selectedId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.messages) {
          setMessages(data.messages);
          setLoadingMessages(false);
          setTimeout(() => {
            if (chatBodyRef.current) {
              chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
            }
          }, 50);
        }
      })
      .catch((err) => {
        console.error('Failed to load messages:', err);
        setLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedId]);

  // Handle reply submit
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedId || sending) return;

    setSending(true);
    const content = replyText.trim();
    setReplyText('');

    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, role: 'agent' }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);

        // Update list snippet
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedId
              ? {
                  ...c,
                  last_message_content: content,
                  last_message_role: 'agent',
                  status: c.status === 'new' ? 'in_progress' : c.status,
                  updated_at: new Date().toISOString(),
                }
              : c
          )
        );

        setTimeout(() => {
          if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
          }
        }, 50);
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  };

  // Handle Internal Note save
  const handleSaveNote = async () => {
    if (!noteText.trim() || !selectedId) return;
    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteText.trim(), role: 'internal_note' }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNoteText('');
        setShowNoteModal(false);
      }
    } catch (err) {
      console.error('Failed to add internal note:', err);
    }
  };

  // Handle Follow-up Task save
  const handleSaveTask = async () => {
    if (!taskTitle.trim() || !taskDue || !selectedConv) return;
    try {
      const res = await fetch(`/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: selectedConv.school_id,
          contactId: selectedConv.contact_id,
          conversationId: selectedConv.id,
          title: taskTitle.trim(),
          dueAt: new Date(taskDue).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTaskTitle('');
        setTaskDue('');
        setShowTaskModal(false);
        alert('Tindak lanjut berhasil ditambahkan ke daftar tugas!');
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  // Handle updating conversation status
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, status: newStatus } : c))
    );
    await fetch(`/api/conversations/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  // Handle updating conversation priority
  const handlePriorityChange = async (newPriority: string) => {
    if (!selectedId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, priority: newPriority } : c))
    );
    await fetch(`/api/conversations/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: newPriority }),
    });
  };

  // Filtered conversation list
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      !search ||
      [c.contact_name, c.contact_phone, c.topic, c.channel_name]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    const matchesChannel = !channelFilter || c.channel_name === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const formatAge = (dateStr: string) => {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
    if (diff < 60) return `${diff} mnt lalu`;
    if (diff < 1440) return `${Math.floor(diff / 60)} jam lalu`;
    return `${Math.floor(diff / 1440)} hari lalu`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Kotak Masuk</h2>
          <p>Percakapan dari seluruh kanal, dengan PIC dan status yang jelas.</p>
        </div>
        <div>
          <button
            className="button"
            type="button"
            onClick={() => setShowTaskModal(true)}
            disabled={!selectedConv}
          >
            <Icon name="clock" /> Tambah Follow-up
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar">
        <input
          className="field search"
          placeholder="Cari orang tua atau topik..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="field"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Semua status</option>
          <option value="new">Baru Masuk</option>
          <option value="in_progress">Sedang Ditangani</option>
          <option value="pending_internal">Menunggu Internal</option>
          <option value="pending_parent">Menunggu Orang Tua</option>
          <option value="needs_followup">Perlu Follow-up</option>
          <option value="closed">Selesai</option>
        </select>
        <select
          className="field"
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
        >
          <option value="">Semua kanal</option>
          <option value="Admission">Admission</option>
          <option value="KG PRO">KG PRO</option>
          <option value="Web Live Chat">Web Live Chat</option>
          <option value="Admission Talenta">Admission Talenta</option>
        </select>
        <button
          className="button small"
          type="button"
          onClick={() => {
            setSearch('');
            setStatusFilter('');
            setChannelFilter('');
          }}
        >
          Hapus filter
        </button>
      </div>

      {/* 3-Column Layout */}
      <div className="inbox-layout">
        {/* Column 1: Conversations List */}
        <div className="card inbox-list">
          <div className="list-head">
            <strong>Semua Percakapan</strong>
            <span className="tag purple">{conversations.length} chat</span>
          </div>
          <div className="scroll-list">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((c) => {
                const initials = c.contact_name
                  ? c.contact_name.substring(0, 2).toUpperCase()
                  : 'OR';
                const isSelected = c.id === selectedId;
                const statusMeta = STAT_MAP[c.status] || ['gray', c.status];

                return (
                  <div
                    key={c.id}
                    className={`conv-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className="circle-init">{initials}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                        <div className="person">{c.contact_name}</div>
                        <span className="t">{formatAge(c.updated_at)}</span>
                      </div>
                      <div className="snippet">
                        {c.last_message_content || 'Belum ada pesan'}
                      </div>
                      <div className="small-badges">
                        <span className={`tag ${statusMeta[0]}`}>{statusMeta[1]}</span>
                        {c.priority === 'high' && <span className="tag red">Penting</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="list-empty">Tidak ada chat yang cocok dengan filter.</div>
            )}
          </div>
        </div>

        {/* Column 2: Chat Conversation Thread */}
        <div className="card conv-panel">
          {selectedConv ? (
            <>
              <div className="chat-head">
                <div className="circle-init">
                  {selectedConv.contact_name
                    ? selectedConv.contact_name.substring(0, 2).toUpperCase()
                    : 'OR'}
                </div>
                <div>
                  <h3>{selectedConv.contact_name}</h3>
                  <p>
                    {selectedConv.topic || 'Inquiry'} · {selectedConv.channel_name}
                  </p>
                </div>
                <div className="head-actions">
                  <button
                    className="button small"
                    type="button"
                    onClick={() => setShowNoteModal(true)}
                  >
                    <Icon name="plus" /> Catatan
                  </button>
                  <button
                    className="button small"
                    type="button"
                    onClick={() => setShowTaskModal(true)}
                  >
                    <Icon name="clock" /> Follow-up
                  </button>
                </div>
              </div>

              <div className="chat-body" ref={chatBodyRef}>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                    Memuat pesan...
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAgent = m.role === 'agent';
                    const isInternal = m.role === 'internal_note';
                    const timeFormatted = new Date(m.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={m.id}
                        className={`msg ${isAgent ? 'agent' : ''} ${isInternal ? 'internal' : ''}`}
                      >
                        {m.content}
                        <small>
                          {isInternal ? 'Catatan internal · ' : ''}
                          {m.sender_name ? `${m.sender_name} · ` : ''}
                          {timeFormatted}
                        </small>
                      </div>
                    );
                  })
                )}
              </div>

              <form className="chat-send" onSubmit={handleSendReply}>
                <input
                  className="field"
                  placeholder="Tulis balasan pesan WhatsApp / Live Chat..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={sending}
                  required
                />
                <button className="button primary" type="submit" disabled={sending}>
                  <Icon name="send" /> Kirim
                </button>
              </form>
            </>
          ) : (
            <div className="empty-illustration">
              <Icon name="chat" />
              <p>Pilih percakapan untuk melihat pesan.</p>
            </div>
          )}
        </div>

        {/* Column 3: Context & Action Panel */}
        <div className="card context-panel">
          {selectedConv ? (
            <>
              <h4>Detail & Penanganan</h4>
              <div className="mini-detail">
                <span className="muted">Orang tua</span>
                <strong>{selectedConv.contact_name}</strong>
              </div>
              <div className="mini-detail">
                <span className="muted">Telepon</span>
                <strong>{selectedConv.contact_phone}</strong>
              </div>
              <div className="mini-detail">
                <span className="muted">Kategori</span>
                <strong>
                  {selectedConv.contact_type === 'active_parent'
                    ? 'Orang Tua Aktif'
                    : 'Calon Orang Tua'}
                </strong>
              </div>
              <div className="mini-detail">
                <span className="muted">Jenjang</span>
                <strong style={{ textTransform: 'capitalize' }}>
                  {selectedConv.edu_level?.replace('_', ' ') || '—'}
                </strong>
              </div>

              <div className="divider" />

              <div>
                <label>Status chat</label>
                <select
                  className="field full"
                  value={selectedConv.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="new">Baru Masuk</option>
                  <option value="in_progress">Sedang Ditangani</option>
                  <option value="pending_internal">Menunggu Konfirmasi Internal</option>
                  <option value="pending_parent">Menunggu Respons Orang Tua</option>
                  <option value="needs_followup">Perlu Follow-up</option>
                  <option value="closed">Selesai</option>
                </select>
              </div>

              <div>
                <label>Prioritas</label>
                <select
                  className="field full"
                  value={selectedConv.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                >
                  <option value="low">Biasa</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                </select>
              </div>

              <div className="divider" />

              <div className="muted-card">
                <strong style={{ color: 'var(--ink)' }}>Catatan penting</strong>
                <div style={{ marginTop: '5px' }}>
                  Chat dianggap <b>selesai</b> hanya setelah kebutuhan orang tua sudah ditangani, bukan sekadar dibalas.
                </div>
              </div>
            </>
          ) : (
            <span className="muted">Belum ada percakapan dipilih.</span>
          )}
        </div>
      </div>

      {/* Internal Note Modal */}
      {showNoteModal && (
        <div className="modal-wrap" onClick={() => setShowNoteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Catatan Internal</h3>
              <button
                className="button ghost small"
                type="button"
                onClick={() => setShowNoteModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                Catatan untuk tim (tidak terlihat oleh orang tua)
              </label>
              <textarea
                className="field full"
                rows={4}
                placeholder="Contoh: Menunggu keputusan Finance mengenai perpanjangan waktu pembayaran."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button
                className="button"
                type="button"
                onClick={() => setShowNoteModal(false)}
              >
                Batal
              </button>
              <button
                className="button primary"
                type="button"
                onClick={handleSaveNote}
              >
                Tambahkan Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Task Modal */}
      {showTaskModal && (
        <div className="modal-wrap" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Tindak Lanjut</h3>
              <button
                className="button ghost small"
                type="button"
                onClick={() => setShowTaskModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Hal yang harus ditindaklanjuti *</label>
                <input
                  className="field full"
                  placeholder="Contoh: Cek status Confirmation Letter ke Admission"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>Tenggat (tanggal & jam) *</label>
                <input
                  type="datetime-local"
                  className="field full"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="button"
                type="button"
                onClick={() => setShowTaskModal(false)}
              >
                Batal
              </button>
              <button
                className="button primary"
                type="button"
                onClick={handleSaveTask}
              >
                Simpan Tindak Lanjut
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
