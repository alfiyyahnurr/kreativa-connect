import React from 'react';

export function BrandLogo({ size = 44 }: { size?: number }) {
  const borderRadius = Math.round(size * 0.27);
  return (
    <div
      className="brand-logo"
      style={{
        width: size,
        height: size,
        background: '#ffffff',
        borderRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #f0eff6',
        flexShrink: 0,
      }}
    >
      <img
        src="/images/LOGO-kgs.png"
        alt="Kreativa Global School"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          transform: 'scale(1.4)',
        }}
      />
    </div>
  );
}
