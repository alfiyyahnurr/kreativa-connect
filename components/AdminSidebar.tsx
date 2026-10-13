'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from './BrandLogo';
import { Icon } from './Icons';

interface AdminSidebarProps {
  overdueTasksCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  overdueTasksCount = 0,
  mobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const mainNav = [
    { href: '/admin', icon: 'dashboard', label: 'Ringkasan' },
    { href: '/admin/inbox', icon: 'chat', label: 'Kotak Masuk' },
    { href: '/admin/simulator', icon: 'bot', label: 'Simulasi Chatbot' },
    { href: '/admin/admission', icon: 'brief', label: 'Proses Admission' },
    { href: '/admin/contacts', icon: 'users', label: 'Data Orang Tua' },
    { href: '/admin/tasks', icon: 'clock', label: 'Tindak Lanjut', count: overdueTasksCount },
  ];

  const settingsNav = [
    { href: '/admin/fees', icon: 'chart', label: 'Biaya Sekolah' },
    { href: '/admin/knowledge', icon: 'book', label: 'FAQ & Jawaban' },
    { href: '/admin/reports', icon: 'chart', label: 'Laporan' },
    { href: '/admin/settings', icon: 'setting', label: 'Pengaturan' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname === '/admin/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="brand">
        <BrandLogo size={44} />
        <div>
          <strong>Kreativa Connect</strong>
          <small>PARENT CRM</small>
        </div>
      </div>

      <div className="nav-label">MENU UTAMA</div>
      <nav>
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onCloseMobile}
            className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
            title={item.label}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.count && item.count > 0 ? (
              <b className="nav-count">{item.count}</b>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="nav-label">PENGATURAN</div>
      <nav>
        {settingsNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onCloseMobile}
            className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
            title={item.label}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="nav-spacer" />

      <div className="nav-footer">
        <b>Live Database</b>
        <p>Terhubung ke Neon PostgreSQL & Upstash Redis Serverless.</p>
      </div>
    </aside>
  );
}
