import React from 'react';
import Link from 'next/link';
import { getOverviewMetrics } from '@/lib/queries/analytics';
import { Icon } from '@/components/Icons';


export default async function AdminOverviewPage() {
  const metrics = await getOverviewMetrics(1);

  const statCards = [
    {
      icon: 'chat',
      label: 'Total Percakapan',
      num: metrics.totalConversations,
      color: 'purple',
    },
    {
      icon: 'alert',
      label: 'Chat Baru',
      num: metrics.openNewCount,
      color: 'blue',
    },
    {
      icon: 'clock',
      label: 'Perlu Ditangani',
      num: metrics.pendingCount,
      color: 'pink',
    },
    {
      icon: 'check',
      label: 'Selesai',
      num: metrics.closedCount,
      color: 'green',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="tag blue">Baru Masuk</span>;
      case 'in_progress':
        return <span className="tag purple">Sedang Ditangani</span>;
      case 'pending_internal':
        return <span className="tag yellow">Menunggu Internal</span>;
      case 'pending_parent':
        return <span className="tag gray">Menunggu Orang Tua</span>;
      case 'needs_followup':
        return <span className="tag red">Perlu Follow-up</span>;
      case 'closed':
        return <span className="tag green">Selesai</span>;
      default:
        return <span className="tag gray">{status}</span>;
    }
  };

  return (
    <>
      {/* Hero Banner */}
      <section className="hero">
        <div>
          <span
            style={{
              fontSize: '10px',
              letterSpacing: '2px',
              fontWeight: 800,
              color: '#e5dfff',
            }}
          >
            ASSALAMU’ALAIKUM 👋
          </span>
          <h2>Selamat datang di Kreativa Connect</h2>
          <p>
            Semua komunikasi orang tua dalam satu tempat.{' '}
            <strong>Prioritas hari ini:</strong> tangani chat baru, cek
            pertanyaan yang belum selesai, dan follow-up sesuai tenggat.
          </p>
        </div>
        <div className="hero-right">
          <b>{metrics.overdueTasksCount}</b>
          <span>Follow-up melewati tenggat</span>
        </div>
      </section>

      {/* 4 Stat Cards */}
      <div className="grid g4 section-gap">
        {statCards.map((s) => (
          <div key={s.label} className="card stat">
            <div className="stat-decor" />
            <div className="stat-icon">
              <Icon name={s.icon} />
            </div>
            <div className="stat-num">
              {Number(s.num).toLocaleString('id-ID')}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 2 Main Overview Columns */}
      <div className="grid g2 section-gap">
        {/* Left: Chats needing attention */}
        <div className="card card-pad">
          <div className="card-head">
            <h3>Chat yang perlu diperhatikan</h3>
            <Link href="/admin/inbox" className="txt-btn">
              Buka Kotak Masuk →
            </Link>
          </div>
          <div className="feed-list">
            {metrics.recentAttentionChats.length > 0 ? (
              metrics.recentAttentionChats.map((c) => {
                const initials = c.contactName
                  ? c.contactName.substring(0, 2).toUpperCase()
                  : 'OR';
                return (
                  <div key={c.id} className="feed-row">
                    <div className="circle-init">{initials}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong>{c.contactName}</strong>
                        {getStatusBadge(c.status)}
                      </div>
                      <p>
                        {c.topic} · {c.assignedName} · {c.level}
                      </p>
                    </div>
                    <time>Aktif</time>
                  </div>
                );
              })
            ) : (
              <div className="list-empty">Tidak ada chat tertunda saat ini.</div>
            )}
          </div>
        </div>

        {/* Right: Breakdown by level & SLA */}
        <div className="card card-pad">
          <div className="card-head">
            <h3>Komunikasi per jenjang</h3>
            <span className="sub">Data Real-time</span>
          </div>

          {metrics.levelBreakdown.map((lb) => (
            <div key={lb.level} className="barrow">
              <span style={{ textTransform: 'capitalize' }}>
                {lb.level.replace('_', ' ')}
              </span>
              <div className="bartrack">
                <i style={{ width: `${Math.max(5, lb.percentage)}%` }} />
              </div>
              <span>{lb.count}</span>
            </div>
          ))}

          <div
            className="divider"
            style={{ borderTop: '1px solid var(--line)', margin: '20px 0' }}
          />

          <div className="kpi-line">
            <span>
              Respons manusia sesuai target ({metrics.slaTargetMinutes} menit)
            </span>
            <b>{metrics.slaPercent}%</b>
          </div>
          <div className="progress" style={{ margin: '9px 0' }}>
            <span style={{ width: `${metrics.slaPercent}%` }} />
          </div>
          <p className="footnote">
            Persentase dihitung dari percakapan dengan first response time tercatat.
          </p>
        </div>
      </div>

      {/* 3 Shortcut Cards */}
      <div className="grid g3 section-gap">
        <div className="card card-pad">
          <div className="card-head">
            <h3>Butuh follow-up</h3>
            <span className="tag red">
              {metrics.overdueTasksCount} terlambat
            </span>
          </div>
          <p className="sub">
            Jangan hanya membalas chat. Pastikan permintaan orang tua selesai hingga tuntas.
          </p>
          <Link href="/admin/tasks" className="button small">
            Lihat Daftar Follow-up <Icon name="arrow" />
          </Link>
        </div>

        <div className="card card-pad">
          <div className="card-head">
            <h3>Admission</h3>
            <span className="tag purple">Jalur Pendaftaran</span>
          </div>
          <p className="sub">
            Pantau pendaftar dari registrasi, seleksi, pengumuman, sampai pembayaran pertama.
          </p>
          <Link href="/admin/admission" className="button small">
            Buka Proses Admission <Icon name="arrow" />
          </Link>
        </div>

        <div className="card card-pad">
          <div className="card-head">
            <h3>Coba chatbot</h3>
            <span className="tag blue">Simulasi</span>
          </div>
          <p className="sub">
            Uji alur percakapan WhatsApp & Live Chat seperti pengalaman langsung orang tua.
          </p>
          <Link href="/admin/simulator" className="button small">
            Mulai Simulasi <Icon name="arrow" />
          </Link>
        </div>
      </div>

      <p className="footnote">
        Kreativa Connect — Multi-tenant CRM untuk Kreativa Global School dan SD Talenta Juara.
      </p>
    </>
  );
}
