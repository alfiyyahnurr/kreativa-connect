'use client';

import React from 'react';
import { Icon } from './Icons';

interface AdminTopbarProps {
  title: string;
  subtitle: string;
  onToggleMobile?: () => void;
  onExport?: () => void;
  activeSchoolName?: string;
}

export function AdminTopbar({
  title,
  subtitle,
  onToggleMobile,
  onExport,
  activeSchoolName = 'Kreativa Global School',
}: AdminTopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <button
          className="button ghost mobile-trigger"
          onClick={onToggleMobile}
          type="button"
          aria-label="Toggle menu"
        >
          <Icon name="menu" />
        </button>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="top-right">
        <span className="demo-pill" style={{ background: '#eefbf3', color: '#118662' }}>
          ● {activeSchoolName.toUpperCase()}
        </span>
        {onExport && (
          <button className="button small" onClick={onExport} type="button">
            <Icon name="download" /> Ekspor Data
          </button>
        )}
        <div className="avatar" title="Logged in as: Super Admin">
          KA
        </div>
      </div>
    </header>
  );
}
