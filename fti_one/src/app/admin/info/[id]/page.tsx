'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './detail.module.css';

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

export default function AdminInfoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [info, setInfo] = useState<InfoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);

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
      if (data.success) setInfo(data.data);
    } catch (err) {
      console.error('Gagal fetch detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Apakah kamu yakin ingin menghapus informasi ini?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/informasi/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert('Berhasil dihapus!');
        router.push('/admin/info');
      } else {
        alert(data.message || 'Gagal menghapus');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Memuat detail...</span>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.notFound}>
          <div className={styles.notFoundIcon}>🔍</div>
          <p>Informasi tidak ditemukan.</p>
          <button className={styles.btnBack} onClick={() => router.push('/admin/info')}>
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  const rawMedia = Array.isArray(info.media)
    ? info.media
    : typeof info.media === 'string' && info.media
    ? [info.media]
    : [];

  const photos =
    rawMedia.length > 0
      ? rawMedia
      : [`https://via.placeholder.com/800x600/1e0050/ffffff?text=${encodeURIComponent(info.judul)}`];

  return (
    <div className={styles.pageWrapper}>
      {/* ── HEADER ── */}
      <div className={styles.adminHeader}>
        <button className={styles.btnBack} onClick={() => router.push('/admin/info')}>
          ← Kembali
        </button>
        <div className={styles.headerTitle}>
          <span className={styles.headerBadge}>ADMIN</span>
          <span>Detail Informasi</span>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.btnEdit}
            onClick={() => router.push(`/admin/info/edit/${id}`)}
          >
            ✏️ Edit
          </button>
          <button className={styles.btnDelete} onClick={handleDelete}>
            🗑️ Hapus
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className={styles.contentContainer}>
        {/* Kategori */}
        <span className={styles.kategori}>{info.kategori}</span>

        {/* Judul */}
        <h1 className={styles.judul}>{info.judul}</h1>
        <p className={styles.tanggal}>{formatDate(info.tanggal)}</p>

        {/* Slideshow */}
        <div className={styles.slideshowWrapper}>
          <img src={photos[slide]} alt={info.judul} className={styles.mainPhoto} />
          {photos.length > 1 && (
            <>
              <button
                className={`${styles.slideBtn} ${styles.slidePrev}`}
                onClick={() => setSlide((s) => (s - 1 + photos.length) % photos.length)}
              >
                ‹
              </button>
              <button
                className={`${styles.slideBtn} ${styles.slideNext}`}
                onClick={() => setSlide((s) => (s + 1) % photos.length)}
              >
                ›
              </button>
              <div className={styles.dots}>
                {photos.map((_p, i) => (
                  <span
                    key={i}
                    className={`${styles.dot} ${i === slide ? styles.dotActive : ''}`}
                    onClick={() => setSlide(i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className={styles.thumbRow}>
            {photos.map((src, i) => (
              <img
                key={i}
                src={src}
                className={`${styles.thumb} ${i === slide ? styles.thumbActive : ''}`}
                onClick={() => setSlide(i)}
                alt={`foto ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Info rows */}
        <div className={styles.infoGrid}>
          {info.timeline && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>📅 Timeline</span>
              <span className={styles.infoValue}>{info.timeline}</span>
            </div>
          )}
          {info.contactPerson && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>📞 Contact Person</span>
              <span className={styles.infoValue}>{info.contactPerson}</span>
            </div>
          )}
          {info.linkTerkait && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>🔗 Link Terkait</span>
              <a
                href={info.linkTerkait}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.infoLink}
              >
                {info.judulLinkTerkait || info.linkTerkait}
              </a>
            </div>
          )}
        </div>

        {/* Deskripsi */}
        <div className={styles.deskripsiSection}>
          <h2 className={styles.deskripsiTitle}>Deskripsi</h2>
          <p className={styles.deskripsi}>{info.isi}</p>
        </div>
      </div>
    </div>
  );
}
