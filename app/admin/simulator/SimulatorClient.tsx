'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icons';

interface Contact {
  id: string;
  parent: string;
  child: string;
  phone: string;
  level: string;
  type: string;
  stage: string;
  lead: string;
  pic: string;
  email: string;
  notes: string;
}

interface KnowledgeItem {
  id: string;
  title: string;
  level: string;
  category: string;
  answer: string;
  active: boolean;
}

interface SimHistoryItem {
  from: 'bot' | 'user';
  text: string;
}

interface SimContext {
  phase: string;
  level: string;
  topic: string;
  contact: string | null;
}

const scenarioDefs: Record<
  string,
  { label: string; contact: string | null; subtitle: string }
> = {
  new: {
    label: 'Calon orang tua baru',
    contact: null,
    subtitle: 'Belum mendaftar; bertanya tentang sekolah',
  },
  registered: {
    label: 'Sudah daftar & seleksi',
    contact: 'P03',
    subtitle: 'Cek jadwal dan reschedule assessment',
  },
  accepted: {
    label: 'Sudah diterima',
    contact: 'P01',
    subtitle: 'Confirmation Letter dan hasil psikotes',
  },
  payment: {
    label: 'Menunggu pembayaran',
    contact: 'P02',
    subtitle: 'Pembayaran pertama dan permintaan waktu',
  },
  existing: {
    label: 'Orang tua siswa aktif',
    contact: 'P06',
    subtitle: 'Layanan existing parent',
  },
};

const stageLabel = (s: string) =>
  ({
    Registered: 'Terdaftar',
    'Assessment Scheduled': 'Jadwal Seleksi Tersedia',
    'Assessment Completed': 'Seleksi Selesai',
    'Parent Interview': 'Wawancara Orang Tua',
    'Selection Result': 'Menunggu Pengumuman',
    Accepted: 'Diterima',
    'Confirmation Letter Pending': 'Menunggu Surat Konfirmasi',
    'First Payment Pending': 'Menunggu Pembayaran Pertama',
    'Payment Verification': 'Verifikasi Pembayaran',
    'Enrollment Completed': 'Pendaftaran Selesai',
  }[s] || s);

const levels = [
  'Kindergarten 1',
  'Kindergarten 2',
  'Primary',
  'Secondary',
  'High School',
];

const contacts: Record<string, Contact> = {
  P01: {
    id: 'P01',
    parent: 'Nadia Putri',
    child: 'Alya Putri',
    phone: '0812-***-1042',
    level: 'Kindergarten 2',
    type: 'Calon Orang Tua',
    stage: 'Accepted',
    lead: 'Hot',
    pic: 'Admission',
    email: 'nadia@example.com',
    notes: 'Meminta penjelasan Confirmation Letter',
  },
  P02: {
    id: 'P02',
    parent: 'Rizky Fadilah',
    child: 'Faris Hakim',
    phone: '0813-***-3321',
    level: 'Primary',
    type: 'Calon Orang Tua',
    stage: 'First Payment Pending',
    lead: 'Hot',
    pic: 'Admission',
    email: 'rizky@example.com',
    notes: 'Menanyakan tambahan waktu pembayaran',
  },
  P03: {
    id: 'P03',
    parent: 'Sarah Humaira',
    child: 'Zara Humaira',
    phone: '0821-***-1920',
    level: 'Kindergarten 1',
    type: 'Calon Orang Tua',
    stage: 'Assessment Scheduled',
    lead: 'Hot',
    pic: 'Admission',
    email: 'sarah@example.com',
    notes: 'Perubahan jadwal seleksi',
  },
  P06: {
    id: 'P06',
    parent: 'Aulia Rahma',
    child: 'Naila Rahma',
    phone: '0822-***-2980',
    level: 'Primary',
    type: 'Orang Tua Aktif',
    stage: '',
    lead: '',
    pic: 'Ms. Meita',
    email: 'aulia@example.com',
    notes: 'Orang tua siswa aktif',
  },
};

const getContact = (id: string | null) =>
  (id && contacts[id]) || {
    id: 'unknown',
    parent: 'Tidak diketahui',
    child: '—',
    level: '—',
    type: '—',
    phone: '—',
    stage: '',
    lead: '',
    pic: 'Admission',
    email: '',
    notes: '',
  };

