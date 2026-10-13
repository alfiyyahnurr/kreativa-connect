import React from 'react';

export function Icon({ name, className = '' }: { name: string; className?: string }) {
  switch (name) {
    case 'dashboard':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
      );
    case 'chat':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.8-5.5a8.5 8.5 0 1 1 16.2-4z" />
        </svg>
      );
    case 'users':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 20v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'brief':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="7" width="18" height="14" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
        </svg>
      );
    case 'bot':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="8" width="18" height="13" rx="3" />
          <path d="M12 2v6M9 2h6M8 14h.01M16 14h.01M8 18h8" />
        </svg>
      );
    case 'check':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="m4 12 5 5L20 6" />
        </svg>
      );
    case 'clock':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l4 2" />
        </svg>
      );
    case 'book':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 19V5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2ZM20 19V5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2Z" />
        </svg>
      );
    case 'chart':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 3v18h18M7 16v-5M12 16V7M17 16V4" />
        </svg>
      );
    case 'setting':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l-1.9 1.9a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.98 1.48H9a1.6 1.6 0 0 0-.98-1.48 1.6 1.6 0 0 0-1.77.32l-1.9-1.9A1.6 1.6 0 0 0 4.67 15a1.6 1.6 0 0 0-1.48-.98V9.98A1.6 1.6 0 0 0 4.67 9a1.6 1.6 0 0 0-.32-1.77l1.9-1.9A1.6 1.6 0 0 0 8.02 5 1.6 1.6 0 0 0 9 3.52h6.07A1.6 1.6 0 0 0 16.05 5a1.6 1.6 0 0 0 1.77.32l1.9 1.9A1.6 1.6 0 0 0 19.4 9a1.6 1.6 0 0 0 1.48.98v4.04A1.6 1.6 0 0 0 19.4 15Z" />
        </svg>
      );
    case 'search':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m16 16 5 5" />
        </svg>
      );
    case 'plus':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v16M4 12h16" />
        </svg>
      );
    case 'arrow':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      );
    case 'send':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      );
    case 'alert':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 3 2 18a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3L14 3a2 2 0 0 0-4 0ZM12 9v5M12 18h.01" />
        </svg>
      );
    case 'download':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
        </svg>
      );
    case 'menu':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case 'refresh':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 11a8 8 0 1 0-2 7M20 4v7h-7" />
        </svg>
      );
    default:
      return null;
  }
}
