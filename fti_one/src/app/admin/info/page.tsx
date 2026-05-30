'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './info.module.css';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

// ─── Kartu ─────────────────────────────────────────────────────────────────────
function InfoCard({
  info,
  onDelete,
}: {
  info: InfoItem;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [slide, setSlide] = useState(0);

  const rawMedia = Array.isArray(info.media)
    ? info.media
    : typeof info.media === 'string' && info.media
    ? [info.media]
    : [];

  const photos =
    rawMedia.length > 0
      ? rawMedia
      : [
          `https://via.placeholder.com/400x500/1e0050/ffffff?text=${encodeURIComponent(
            info.judul
          )}`,
        ];

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlide((s) => (s - 1 + photos.length) % photos.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlide((s) => (s + 1) % photos.length);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const id = info.informasiId || info._id!;

  return (
    <div className={styles.card}>
      {/* Kategori badge */}
      <span className={styles.kategori}>{info.kategori}</span>

      {/* Slideshow foto */}
      <div className={styles.imageWrapper}>
        <img src={photos[slide]} alt={info.judul} />
        {photos.length > 1 && (
          <>
            <button
              className={`${styles.slideBtn} ${styles.slidePrev}`}
              onClick={prev}
            >
              ‹
            </button>
            <button
              className={`${styles.slideBtn} ${styles.slideNext}`}
              onClick={next}
            >
              ›
            </button>
            <div className={styles.dots}>
              {photos.map((_photo, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${
                    i === slide ? styles.dotActive : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlide(i);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <h3 className={styles.cardTitle}>{info.judul}</h3>
      <p className={styles.cardDate}>{formatDate(info.tanggal)}</p>

      {/* ── Action Buttons ── */}
      <div className={styles.cardActions}>
        <button
          className={styles.btnDetail}
          onClick={() => router.push(`/admin/info/${id}`)}
        >
          👁️ Detail
        </button>
        <button
          className={styles.btnEdit}
          onClick={() => router.push(`/admin/info/edit/${id}`)}
        >
          ✏️ Edit
        </button>
        <button
          className={styles.btnDelete}
          onClick={() => onDelete(id)}
        >
          🗑️ Hapus
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminInfoPage() {
  const router = useRouter();
  const [infos, setInfos] = useState<InfoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || (user.role !== 'admin' && user.role !== 'superadmin')) {
      router.push('/login');
      return;
    }
    fetchInfos();
  }, [router]);

  const fetchInfos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/informasi`);
      const data = await res.json();
      if (data.success) setInfos(data.data);
    } catch (err) {
      console.error('Gagal fetch info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah kamu yakin ingin menghapus informasi ini?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/informasi/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert('Berhasil dihapus!');
        fetchInfos();
      } else {
        alert(data.message || 'Gagal menghapus');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ── HEADER ── */}
      <div className={styles.adminHeader}>
        {/* <button
          className={styles.btnBack}
          onClick={() => router.push('/admin/dashboard')}
        >
          ← Dashboard
        </button> */}
        <div className={styles.headerTitle}>
          <span className={styles.headerBadge}>ADMIN</span>
          <span>Manajemen Informasi</span>
        </div>
        <button
          className={styles.btnAdd}
          onClick={() => router.push('/admin/info/tambah')}
        >
          + Tambah Info
        </button>
      </div>

      {/* ── CONTENT ── */}
      <div className={styles.contentContainer}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.mainTitle}>INFORMASI TERKINI</h1>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Memuat informasi...</span>
          </div>
        ) : infos.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📭</div>
            <p>Belum ada informasi yang diunggah.</p>
            <button
              className={styles.btnEmptyAdd}
              onClick={() => router.push('/admin/info/tambah')}
            >
              + Tambah Pertama
            </button>
          </div>
        ) : (
          <div className={styles.gridContainer}>
            {infos.map((info) => (
              <InfoCard
                key={info.informasiId || info._id}
                info={info}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button
        className={styles.fab}
        onClick={() => router.push('/admin/info/tambah')}
        title="Tambah Info"
      >
        +
      </button>
    </div>
  );
}