const knowledge: KnowledgeItem[] = [
  {
    id: 'F01',
    title: 'Kurikulum dan program belajar',
    level: 'Semua Jenjang',
    category: 'Informasi Sekolah',
    answer:
      'Kreativa Global School menggabungkan pembelajaran internasional dan penguatan nilai Islam. Detail program berbeda untuk tiap jenjang. Silakan pilih jenjang agar kami dapat membantu lebih lanjut.',
    active: true,
  },
  {
    id: 'F02',
    title: 'Biaya sekolah dan pembayaran',
    level: 'Semua Jenjang',
    category: 'Biaya',
    answer:
      'Biaya sekolah berbeda sesuai jenjang dan tahun ajaran. Silakan lihat informasi resmi dari tim Admission untuk rincian biaya terbaru. Kami dapat menghubungkan Bapak/Ibu dengan tim terkait.',
    active: true,
  },
  {
    id: 'F03',
    title: 'Ketersediaan kursi',
    level: 'Semua Jenjang',
    category: 'Pendaftaran',
    answer:
      'Ketersediaan kursi dapat berubah. Tim Admission akan membantu mengecek kuota terbaru untuk jenjang yang Bapak/Ibu minati.',
    active: true,
  },
  {
    id: 'F04',
    title: 'School visit dan trial class',
    level: 'Semua Jenjang',
    category: 'Kunjungan',
    answer:
      'Kami senang menyambut Bapak/Ibu untuk mengenal Kreativa lebih dekat. Tim kami akan membantu mengecek jadwal school visit atau trial class yang tersedia.',
    active: true,
  },
  {
    id: 'F05',
    title: 'Cara mendaftar',
    level: 'Semua Jenjang',
    category: 'Pendaftaran',
    answer:
      'Pendaftaran dilakukan melalui portal resmi admission.kreativaglobal.sch.id. Setelah mendaftar, mohon mengikuti pengumuman mengenai tahapan berikutnya.',
    active: true,
  },
  {
    id: 'F06',
    title: 'Jadwal assessment',
    level: 'Semua Jenjang',
    category: 'Admission',
    answer:
      'Jadwal assessment mengikuti undangan resmi dari tim Admission. Untuk perubahan jadwal, kami akan membantu menghubungkan Bapak/Ibu dengan PIC.',
    active: true,
  },
  {
    id: 'F07',
    title: 'Panduan Confirmation Letter',
    level: 'Semua Jenjang',
    category: 'Admission',
    answer:
      'Silakan buka portal Admission menggunakan email saat mendaftar, pilih status Accepted, lalu unduh, isi, dan unggah Confirmation Letter sesuai petunjuk di portal.',
    active: true,
  },
  {
    id: 'F08',
    title: 'Pembayaran pertama',
    level: 'Semua Jenjang',
    category: 'Admission',
    answer:
      'Informasi pembayaran pertama mengikuti surat penerimaan resmi. Bukti pembayaran dapat dikirim untuk diverifikasi oleh tim Finance. Chatbot tidak dapat mengonfirmasi pembayaran secara otomatis.',
    active: true,
  },
  {
    id: 'F09',
    title: 'Hasil psikotes',
    level: 'Semua Jenjang',
    category: 'Admission',
    answer:
      'Hasil psikotes merupakan informasi pribadi yang bersifat rahasia. Tim terkait akan membantu proses penyampaian setelah melakukan verifikasi identitas orang tua.',
    active: true,
  },
  {
    id: 'F10',
    title: 'Permintaan perubahan jadwal pembayaran',
    level: 'Semua Jenjang',
    category: 'Admission',
    answer:
      'Permohonan perubahan batas waktu pembayaran akan diteruskan kepada tim yang berwenang. Persetujuan tidak dapat diberikan otomatis oleh chatbot.',
    active: true,
  },
  {
    id: 'F11',
    title: 'Jadwal dan kalender sekolah',
    level: 'Semua Jenjang',
    category: 'Existing',
    answer:
      'Untuk jadwal dan kalender sekolah, silakan pilih jenjang anak. Informasi khusus siswa dapat dikonfirmasi bersama PRO.',
    active: true,
  },
  {
    id: 'F12',
    title: 'Izin dan kehadiran siswa',
    level: 'Semua Jenjang',
    category: 'Existing',
    answer:
      'Bapak/Ibu dapat menyampaikan informasi izin atau kehadiran siswa kepada PRO sesuai jenjang. Mohon sertakan informasi siswa melalui saluran yang aman.',
    active: true,
  },
];

