'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/Icons';

interface SimMessage {
  who: 'bot' | 'parent';
  text: string;
}

interface SimOption {
  label: string;
  nextStep: string;
}

const SCENARIOS = [
  { id: 'new', label: 'Calon Orang Tua Baru' },
  { id: 'accepted', label: 'Pendaftar Accepted' },
  { id: 'existing', label: 'Orang Tua Aktif Primary' },
];

export function SimulatorClient() {
  const [activeScenario, setActiveScenario] = useState('new');
  const [messages, setMessages] = useState<SimMessage[]>([
    {
      who: 'bot',
      text: "Assalamu'alaikum Warahmatullahi Wabarakatuh.\nSelamat datang di Layanan Informasi Kreativa Global School.\n\nBolehkah kami mengetahui kebutuhan Bapak/Ibu hari ini?",
    },
  ]);
  const [options, setOptions] = useState<SimOption[]>([
    { label: 'Informasi Pendaftaran Siswa Baru (PPDB)', nextStep: 'ppdb' },
    { label: 'Rincian Biaya Sekolah & Skema Pembayaran', nextStep: 'fees' },
    { label: 'Jadwal School Visit / Trial Class', nextStep: 'visit' },
    { label: 'Hubungkan dengan Tim Admission', nextStep: 'human' },
  ]);
  const [auditLog, setAuditLog] = useState<string[]>([
    'Bot menyapa dengan salam resmi Islami dan menampilkan menu utama.',
  ]);

  const handleSelectOption = (opt: SimOption) => {
    // 1. User choice
    const userMsg: SimMessage = { who: 'parent', text: opt.label };

    // 2. Bot reply based on step
    let botReply = '';
    let nextOpts: SimOption[] = [];
    let logText = '';

    if (opt.nextStep === 'ppdb') {
      botReply =
        'Alhamdulillah, pendaftaran Tahun Ajaran 2026/2027 telah dibuka untuk jenjang Kindergarten, Primary, Secondary, dan High School.\n\nSilakan pilih jenjang yang diminati untuk informasi kuota dan tahapan seleksi:';
      nextOpts = [
        { label: 'Kindergarten (TK)', nextStep: 'kg' },
        { label: 'Primary (SD)', nextStep: 'sd' },
        { label: 'Secondary (SMP)', nextStep: 'smp' },
        { label: 'Kembali ke Menu Utama', nextStep: 'restart' },
      ];
      logText = 'Orang tua memilih PPDB; bot menampilkan pilihan jenjang pendidikan.';
    } else if (opt.nextStep === 'fees') {
      botReply =
        'Rincian Biaya Sekolah mencakup:\n- Biaya Pendaftaran: Rp 300.000 (TK/SD) atau Rp 1.000.000 (SMP/SMA)\n- DSP (Enrollment Fee)\n- SPP Bulanan\n- DKT (Annual Program Fee)\n\nCatatan Penting: Seluruh pembayaran bersifat non-refundable.';
      nextOpts = [
        { label: 'Simulasi Biaya SD Talenta Juara', nextStep: 'sd_fees' },
        { label: 'Konsultasi Skema Cicilan dengan Finance', nextStep: 'human' },
        { label: 'Kembali ke Menu Utama', nextStep: 'restart' },
      ];
      logText = 'Bot memberikan ringkasan struktur biaya resmi dan penegasan non-refundable.';
    } else if (opt.nextStep === 'human') {
      botReply =
        'Baik Bapak/Ibu, percakapan ini kami teruskan ke staf PIC Admission. Tim kami akan segera merespons pesan Anda di jam operasional (Senin-Jumat 08.00-16.00).';
      nextOpts = [{ label: 'Mulai Ulang Percakapan', nextStep: 'restart' }];
      logText = 'Eskalasi ke staf manusia: Tiket baru dibuat di CRM Inbox.';
    } else {
      botReply = "Assalamu'alaikum. Ada hal lain yang dapat kami bantu?";
      nextOpts = [
        { label: 'Informasi Pendaftaran Siswa Baru (PPDB)', nextStep: 'ppdb' },
        { label: 'Rincian Biaya Sekolah & Skema Pembayaran', nextStep: 'fees' },
      ];
      logText = 'Navigasi kembali ke menu utama.';
    }

    setMessages((prev) => [...prev, userMsg, { who: 'bot', text: botReply }]);
    setOptions(nextOpts);
    setAuditLog((prev) => [...prev, logText]);
  };

  const handleRestart = (scenarioId: string = 'new') => {
    setActiveScenario(scenarioId);
    setMessages([
      {
        who: 'bot',
        text: "Assalamu'alaikum Warahmatullahi Wabarakatuh.\nSelamat datang di Layanan Informasi Kreativa Global School.\n\nBolehkah kami mengetahui kebutuhan Bapak/Ibu hari ini?",
      },
    ]);
    setOptions([
      { label: 'Informasi Pendaftaran Siswa Baru (PPDB)', nextStep: 'ppdb' },
      { label: 'Rincian Biaya Sekolah & Skema Pembayaran', nextStep: 'fees' },
      { label: 'Jadwal School Visit / Trial Class', nextStep: 'visit' },
      { label: 'Hubungkan dengan Tim Admission', nextStep: 'human' },
    ]);
    setAuditLog(['Simulasi diulang ke titik awal alur chatbot.']);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Simulasi Chatbot</h2>
          <p>Uji alur percakapan WhatsApp & Live Chat seperti yang dialami orang tua.</p>
        </div>
        <div>
          <button
            className="button"
            type="button"
            onClick={() => handleRestart(activeScenario)}
          >
            <Icon name="refresh" /> Mulai Ulang Skenario
          </button>
        </div>
      </div>

      <div className="sim-layout">
        {/* Left Column: Phone Simulator Frame */}
        <div>
          <div className="phone-wrap">
            <div className="phone-inner">
              <div className="phone-head">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    border: '1px solid #eef2f6',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="/images/LOGO-kgs.png"
                    alt="Logo Kreativa Global School"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      transform: 'scale(1.4)',
                    }}
                  />
                </div>
                <div>
                  <strong>Kreativa Global School</strong>
                  <small>● Layanan Resmi (Simulasi)</small>
                </div>
              </div>

              <div className="phone-chat">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`phone-msg ${m.who === 'parent' ? 'from-user' : ''}`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              <div className="options">
                <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                  PILIHAN JAWABAN:
                </span>
                {options.map((opt, i) => (
                  <button
                    key={i}
                    className="option-btn"
                    onClick={() => handleSelectOption(opt)}
                  >
                    <span>{opt.label}</span>
                    <span>→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scenario selector & Audit Trail */}
        <div>
          <div className="sim-scenario">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`scenario-btn ${activeScenario === s.id ? 'active' : ''}`}
                onClick={() => handleRestart(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="audit-box">
            <h3>Jejak Keputusan Alur (Audit Trail)</h3>
            <p className="sub" style={{ marginBottom: '14px' }}>
              Memantau bagaimana setiap respons bot dicocokkan dengan basis data dan kebijakan sekolah.
            </p>

            {auditLog.map((log, index) => (
              <div key={index} className="audit-row">
                <div className="step-dot">{index + 1}</div>
                <div>
                  <b>Langkah {index + 1}</b>
                  <p>{log}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
