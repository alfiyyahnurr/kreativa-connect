import React from 'react';
import { getReportsMetrics } from '@/lib/queries/analytics';


export default async function ReportsPage() {
  const metrics = await getReportsMetrics(1);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Laporan Layanan & Performa Tim</h2>
          <p>Pantau beban kerja per PIC, volume chat per kanal, dan konversi alur pendaftaran.</p>
        </div>
      </div>

      <div className="grid g2">
        {/* Kanal Volume */}
        <div className="card card-pad">
          <div className="card-head">
            <h3>Volume Percakapan per Nomor / Kanal</h3>
            <span className="sub">Data Real-time</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Kanal</th>
                  <th>Tipe</th>
                  <th>Total Percakapan</th>
                </tr>
              </thead>
              <tbody>
                {metrics.channelsVolume.map((ch: any) => (
                  <tr key={ch.channel_name}>
                    <td>
                      <b>{ch.channel_name}</b>
                    </td>
                    <td>
                      <span className="tag blue">{ch.channel_type}</span>
                    </td>
                    <td>
                      <b>{ch.count}</b> chat
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tim Workload */}
        <div className="card card-pad">
          <div className="card-head">
            <h3>Beban Kerja Staff & PIC</h3>
            <span className="sub">Penyelesaian Percakapan</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Staff</th>
                  <th>Peran</th>
                  <th>Aktif</th>
                  <th>Selesai</th>
                </tr>
              </thead>
              <tbody>
                {metrics.teamWorkload.map((tw: any) => (
                  <tr key={tw.user_name}>
                    <td>
                      <b>{tw.user_name}</b>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {tw.role.replace('_', ' ')}
                    </td>
                    <td>
                      <span className="tag purple">{tw.active_count}</span>
                    </td>
                    <td>
                      <span className="tag green">{tw.completed_count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card card-pad section-gap">
        <div className="card-head">
          <h3>Statistik Funnel Admission</h3>
          <span className="sub">Jumlah pendaftar aktif per tahapan seleksi</span>
        </div>
        <div className="grid g4" style={{ marginTop: '16px' }}>
          {metrics.admissionFunnel.map((af: any) => (
            <div
              key={af.stage}
              style={{
                background: '#f8f8fd',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'capitalize' }}>
                {af.stage.replace('_', ' ')}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px' }}>
                {af.count} <span style={{ fontSize: '12px', fontWeight: 500 }}>calon siswa</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