export function SimulatorClient() {
  const [simId, setSimId] = useState<string>('new');
  const [simHistory, setSimHistory] = useState<SimHistoryItem[]>([]);
  const [simContext, setSimContext] = useState<SimContext>({
    phase: 'identify',
    level: '',
    topic: '',
    contact: null,
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const resetSimulation = (id: string = 'new') => {
    setSimId(id);
    const contact = scenarioDefs[id]?.contact || null;
    const newContext: SimContext = {
      phase: 'init',
      level: '',
      topic: '',
      contact,
    };

    if (id === 'new') {
      newContext.phase = 'identify';
      setSimHistory([
        {
          from: 'bot',
          text: 'Assalamu’alaikum, selamat datang di Kreativa Global School! 👋\n\nApakah Bapak/Ibu merupakan orang tua siswa yang saat ini bersekolah di Kreativa?',
        },
      ]);
    } else {
      const p = getContact(contact);
      const name = p.parent.split(' ')[0];
      if (id === 'existing') {
        newContext.phase = 'existing';
        setSimHistory([
          {
            from: 'bot',
            text: `Assalamu’alaikum, Mommy ${name}! 😊\n\nNomor ini dikenali sebagai orang tua siswa aktif (${p.level}). Ada yang bisa kami bantu?`,
          },
        ]);
      } else {
        newContext.phase = 'registered';
        setSimHistory([
          {
            from: 'bot',
            text: `Assalamu’alaikum, Mommy ${name}! 😊\n\nPendaftaran ananda ${p.child} sudah tercatat pada tahap: ${stageLabel(p.stage)}.\n\nAda yang bisa kami bantu?`,
          },
        ]);
      }
    }
    setSimContext(newContext);
  };

  useEffect(() => {
    resetSimulation('new');
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [simHistory]);

  const simChoices = (): [string, string][] => {
    switch (simContext.phase) {
      case 'identify':
        return [
          ['existing', 'Ya, orang tua siswa aktif'],
          ['new', 'Tidak, saya calon orang tua'],
        ];
      case 'prospect':
        return [
          ['notregistered', 'Belum mendaftar, ingin tahu informasi'],
          ['alreadyregistered', 'Sudah mendaftar di Kreativa'],
          ['restart', 'Kembali ke awal'],
        ];
      case 'chooselevel':
        return [
          ...levels.map((x) => [`level:${x}`, x] as [string, string]),
          ['restart', 'Kembali ke awal'],
        ];
      case 'general':
        return [
          ['faq:Biaya sekolah dan pembayaran', 'Biaya sekolah'],
          ['faq:Kurikulum dan program belajar', 'Kurikulum dan program'],
          ['faq:Ketersediaan kursi', 'Ketersediaan kursi'],
          ['faq:School visit dan trial class', 'School visit / trial class'],
          ['faq:Cara mendaftar', 'Cara mendaftar'],
          ['human:Admission', 'Bicara dengan Tim Admission'],
          ['finish', 'Informasi sudah cukup, selesai'],
        ];
      case 'existing':
        return [
          ['existingfaq:Jadwal dan kalender sekolah', 'Jadwal dan kegiatan sekolah'],
          ['existingfaq:Izin dan kehadiran siswa', 'Izin dan kehadiran'],
          ['human:Ms. Meita', 'Hubungi PRO Primary'],
          ['existing_admission', 'Mau mendaftarkan anak lainnya'],
          ['finish', 'Selesai'],
        ];
      case 'registered': {
        const stage = getContact(simContext.contact).stage;
        const arr: [string, string][] = [['checkstage', 'Lihat tahap pendaftaran saya']];
        if (
          [
            'Registered',
            'Assessment Scheduled',
            'Assessment Completed',
            'Parent Interview',
            'Selection Result',
          ].includes(stage)
        ) {
          arr.push(
            ['faq:Jadwal assessment', 'Jadwal assessment / interview'],
            ['human:Admission', 'Minta perubahan jadwal']
          );
        }
        if (
          [
            'Accepted',
            'Confirmation Letter Pending',
            'First Payment Pending',
            'Payment Verification',
            'Enrollment Completed',
          ].includes(stage)
        ) {
          arr.push(
            ['faq:Panduan Confirmation Letter', 'Cara upload Confirmation Letter'],
            ['faq:Pembayaran pertama', 'Pembayaran pertama'],
            ['faq:Hasil psikotes', 'Permintaan hasil psikotes'],
            ['faq:Permintaan perubahan jadwal pembayaran', 'Perubahan tenggat pembayaran'],
            ['human:Finance', 'Kirim bukti / konfirmasi pembayaran']
          );
        }
        arr.push(['human:Admission', 'Bicara dengan Tim Admission'], ['finish', 'Selesai']);
        return arr;
      }
      case 'continue':
        return [
          ['general', 'Kembali ke menu informasi'],
          ['human:Admission', 'Bicara dengan Tim Admission'],
          ['finish', 'Selesai'],
        ];
      case 'finished':
        return [['restart', 'Mulai simulasi dari awal']];
      case 'donehandover':
        return [
          ['restart', 'Mulai lagi'],
          ['finish', 'Selesai'],
        ];
      default:
        return [['restart', 'Mulai lagi']];
    }
  };

  const simAct = (code: string) => {
    const currentChoices = simChoices();
    const selected = currentChoices.find((x) => x[0] === code);
    const userText = selected ? selected[1] : code;

    const newHist: SimHistoryItem[] = [...simHistory, { from: 'user', text: userText }];
    const sc: SimContext = { ...simContext };

    if (code === 'restart') {
      resetSimulation('new');
      return;
    } else if (code === 'existing') {
      sc.contact = 'P06';
      sc.phase = 'existing';
      newHist.push({
        from: 'bot',
        text: 'Baik, pilih kebutuhan Bapak/Ibu. Untuk informasi khusus siswa, tim kami akan melakukan verifikasi terlebih dahulu.',
      });
    } else if (code === 'new') {
      sc.phase = 'prospect';
      newHist.push({
        from: 'bot',
        text: 'Terima kasih sudah tertarik dengan Kreativa 😊\nApakah Bapak/Ibu sudah melakukan pendaftaran?',
      });
    } else if (code === 'notregistered' || code === 'existing_admission') {
      sc.phase = 'chooselevel';
      newHist.push({
        from: 'bot',
        text: 'Untuk jenjang apa Bapak/Ibu ingin mencari informasi?',
      });
    } else if (code === 'alreadyregistered') {
      sc.contact = 'P03';
      sc.phase = 'registered';
      newHist.push({
        from: 'bot',
        text: 'Baik, ini simulasi ketika sistem menemukan data pendaftar dari nomor yang sudah terverifikasi. Contoh: Zara Humaira, tahap Assessment Scheduled.',
      });
    } else if (code.startsWith('level:')) {
      sc.level = code.slice(6);
      sc.phase = 'general';
      newHist.push({
        from: 'bot',
        text: `Baik, Bapak/Ibu memilih ${sc.level}. Ada yang ingin ditanyakan?`,
      });
    } else if (code === 'general') {
      sc.phase = 'general';
      newHist.push({
        from: 'bot',
        text: 'Silakan pilih topik yang ingin diketahui.',
      });
    } else if (code.startsWith('faq:') || code.startsWith('existingfaq:')) {
      const title = code.split(':').slice(1).join(':');
      sc.topic = title;
      const k = knowledge.find((item) => item.title === title && item.active);
      newHist.push({
        from: 'bot',
        text: k
          ? k.answer
          : 'Informasi belum tersedia. Tim kami akan membantu memberikan jawaban yang sudah diverifikasi.',
      });
      sc.phase = 'continue';
      if (code.startsWith('existingfaq:')) {
        newHist.push({
          from: 'bot',
          text: 'Apabila pertanyaan berkaitan dengan data pribadi siswa, kami akan mengalihkan ke PRO setelah verifikasi.',
        });
      }
    } else if (code === 'checkstage') {
      const p = getContact(sc.contact);
      newHist.push({
        from: 'bot',
        text: `Nama siswa: ${p.child}\nJenjang: ${p.level}\nTahap saat ini: ${p.stage}\n\nInformasi ini hanya muncul setelah identitas orang tua terverifikasi.`,
      });
      sc.phase = 'registered';
    } else if (code.startsWith('human:')) {
      const team = code.slice(6);
      newHist.push({
        from: 'bot',
        text: `Baik, permintaan Bapak/Ibu sudah dicatat untuk ${team}. ✅\n\nIni simulasi: sebuah chat baru dan tugas follow-up sudah dibuat di Kotak Masuk. Belum ada pesan yang dikirim melalui WhatsApp sungguhan.`,
      });
      sc.phase = 'donehandover';
    } else if (code === 'finish') {
      sc.phase = 'finished';
      newHist.push({
        from: 'bot',
        text: 'Terima kasih sudah menghubungi Kreativa! 😊\n\nUntuk saat ini percakapan selesai. Bapak/Ibu dapat menghubungi kami kembali kapan saja.',
      });
    } else {
      sc.phase = 'finished';
      newHist.push({
        from: 'bot',
        text: 'Maaf, pilihan belum tersedia.',
      });
    }

    setSimHistory(newHist);
    setSimContext(sc);
  };

  const currentContact = getContact(simContext.contact);
  const currentScenario = scenarioDefs[simId] || scenarioDefs.new;

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h2>Simulasi Chatbot</h2>
          <p>Coba alur yang berbeda sebelum CRM dipasang ke WhatsApp sungguhan.</p>
        </div>
        <div>
          <button
            className="button"
            type="button"
            onClick={() => resetSimulation(simId)}
          >
            <Icon name="refresh" /> Mulai Ulang
          </button>
        </div>
      </div>

      {/* Scenario Selector Buttons Bar */}
      <div className="sim-scenario">
        {Object.entries(scenarioDefs).map(([id, s]) => (
          <button
            key={id}
            type="button"
            className={`scenario-btn ${simId === id ? 'active' : ''}`}
            onClick={() => resetSimulation(id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Main 2-Column Grid */}
      <div className="sim-layout">
        {/* Left Column: WhatsApp Phone Simulator */}
        <div>
          <div className="card card-pad">
            <div className="card-head">
              <h3>Tampilan WhatsApp Orang Tua</h3>
              <span className="tag purple">Simulasi Interaktif</span>
            </div>

            <div className="phone-wrap">
              <div className="phone-inner">
                {/* Phone Header */}
                <div className="phone-head">
                  <div
                    style={{
                      background: '#e4f3e8',
                      color: '#158461',
                      borderRadius: '50%',
                      width: '35px',
                      height: '35px',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="chat" />
                  </div>
                  <div>
                    <strong>Kreativa Global School</strong>
                    <small>Chatbot CRM · Simulasi</small>
                  </div>
                </div>

                {/* Phone Chat Messages Scroll Area */}
                <div className="phone-chat" ref={chatContainerRef}>
                  {simHistory.map((m, idx) => (
                    <div
                      key={idx}
                      className={`phone-msg ${m.from === 'user' ? 'from-user' : ''}`}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>

                {/* Options Action Buttons */}
                <div className="options">
                  {simChoices().map(([code, label]) => (
                    <button
                      key={code}
                      type="button"
                      className="option-btn"
                      onClick={() => simAct(code)}
                    >
                      <span>{label}</span>
                      <Icon name="arrow" />
                    </button>
                  ))}

                  {simContext.phase === 'donehandover' && (
                    <Link
                      href="/admin/inbox"
                      className="option-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      <span>Lihat chat yang dibuat</span>
                      <span>→</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <p className="footnote">
              Tombol simulasi bisa diklik. Tindakan “Bicara dengan Tim” membuat chat dan
              follow-up di data demo, bukan mengirim pesan sungguhan.
            </p>
          </div>
        </div>

        {/* Right Column: Audit Decision Box & Current Scenario Detail */}
        <div>
          <div className="audit-box">
            <h3>Bagaimana CRM mengambil keputusan?</h3>
            {[
              [
                'Kenali jenis orang tua',
                'Sistem mengecek apakah nomor termasuk orang tua siswa aktif atau calon orang tua.',
              ],
              [
                'Cek status pendaftaran',
                'Jika sudah terdaftar, menu mengikuti tahapan siswa.',
              ],
              [
                'Jawab pertanyaan umum',
                'FAQ yang disetujui dapat dijawab otomatis.',
              ],
              [
                'Bantu pertanyaan khusus',
                'Chat dialihkan ke PIC dan tetap dicatat sampai selesai.',
              ],
            ].map(([title, desc], i) => (
              <div key={i} className="audit-row">
                <div className="step-dot">{i + 1}</div>
                <div>
                  <b>{title}</b>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card card-pad section-gap">
            <div className="card-head">
              <h3>Simulasi yang dipilih</h3>
            </div>
            <strong>{currentScenario.label}</strong>
            <p className="sub" style={{ marginTop: '6px' }}>
              {currentScenario.subtitle}
            </p>

            <div className="mini-detail">
              <span className="muted">Tahap saat ini</span>
              <strong>{simContext.phase}</strong>
            </div>

            <div className="mini-detail">
              <span className="muted">Jenjang</span>
              <strong>
                {simContext.level ||
                  (simContext.contact ? currentContact.level : 'Belum dipilih')}
              </strong>
            </div>

            {simContext.contact && (
              <div className="mini-detail">
                <span className="muted">Data simulasi</span>
                <strong>{currentContact.child}</strong>
              </div>
            )}

            <p className="footnote">
              Keamanan: permintaan hasil psikotes, informasi siswa, perubahan tenggat, dan
              konfirmasi pembayaran tetap ditangani manusia setelah verifikasi.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
