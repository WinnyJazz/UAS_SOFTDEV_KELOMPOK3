'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './tambah.module.css';

export default function AdminInfoTambahPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Simpan File asli, bukan base64
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    judul: '',
    isi: '',
    kategori: 'Pengumuman',
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
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setMediaFiles((prev) => [...prev, ...files]);
    setMediaPreviews((prev) => [...prev, ...newPreviews]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (idx: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx));
    setMediaPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]); // bebaskan memory
      return prev.filter((_, i) => i !== idx);
    });
    setPreviewSlide((s) => Math.min(s, mediaPreviews.length - 2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      // Kirim sebagai FormData, bukan JSON
      const formData = new FormData();
      formData.append('judul', form.judul);
      formData.append('isi', form.isi);
      formData.append('kategori', form.kategori);
      formData.append('timeline', form.timeline);
      formData.append('contactPerson', form.contactPerson);
      formData.append('judulLinkTerkait', form.judulLinkTerkait);
      formData.append('linkTerkait', form.linkTerkait);
      formData.append('adminId', user.adminId || user.id || 'admin');

      mediaFiles.forEach((file) => formData.append('media', file));

      const res = await fetch('http://localhost:5000/api/informasi', {
        method: 'POST',
        headers: {
          // Jangan set Content-Type, biar browser set boundary otomatis
          Authorization: `Bearer ${token}`,
        },
        body: formData,
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
        <button className={styles.btnBack} onClick={() => router.push('/admin/info')}>
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

        <div onSubmit={handleSubmit} className={styles.form}>
          {/* ── FOTO ── */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>📷 FOTO</div>

            {mediaPreviews.length > 0 && (
              <div className={styles.photoPreview}>
                <img src={mediaPreviews[previewSlide]} alt="preview" />
                {mediaPreviews.length > 1 && (
                  <div className={styles.slideControls}>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewSlide((s) => (s - 1 + mediaPreviews.length) % mediaPreviews.length)
                      }
                    >‹</button>
                    <span>{previewSlide + 1} / {mediaPreviews.length}</span>
                    <button
                      type="button"
                      onClick={() => setPreviewSlide((s) => (s + 1) % mediaPreviews.length)}
                    >›</button>
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

            {mediaPreviews.length > 1 && (
              <div className={styles.thumbRow}>
                {mediaPreviews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    className={`${styles.thumb} ${i === previewSlide ? styles.thumbActive : ''}`}
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
              <span>📁 Unggah foto {mediaPreviews.length > 0 ? '(tambah lagi)' : ''}</span>
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
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>JUDUL LINK TERKAIT</label>
            <input
              type="text"
              placeholder="Masukkan judul link terkait"
              value={form.judulLinkTerkait}
              onChange={(e) => setForm({ ...form, judulLinkTerkait: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>LINK TERKAIT</label>
            <input
              type="url"
              placeholder="Masukkan link terkait"
              value={form.linkTerkait}
              onChange={(e) => setForm({ ...form, linkTerkait: e.target.value })}
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
              type="button"
              className={styles.btnSubmit}
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Menyimpan...' : '💾 Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}