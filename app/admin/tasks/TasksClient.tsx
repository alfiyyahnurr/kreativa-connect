'use client';

import React, { useState } from 'react';
import { TaskItem } from '@/lib/queries/tasks';

export function TasksClient({
  initialTasks,
}: {
  initialTasks: TaskItem[];
}) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  const filtered = tasks.filter((t) => (tab === 'active' ? !t.is_done : t.is_done));
  const overdueCount = tasks.filter((t) => !t.is_done && t.is_overdue).length;

  const handleToggleDone = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_done: nextStatus, is_overdue: false } : t))
    );

    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isDone: nextStatus }),
    });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Tindak Lanjut</h2>
          <p>Pastikan setiap janji follow-up kepada orang tua diselesaikan tepat waktu.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <button
            type="button"
            className={tab === 'active' ? 'active' : ''}
            onClick={() => setTab('active')}
          >
            Aktif ({tasks.filter((t) => !t.is_done).length})
          </button>
          <button
            type="button"
            className={tab === 'completed' ? 'active' : ''}
            onClick={() => setTab('completed')}
          >
            Selesai ({tasks.filter((t) => t.is_done).length})
          </button>
        </div>

        {overdueCount > 0 && (
          <span className="tag red" style={{ marginLeft: 'auto' }}>
            {overdueCount} tugas melewati tenggat
          </span>
        )}
      </div>

      <div className="card card-pad">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>✓</th>
                <th>Tugas / Tindak Lanjut</th>
                <th>Orang Tua</th>
                <th>PIC</th>
                <th>Tenggat Waktu</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((t) => {
                  const dueDate = new Date(t.due_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={t.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={t.is_done}
                          onChange={() => handleToggleDone(t.id, t.is_done)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <b style={{ textDecoration: t.is_done ? 'line-through' : 'none' }}>
                          {t.title}
                        </b>
                      </td>
                      <td>
                        {t.contact_name} ({t.contact_phone})
                      </td>
                      <td>{t.assigned_name || 'Admission'}</td>
                      <td>
                        <span style={{ color: t.is_overdue ? '#d64270' : 'inherit', fontWeight: t.is_overdue ? 700 : 400 }}>
                          {dueDate}
                        </span>
                      </td>
                      <td>
                        {t.is_done ? (
                          <span className="tag green">Selesai</span>
                        ) : t.is_overdue ? (
                          <span className="tag red">Terlambat</span>
                        ) : (
                          <span className="tag purple">Dalam Proses</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                    Tidak ada tugas dalam kategori ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
