'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './edit.module.css';

interface InfoItem {
  informasiId: string;
  _id?: string;
  judul: string;
  isi: string;
  media: string[];
  tanggal: string;
  kategori: string;
  timeline?: string;
  contactPerson?: string;
  judulLinkTerkait?: string;
  linkTerkait?: string;
}

export default function AdminInfoEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    judul: '',
    isi: '',
    kategori: 'Pengumuman',
    timeline: '',
    contactPerson: '',
    judulLinkTerkait: '',
    linkTerkait: '',
  });

  // URL Cloudinary lama yang masih dipertahankan
  const [keepMedia, setKeepMedia] = useState<string[]>([]);
  // File baru yang mau diupload
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  // Gabungan untuk slideshow preview: keepMedia + newPreviews
  const allPreviews = [...keepMedia, ...newPreviews];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || (user.role !== 'admin' && user.role !== 'superadmin')) {
      router.push('/login');
      return;
    }
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/informasi/${id}`);
      const data = await res.json();
      if (data.success) {
        const info: InfoItem = data.data;
        setForm({
          judul: info.judul,
          isi: info.isi,
          kategori: info.kategori,
          timeline: info.timeline || '',
          contactPerson: info.contactPerson || '',
          judulLinkTerkait: info.judulLinkTerkait || '',
          linkTerkait: info.linkTerkait || '',
        });
        // Semua media lama di-keep dulu
        setKeepMedia(
          Array.isArray(info.media) ? info.media : info.media ? [info.media as unknown as string] : []
        );
      }
    } catch (err) {
      console.error('Gagal fetch detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...previews]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePhoto = (idx: number) => {
    if (idx < keepMedia.length) {
      // Hapus dari keepMedia (URL Cloudinary lama)
      setKeepMedia((prev) => prev.filter((_, i) => i !== idx));
    } else {
      // Hapus dari file baru
      const newIdx = idx - keepMedia.length;
      setNewFiles((prev) => prev.filter((_, i) => i !== newIdx));
      setNewPreviews((prev) => {
        URL.revokeObjectURL(prev[newIdx]);
        return prev.filter((_, i) => i !== newIdx);
      });
    }
    setPreviewSlide((s) => Math.min(s, allPreviews.length - 2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const formData = new FormData();
      formData.append('judul', form.judul);
      formData.append('isi', form.isi);
      formData.append('kategori', form.kategori);
      formData.append('timeline', form.timeline);
      formData.append('contactPerson', form.contactPerson);
      formData.append('judulLinkTerkait', form.judulLinkTerkait);
      formData.append('linkTerkait', form.linkTerkait);
      formData.append('adminId', user.adminId || user.id || 'admin');

      // Kirim URL lama yang masih dipertahankan
      keepMedia.forEach((url) => formData.append('keepMedia', url));

      // Kirim file baru
      newFiles.forEach((file) => formData.append('media', file));

      const res = await fetch(`http://localhost:5000/api/informasi/${id}`, {
        method: 'PUT',
        headers: {
          // Jangan set Content-Type, biar browser set boundary otomatis
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert('Informasi berhasil diperbarui!');
        router.push(`/admin/info/${id}`);
      } else {
        alert(data.message || 'Gagal menyimpan');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Memuat data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* ── HEADER ── */}
      <div className={styles.adminHeader}>
        <button className={styles.btnBack} onClick={() => router.push(`/admin/info/${id}`)}>
          ← Batal
        </button>
        <div className={styles.headerTitle}>
          <span className={styles.headerBadge}>ADMIN</span>
          <span>Edit Informasi</span>
        </div>
        <div style={{ width: 100 }} />
      </div>

      {/* ── FORM ── */}
      <div className={styles.contentContainer}>
        <h1 className={styles.pageTitle}>✏️ Edit Informasi</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* ── FOTO ── */}
          <div className={styles.formSection}>
            <div className={styles.sectionLabel}>📷 FOTO</div>

            {allPreviews.length > 0 && (
              <div className={styles.photoPreview}>
                <img src={allPreviews[previewSlide]} alt="preview" />
                {allPreviews.length > 1 && (
                  <div className={styles.slideControls}>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewSlide((s) => (s - 1 + allPreviews.length) % allPreviews.length)
                      }
                    >‹</button>
                    <span>{previewSlide + 1} / {allPreviews.length}</span>
                    <button
                      type="button"
                      onClick={() => setPreviewSlide((s) => (s + 1) % allPreviews.length)}
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

            {allPreviews.length > 1 && (
              <div className={styles.thumbRow}>
                {allPreviews.map((src, i) => (
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
              <span>📁 Unggah foto {allPreviews.length > 0 ? '(tambah lagi)' : ''}</span>
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
              onClick={() => router.push(`/admin/info/${id}`)}
            >
              Batal
            </button>
            <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
