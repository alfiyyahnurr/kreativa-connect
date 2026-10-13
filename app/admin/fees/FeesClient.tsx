'use client';

import React, { useState } from 'react';
import { FeeStructureWithItems } from '@/lib/queries/fees';

export function FeesClient({
  initialFees,
}: {
  initialFees: FeeStructureWithItems[];
}) {
  const [fees, setFees] = useState<FeeStructureWithItems[]>(initialFees);
  const [selectedCampus, setSelectedCampus] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  const campuses = ['All', ...Array.from(new Set(fees.map((f) => f.campus)))];
  const levels = ['All', ...Array.from(new Set(fees.map((f) => f.edu_level)))];

  const filtered = fees.filter((f) => {
    const campusMatch = selectedCampus === 'All' || f.campus === selectedCampus;
    const levelMatch = selectedLevel === 'All' || f.edu_level === selectedLevel;
    return campusMatch && levelMatch;
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Biaya Sekolah & Skema Pembayaran</h2>
          <p>
            Rincian resmi biaya masuk (DSP), SPP bulanan, dan program tahunan (DKT) untuk
            Kreativa Global School & SD Talenta Juara.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <select
          className="field"
          value={selectedCampus}
          onChange={(e) => setSelectedCampus(e.target.value)}
        >
          {campuses.map((c) => (
            <option key={c} value={c}>
              Kampus: {c}
            </option>
          ))}
        </select>

        <select
          className="field"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          {levels.map((l) => (
            <option key={l} value={l}>
              Jenjang: {l}
            </option>
          ))}
        </select>
      </div>

      <div className="notice" style={{ marginBottom: '20px' }}>
        <strong>Catatan Kebijakan Keuangan:</strong> Semua pembayaran yang telah dilakukan bersifat non-refundable (tidak dapat ditarik kembali). Seluruh rincian ini terhubung langsung sebagai grounding data AI Chatbot.
      </div>

      <div className="grid g2">
        {filtered.map((fs) => (
          <div key={fs.id} className="card card-pad">
            <div className="card-head">
              <div>
                <h3 style={{ color: 'var(--purple)', fontSize: '16px' }}>
                  {fs.level_name}
                </h3>
                <span className="sub">
                  Kampus {fs.campus} · TA {fs.academic_year} · {fs.scheme_name}
                </span>
              </div>
              <span className="tag purple">
                Registrasi: Rp {Number(fs.registration_fee).toLocaleString('id-ID')}
              </span>
            </div>

            <div style={{ marginTop: '14px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Komponen Biaya</th>
                    <th>Kelas / Periode</th>
                    <th>Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {fs.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <b>{item.item_name}</b>
                        {item.notes && (
                          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        {item.grade_label} ({item.period_label})
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--ink)' }}>
                        Rp {Number(item.amount).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {fs.inclusions && (
              <div style={{ marginTop: '14px', fontSize: '11px', color: 'var(--muted)' }}>
                <strong>Fasilitas Termasuk:</strong> {fs.inclusions}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
