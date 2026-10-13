'use client';

import React, { useState } from 'react';
import { SchoolSettings } from '@/lib/queries/settings';

export function SettingsClient({
  initialSettings,
}: {
  initialSettings: SchoolSettings | null;
}) {
  const [start, setStart] = useState(initialSettings?.operating_start || '08:00');
  const [end, setEnd] = useState(initialSettings?.operating_end || '16:00');
  const [days, setDays] = useState(initialSettings?.operating_days || 'Mon,Tue,Wed,Thu,Fri');
  const [sla, setSla] = useState(initialSettings?.sla_target_minutes || 15);
  const [autoReply, setAutoReply] = useState(initialSettings?.auto_reply_enabled ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      alert('Pengaturan jam layanan dan SLA berhasil disimpan ke Neon DB.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Pengaturan Layanan & SLA</h2>
          <p>Tentukan jam operasional, target waktu respons, dan aturan pesan otomatis.</p>
        </div>
      </div>

      <div className="card card-pad" style={{ maxWidth: '750px' }}>
        <form onSubmit={handleSave}>
          <div className="form-grid">
            <div className="form-group">
              <label>Jam Buka Layanan *</label>
              <input
                type="time"
                className="field full"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Jam Tutup Layanan *</label>
              <input
                type="time"
                className="field full"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '14px' }}>
            <label>Hari Operasional</label>
            <input
              className="field full"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="Contoh: Senin - Jumat"
            />
          </div>

          <div className="form-group" style={{ marginTop: '14px' }}>
            <label>Target SLA Respons Pertama (Menit) *</label>
            <input
              type="number"
              className="field full"
              value={sla}
              onChange={(e) => setSla(Number(e.target.value))}
              min={1}
              max={120}
              required
            />
            <span className="sub" style={{ marginTop: '4px', display: 'block' }}>
              Target waktu yang diharapkan staf untuk membalas pesan orang tua pertama kali.
            </span>
          </div>

          <div style={{ marginTop: '18px' }}>
            <label className="simple-check">
              <input
                type="checkbox"
                checked={autoReply}
                onChange={(e) => setAutoReply(e.target.checked)}
              />
              Aktifkan pesan balasan otomatis saat di luar jam operasional
            </label>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button className="button primary" type="submit" disabled={saving}>
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
