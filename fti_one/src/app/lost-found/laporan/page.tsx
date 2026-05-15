'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './laporan.module.css';

export default function LaporanBarangHilang() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    namaBarang: '',
    deskripsi: '',
    lokasi: '',
    tanggal: new Date().toISOString().split('T')[0],
    foto: null as string | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
  }, [router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setForm((prev) => ({ ...prev, foto: base64 }));
      setPreviewUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.namaBarang.trim() || !form.lokasi.trim()) {
      alert('Nama barang dan lokasi wajib diisi!');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/laporan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.message || 'Gagal mengirim laporan.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✅</div>
          <h2>Laporan Terkirim!</h2>
          <p>Tim DPM FTI telah menerima laporanmu. Kami akan segera mencari barangmu dan memberikan update status.</p>
          <div className={styles.successActions}>
            <button className={styles.btnPrimary} onClick={() => router.push('/lost-found/status')}>
              Lihat Status
            </button>
            <button className={styles.btnSecondary} onClick={() => router.push('/lost-found')}>
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>
        {/* Back button */}
        <button className={styles.btnBack} onClick={() => router.back()}>
          ← Kembali
        </button>

        <div className={styles.pageHeader}>
          <div className={styles.headerIcon}>🔍</div>
          <h1 className={styles.pageTitle}>Laporkan Barang Hilang</h1>
          <p className={styles.pageSubtitle}>
            Isi formulir berikut agar tim DPM FTI dapat membantu mencari barangmu
          </p>
        </div>

        <div className={styles.formCard}>
          {/* Photo upload */}
          <div className={styles.photoSection}>
            <div
              className={styles.photoPreview}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <span className={styles.photoIcon}>📷</span>
                  <span>Klik untuk upload foto barang</span>
                  <span className={styles.photoHint}>JPG, PNG (opsional)</span>
                </div>
              )}
              {previewUrl && (
                <div className={styles.photoOverlay}>
                  <span>Ganti Foto</span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          {/* Form fields */}
          <div className={styles.formFields}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nama Barang <span className={styles.required}>*</span></label>
              <input
                type="text"
                className={styles.input}
                placeholder="Cth: Laptop HP warna hitam"
                value={form.namaBarang}
                onChange={(e) => setForm({ ...form, namaBarang: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Deskripsi Barang</label>
              <textarea
                className={styles.textarea}
                placeholder="Cth: Laptop hitam dengan stiker di sudut kanan, charger putih bawaan..."
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                rows={3}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Terakhir Dilihat Di <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Cth: Kantin lantai 2, R.904 Lt.9"
                  value={form.lokasi}
                  onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Tanggal Hilang</label>
                <input
                  type="date"
                  className={styles.input}
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.infoBox}>
              <span>ℹ️</span>
              <p>Laporan kamu akan langsung diterima oleh tim DPM FTI. Status laporan bisa kamu pantau di halaman <strong>Status & Notifikasi</strong>.</p>
            </div>

            <button
              className={styles.btnSubmit}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <span className={styles.spinner} />
              ) : (
                '📤 Kirim Laporan'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
