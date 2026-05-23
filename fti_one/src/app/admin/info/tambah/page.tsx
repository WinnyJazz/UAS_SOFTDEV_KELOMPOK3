'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './tambah.module.css';

export default function AdminInfoTambahPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    judul: '',
    isi: '',
    kategori: 'Pengumuman',
    media: [] as string[],
    timeline: '',
    contactPerson: '',
    judulLinkTerkait: '',
    linkTerkait: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || (user.role !== 'admin' && user.role !== 'superadmin')) {
      router.push('/login');
    }
  }, []);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({
          ...prev,
          media: [...prev.media, reader.result as string],
        }));
      };
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (idx: number) => {
    setForm((prev) => {
      const next = prev.media.filter((_, i) => i !== idx);
      setPreviewSlide(Math.min(previewSlide, next.length - 1));
      return { ...prev, media: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const res = await fetch('http://localhost:5000/api/informasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          adminId: user.adminId || user.id || 'admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Informasi berhasil ditambahkan!');
        router.push('/admin/info');
      } else {
        alert(data.message || 'Gagal menyimpan');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ── HEADER ── */}
      <div className={styles.adminHeader}>
        <button
          className={styles.btnBack}
          onClick={() => router.push('/admin/info')}
        >
          ← Kembali
        </button>
        <div className={styles.headerTitle}>
          <span className={styles.headerBadge}>ADMIN</span>
          <span>Tambah Informasi</span>
        </div>
        <div style={{ width: 100 }} />
      </div>

      {/* ── FORM ── */}
      <div className={styles.contentContainer}>
        <h1 className={styles.pageTitle}>+ Tambah Informasi Baru</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* ── FOTO ── */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>📷 FOTO</div>

            {form.media.length > 0 && (
              <div className={styles.photoPreview}>
                <img src={form.media[previewSlide]} alt="preview" />
                {form.media.length > 1 && (
                  <div className={styles.slideControls}>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewSlide(
                          (s) => (s - 1 + form.media.length) % form.media.length
                        )
                      }
                    >
                      ‹
                    </button>
                    <span>{previewSlide + 1} / {form.media.length}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewSlide((s) => (s + 1) % form.media.length)
                      }
                    >
                      ›
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className={styles.btnRemovePhoto}
                  onClick={() => removePhoto(previewSlide)}
                >
                  Hapus foto ini
                </button>
              </div>
            )}

            {form.media.length > 1 && (
              <div className={styles.thumbRow}>
                {form.media.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    className={`${styles.thumb} ${
                      i === previewSlide ? styles.thumbActive : ''
                    }`}
                    onClick={() => setPreviewSlide(i)}
                    alt={`foto ${i + 1}`}
                  />
                ))}
              </div>
            )}

            <label className={styles.uploadLabel}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className={styles.hiddenInput}
              />
              <span>
                📁 Unggah foto {form.media.length > 0 ? '(tambah lagi)' : ''}
              </span>
            </label>
          </div>

          <div className={styles.formGroup}>
            <label>JUDUL INFORMASI</label>
            <input
              type="text"
              required
              placeholder="Masukkan judul informasi"
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>KATEGORI</label>
            <select
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
            >
              <option value="Pengumuman">Pengumuman</option>
              <option value="Berita">Berita</option>
              <option value="Kegiatan">Kegiatan</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>TIMELINE</label>
            <input
              type="text"
              placeholder="Masukkan timeline acara"
              value={form.timeline}
              onChange={(e) => setForm({ ...form, timeline: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>DESKRIPSI</label>
            <textarea
              required
              rows={5}
              placeholder="Masukkan deskripsi informasi"
              value={form.isi}
              onChange={(e) => setForm({ ...form, isi: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>CONTACT PERSON</label>
            <input
              type="text"
              placeholder="Masukkan contact person"
              value={form.contactPerson}
              onChange={(e) =>
                setForm({ ...form, contactPerson: e.target.value })
              }
            />
          </div>

          <div className={styles.formGroup}>
            <label>JUDUL LINK TERKAIT</label>
            <input
              type="text"
              placeholder="Masukkan judul link terkait"
              value={form.judulLinkTerkait}
              onChange={(e) =>
                setForm({ ...form, judulLinkTerkait: e.target.value })
              }
            />
          </div>

          <div className={styles.formGroup}>
            <label>LINK TERKAIT</label>
            <input
              type="url"
              placeholder="Masukkan link terkait"
              value={form.linkTerkait}
              onChange={(e) =>
                setForm({ ...form, linkTerkait: e.target.value })
              }
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => router.push('/admin/info')}
            >
              Batal
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : '💾 Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
