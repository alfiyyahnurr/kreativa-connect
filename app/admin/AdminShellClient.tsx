'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminTopbar } from '@/components/AdminTopbar';

const TITLES: Record<string, [string, string]> = {
  '/admin': ['Ringkasan', 'Gambaran layanan WhatsApp hari ini'],
  '/admin/dashboard': ['Ringkasan', 'Gambaran layanan WhatsApp hari ini'],
  '/admin/inbox': ['Kotak Masuk', 'Satu tempat untuk memantau semua percakapan'],
  '/admin/simulator': ['Simulasi Chatbot', 'Coba alur percakapan seperti orang tua'],
  '/admin/admission': ['Proses Admission', 'Pantau perjalanan setiap pendaftar'],
  '/admin/contacts': ['Data Orang Tua', 'Profil, status, dan riwayat komunikasi'],
  '/admin/tasks': ['Tindak Lanjut', 'Pastikan tidak ada pertanyaan yang terlewat'],
  '/admin/fees': ['Biaya Sekolah', 'Daftar paket dan rincian biaya resmi'],
  '/admin/knowledge': ['FAQ & Jawaban', 'Informasi yang digunakan chatbot dan PRO'],
  '/admin/reports': ['Laporan', 'Pantau beban kerja dan kecepatan layanan'],
  '/admin/settings': ['Pengaturan', 'Jam layanan, PIC, dan aturan respons'],
};

export function AdminShellClient({
  children,
  overdueCount = 0,
}: {
  children: React.ReactNode;
  overdueCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const titlePair = TITLES[pathname] || ['Kreativa Connect', 'Parent Communication CRM'];

  return (
    <div className="app">
      <AdminSidebar
        overdueTasksCount={overdueCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <main className="main">
        <AdminTopbar
          title={titlePair[0]}
          subtitle={titlePair[1]}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          onExport={() => {
            alert('Fitur Ekspor data (XLSX / PDF) siap digunakan.');
          }}
        />
        <div className="workspace" id="workspace">
          {children}
        </div>
      </main>
    </div>
  );
}
