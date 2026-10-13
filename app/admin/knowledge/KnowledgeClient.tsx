'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/Icons';
import { KnowledgeArticle } from '@/lib/queries/knowledge';

export function KnowledgeClient({
  initialArticles,
}: {
  initialArticles: KnowledgeArticle[];
}) {
  const [articles, setArticles] = useState<KnowledgeArticle[]>(initialArticles);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('school_info');
  const [answer, setAnswer] = useState('');

  const filtered = articles.filter((a) => {
    const matchesSearch =
      !search ||
      [a.title, a.answer].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchesCat = !categoryFilter || a.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleOpenNew = () => {
    setEditingArticle(null);
    setTitle('');
    setCategory('school_info');
    setAnswer('');
    setShowModal(true);
  };

  const handleOpenEdit = (a: KnowledgeArticle) => {
    setEditingArticle(a);
    setTitle(a.title);
    setCategory(a.category);
    setAnswer(a.answer);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !answer) return;

    if (editingArticle) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === editingArticle.id ? { ...a, title, category, answer } : a
        )
      );
    } else {
      const newArticle: KnowledgeArticle = {
        id: String(Date.now()),
        school_id: '1',
        fee_structure_id: null,
        created_by_id: null,
        title,
        category,
        edu_level_scope: 'all',
        answer,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setArticles((prev) => [newArticle, ...prev]);
    }

    setShowModal(false);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>FAQ & Jawaban Otomatis</h2>
          <p>
            Repositori jawaban resmi yang menjadi sumber pengetahuan AI Chatbot dan referensi PRO.
          </p>
        </div>
        <div>
          <button className="button primary" type="button" onClick={handleOpenNew}>
            <Icon name="plus" /> Tambah Jawaban Otomatis
          </button>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="field search"
          placeholder="Cari topik pertanyaan atau jawaban..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="field"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          <option value="school_info">Informasi Sekolah</option>
          <option value="fees">Biaya</option>
          <option value="enrollment">Pendaftaran</option>
          <option value="visit">Kunjungan</option>
          <option value="admission">Admission</option>
          <option value="existing_parent">Orang Tua Siswa</option>
        </select>
      </div>

      <div className="grid g2">
        {filtered.map((a) => (
          <div key={a.id} className="card faq-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <h4>{a.title}</h4>
              <span className="tag purple">{a.category.replace('_', ' ')}</span>
            </div>
            <p style={{ marginTop: '10px', lineHeight: 1.6 }}>{a.answer}</p>
            <div className="faq-actions" style={{ marginTop: '14px' }}>
              <button
                className="txt-btn"
                type="button"
                onClick={() => handleOpenEdit(a)}
              >
                Edit Jawaban →
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-wrap" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingArticle ? 'Edit FAQ' : 'Tambah Jawaban Otomatis'}</h3>
              <button
                className="button ghost small"
                type="button"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Topik / Pertanyaan *</label>
                  <input
                    className="field full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Kategori</label>
                  <select
                    className="field full"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="school_info">Informasi Sekolah</option>
                    <option value="fees">Biaya</option>
                    <option value="enrollment">Pendaftaran</option>
                    <option value="visit">Kunjungan</option>
                    <option value="admission">Admission</option>
                    <option value="existing_parent">Orang Tua Siswa</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Jawaban Resmi *</label>
                  <textarea
                    className="field full"
                    rows={5}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="button"
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button className="button primary" type="submit">
                  Simpan FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
