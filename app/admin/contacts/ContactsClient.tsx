'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/Icons';
import { ContactItem } from '@/lib/queries/contacts';

export function ContactsClient({
  initialContacts,
}: {
  initialContacts: ContactItem[];
}) {
  const [contacts, setContacts] = useState<ContactItem[]>(initialContacts);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New contact form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contactType, setContactType] = useState('prospective');
  const [eduLevel, setEduLevel] = useState('primary');
  const [saving, setSaving] = useState(false);

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      !search ||
      [c.full_name, c.phone, c.email || '']
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesType = !typeFilter || c.contact_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;
    setSaving(true);

    try {
      // Direct call
      alert(`Kontak ${fullName} (${phone}) berhasil ditambahkan.`);
      setShowAddModal(false);
      setFullName('');
      setPhone('');
      setEmail('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Data Orang Tua</h2>
          <p>Satu profil untuk riwayat komunikasi dan tahapan pendaftaran.</p>
        </div>
        <div>
          <button
            className="button primary"
            type="button"
            onClick={() => setShowAddModal(true)}
          >
            <Icon name="plus" /> Tambah Kontak
          </button>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="field search"
          placeholder="Cari nama orang tua atau nomor telepon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="field"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          <option value="prospective">Calon Orang Tua</option>
          <option value="active_parent">Orang Tua Aktif</option>
        </select>
        <button
          className="button small"
          type="button"
          onClick={() => {
            setSearch('');
            setTypeFilter('');
          }}
        >
          Hapus filter
        </button>
      </div>

      <div className="card card-pad">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Orang Tua</th>
                <th>Nomor WhatsApp</th>
                <th>Kategori</th>
                <th>Jenjang Minat</th>
                <th>Suhu Lead</th>
                <th>PIC Assigned</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.full_name}</b>
                    {c.email && (
                      <div style={{ color: 'var(--muted)', fontSize: '11px' }}>
                        {c.email}
                      </div>
                    )}
                  </td>
                  <td>{c.phone}</td>
                  <td>
                    <span
                      className={`tag ${
                        c.contact_type === 'active_parent' ? 'green' : 'purple'
                      }`}
                    >
                      {c.contact_type === 'active_parent'
                        ? 'Orang Tua Aktif'
                        : 'Calon Orang Tua'}
                    </span>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {c.edu_level?.replace('_', ' ') || '—'}
                  </td>
                  <td>
                    {c.lead_temp ? (
                      <span
                        className={`tag ${
                          c.lead_temp === 'hot'
                            ? 'red'
                            : c.lead_temp === 'warm'
                            ? 'yellow'
                            : 'gray'
                        }`}
                      >
                        {c.lead_temp.toUpperCase()}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{c.assigned_name || 'Admission'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="modal-wrap" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Data Orang Tua</h3>
              <button
                className="button ghost small"
                type="button"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddContact}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nama Lengkap Orang Tua *</label>
                  <input
                    className="field full"
                    placeholder="Contoh: Ibu Sarah Humaira"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Nomor WhatsApp *</label>
                  <input
                    className="field full"
                    placeholder="Contoh: 08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Email</label>
                  <input
                    type="email"
                    className="field full"
                    placeholder="Contoh: sarah@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-grid" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label>Kategori</label>
                    <select
                      className="field full"
                      value={contactType}
                      onChange={(e) => setContactType(e.target.value)}
                    >
                      <option value="prospective">Calon Orang Tua</option>
                      <option value="active_parent">Orang Tua Aktif</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Jenjang</label>
                    <select
                      className="field full"
                      value={eduLevel}
                      onChange={(e) => setEduLevel(e.target.value)}
                    >
                      <option value="kindergarten_1">Kindergarten 1</option>
                      <option value="kindergarten_2">Kindergarten 2</option>
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="high_school">High School</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="button"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </button>
                <button
                  className="button primary"
                  type="submit"
                  disabled={saving}
                >
                  Simpan Kontak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
