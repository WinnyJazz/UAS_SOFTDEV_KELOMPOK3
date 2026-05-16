'use client';

import { useEffect, useState } from 'react';
import styles from './info.module.css';

interface InfoItem {
  informasiId: string;
  _id?: string;
  judul: string;
  isi: string;
  media: string;
  tanggal: string;
  kategori: string;
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
      const res = await fetch('http://localhost:5000/api/informasi');
      const data = await res.json();
      
      if (data.success) {
        setInfos(data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data informasi:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.contentContainer}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.mainTitle}>INFORMASI TERKINI</h1>
        </div>

        {loading ? (
          <div className={styles.loading}>Memuat informasi...</div>
        ) : infos.length === 0 ? (
          <div className={styles.empty}>Belum ada informasi yang tersedia saat ini.</div>
        ) : (
          <div className={styles.gridContainer}>
            {infos.map((info) => (
              <div key={info.informasiId || info._id} className={styles.card}>
                <div className={styles.imageWrapper}>
                  <img 
                    src={info.media || `https://via.placeholder.com/400x500/1e0050/ffffff?text=${encodeURIComponent(info.judul)}`} 
                    alt={info.judul} 
                  />
                </div>
                
                <h3 className={styles.cardTitle}>{info.judul}</h3>
                <p className={styles.cardDate}>{formatDate(info.tanggal)}</p>
                
                <button className={styles.btnMore}>
                  MORE DETAILS
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}