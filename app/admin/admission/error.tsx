'use client';

import React, { useEffect } from 'react';
import { Icon } from '@/components/Icons';

export default function AdmissionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admission page error boundary caught:', error);
  }, [error]);

  return (
    <div style={{ padding: '40px 20px', maxWidth: '580px', margin: '40px auto', textAlign: 'center' }}>
      <div className="card card-pad">
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: '#ffedf2',
            color: '#d64270',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Icon name="alert" />
        </div>
        <h2 style={{ fontSize: '18px', marginBottom: '8px', letterSpacing: '-0.4px' }}>
          Gagal Memuat Halaman Admission
        </h2>
        <p className="sub" style={{ marginBottom: '16px', lineHeight: 1.6 }}>
          Terjadi kendala saat memuat data pendaftaran. Silakan klik tombol di bawah untuk mencoba memuat ulang.
        </p>
        {error?.message && (
          <p style={{ fontSize: '11px', color: '#888', marginBottom: '20px', fontFamily: 'monospace' }}>
            {error.message}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button
            className="button primary"
            type="button"
            onClick={() => reset()}
          >
            <Icon name="refresh" /> Coba Muat Ulang
          </button>
        </div>
      </div>
    </div>
  );
}
