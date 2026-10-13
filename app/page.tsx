import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { Icon } from '@/components/Icons';

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #28225e 0%, #3e3288 50%, #443795 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#fff',
        fontFamily: "'Albert Sans', 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '860px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <BrandLogo size={70} />
        </div>

        <span
          style={{
            fontSize: '11px',
            letterSpacing: '2.5px',
            fontWeight: 800,
            color: '#b6abd9',
            textTransform: 'uppercase',
          }}
        >
          Parent Communication CRM & AI Live Chat
        </span>

        <h1
          style={{
            fontSize: '38px',
            fontWeight: 900,
            letterSpacing: '-1.2px',
            marginTop: '10px',
            marginBottom: '14px',
          }}
        >
          Kreativa Connect
        </h1>

        <p
          style={{
            fontSize: '15px',
            color: '#c4c2df',
            maxWidth: '620px',
            margin: '0 auto 36px',
            lineHeight: 1.6,
          }}
        >
          Sistem manajemen komunikasi orang tua terpadu untuk <strong>Kreativa Global School</strong> dan{' '}
          <strong>SD Talenta Juara</strong>. Mengintegrasikan WhatsApp, Live Chat Web, alur pendaftaran admission,
          serta asisten virtual AI cerdas.
        </p>

        {/* 2 Main Portals */}
        <div className="grid g2" style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'left' }}>
          {/* Card 1: Admin CRM */}
          <Link
            href="/admin"
            className="card card-pad"
            style={{
              textDecoration: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s',
              background: 'rgba(255, 255, 255, 0.98)',
              border: 'none',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#f1edff',
                color: '#443795',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '16px',
              }}
            >
              <Icon name="dashboard" />
            </div>
            <h3 style={{ color: '#25223f', fontSize: '18px', marginBottom: '6px' }}>
              Admin Panel CRM
            </h3>
            <p style={{ color: '#7b8096', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
              Unified Inbox 3 kolom, Kanban Admission 10 tahap, manajemen kontak, dan pengaturan SLA 15 menit.
            </p>
            <div
              style={{
                marginTop: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '12px',
                color: '#443795',
              }}
            >
              Masuk ke CRM Admin →
            </div>
          </Link>

          {/* Card 2: Public Live Chat Widget */}
          <Link
            href="/chat-widget"
            className="card card-pad"
            style={{
              textDecoration: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s',
              background: 'rgba(255, 255, 255, 0.98)',
              border: 'none',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#e5f7ee',
                color: '#169a72',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '16px',
              }}
            >
              <Icon name="chat" />
            </div>
            <h3 style={{ color: '#25223f', fontSize: '18px', marginBottom: '6px' }}>
              Widget Live Chat Publik
            </h3>
            <p style={{ color: '#7b8096', fontSize: '12px', lineHeight: 1.5, margin: 0 }}>
              Formulir intake identitas orang tua dilanjutkan ke interaksi WhatsApp Chatbot dengan AI Gemini streaming.
            </p>
            <div
              style={{
                marginTop: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '12px',
                color: '#169a72',
              }}
            >
              Buka Live Chat Widget →
            </div>
          </Link>
        </div>

        <div style={{ marginTop: '40px', fontSize: '11px', color: '#8c84b4' }}>
          Database: Neon PostgreSQL Serverless (AWS Singapore) · Cache: Upstash Redis · AI: Google Gemini
        </div>
      </div>
    </div>
  );
}
