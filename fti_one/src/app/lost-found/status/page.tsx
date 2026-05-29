'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './status.module.css';

interface ClaimItem {
  claimId: string;
  barangId: { nama: string; lokasi: string; foto: string | null } | null;
  namaBarang?: string;
  lokasiBarang?: string;
  status: string;
  tanggal: string;
  catatan?: string;
}

const statusClaimConfig: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  pending:   { label: 'Menunggu',  color: '#FCD34D', icon: '⏳', desc: 'Klaimmu sedang ditinjau oleh admin DPM.' },
  disetujui: { label: 'Disetujui', color: '#6EE7B7', icon: '✅', desc: 'Klaimmu disetujui! Segera ambil barangmu.' },
  ditolak:   { label: 'Ditolak',   color: '#FCA5A5', icon: '❌', desc: 'Klaimmu tidak disetujui oleh admin.' },
  selesai:   { label: 'Selesai',   color: '#a78bfa', icon: '🎉', desc: 'Barang telah berhasil dikembalikan.' },
};

export default function StatusPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);

  const token = useCallback(() => localStorage.getItem('token') || '', []);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }

    const init = async () => {
      setLoading(true);
      const t = token();
      await fetch('http://localhost:5000/api/claim/mine', {
        headers: { Authorization: `Bearer ${t}` },
      })
        .then((r) => r.json())
        .then((d) => { if (d.success) setClaims(d.data); });
      setLoading(false);
    };

    init();
  }, [router, token]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>
        <button className={styles.btnBack} onClick={() => router.push('/lost-found')}>
          ← Lost &amp; Found
        </button>

        <div className={styles.pageHeader}>
          <div className={styles.headerIcon}>🔔</div>
          <h1 className={styles.pageTitle}>Status &amp; Notifikasi</h1>
          <p className={styles.pageSubtitle}>Pantau status klaimmu</p>
        </div>

        <button className={`${styles.tab} ${styles.tabActive}`}>
          🏷️ Klaim Barang ({claims.length})
        </button>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Memuat data...</span>
          </div>
        ) : (
          <div className={styles.cardList}>
            {claims.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🏷️</div>
                <p>Kamu belum pernah mengajukan klaim.</p>
                <button className={styles.btnPrimary} onClick={() => router.push('/lost-found')}>
                  Lihat Barang Temuan
                </button>
              </div>
            ) : (
              claims.map((claim) => {
                const cfg = statusClaimConfig[claim.status] || statusClaimConfig.pending;
                const namaBarang  = claim.barangId?.nama   || claim.namaBarang  || 'Barang tidak diketahui';
                const lokasiBarang = claim.barangId?.lokasi || claim.lokasiBarang || null;
                const fotoBarang  = claim.barangId?.foto   || null;

                return (
                  <div key={claim.claimId}>
                    <div
                      className={styles.notifCard}
                      style={{ '--accent': cfg.color } as React.CSSProperties}
                    >
                      <div className={styles.cardImage}>
                        {fotoBarang
                          ? <img src={fotoBarang} alt={namaBarang} />
                          : <div className={styles.cardImagePlaceholder}>📦</div>}
                      </div>

                      <div className={styles.cardInfo}>
                        <div className={styles.cardItemName}>{namaBarang}</div>
                        {lokasiBarang && (
                          <div className={styles.cardMeta}>📍 {lokasiBarang}</div>
                        )}
                        <div className={styles.cardMeta}>🕐 {fmt(claim.tanggal)}</div>
                        <div className={styles.cardDesc}>{cfg.desc}</div>
                        {claim.catatan && (
                          <div className={styles.cardCatatan}>📝 {claim.catatan}</div>
                        )}
                      </div>

                      <div className={styles.cardStatus}>
                        <div className={styles.statusIcon}>{cfg.icon}</div>
                        <div className={styles.statusLabel} style={{ color: cfg.color }}>
                          {cfg.label}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}