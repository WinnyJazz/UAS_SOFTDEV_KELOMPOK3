'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './info.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface InfoItem {
  informasiId: string;
  _id?: string;
  judul: string;
  isi: string;
  media: string[];
  tanggal: string;
  kategori: string;
}

function InfoCard({ info }: { info: InfoItem }) {
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
      : [`https://via.placeholder.com/400x500/1e0050/ffffff?text=${encodeURIComponent(info.judul)}`];

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
      day: 'numeric', month: 'long', year: 'numeric',
    });

  const id = info.informasiId || info._id!;

  return (
    <div className={styles.card}>
      <span className={styles.kategori}>{info.kategori}</span>

      <div className={styles.imageWrapper}>
        <img src={photos[slide]} alt={info.judul} />
        {photos.length > 1 && (
          <>
            <button className={`${styles.slideBtn} ${styles.slidePrev}`} onClick={prev}>‹</button>
            <button className={`${styles.slideBtn} ${styles.slideNext}`} onClick={next}>›</button>
            <div className={styles.dots}>
              {photos.map((_p, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${i === slide ? styles.dotActive : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSlide(i); }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <h3 className={styles.cardTitle}>{info.judul}</h3>
      <p className={styles.cardDate}>{formatDate(info.tanggal)}</p>

      <button
        className={styles.btnMore}
        onClick={() => router.push(`/info/${id}`)}
      >
        MORE DETAILS
      </button>
    </div>
  );
}

export default function PublicInfo() {
  const [infos, setInfos] = useState<InfoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInfos();
  }, []);

  const fetchInfos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/informasi`);
      const data = await res.json();
      if (data.success) setInfos(data.data);
    } catch (err) {
      console.error('Gagal mengambil data informasi:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
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
          <div className={styles.empty}>Belum ada informasi yang tersedia saat ini.</div>
        ) : (
          <div className={styles.gridContainer}>
            {infos.map((info) => (
              <InfoCard key={info.informasiId || info._id} info={info} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
