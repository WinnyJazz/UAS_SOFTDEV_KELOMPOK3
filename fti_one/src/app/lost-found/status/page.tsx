'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './status.module.css';
import ChatPanel from '@/component/ChatPanel';

interface ClaimItem {
  claimId: string;
  barangId: { nama: string; lokasi: string; foto: string | null } | null; 
  namaBarang?: string;
  lokasiBarang?: string;
  status: string;
  tanggal: string;
  catatan?: string;
}

interface ChatInfo {
  chatId: string;
  konteksType: string;
  konteksId: string;
  pesan: { pengirim: string; isi: string; waktu: string }[];
}

const statusClaimConfig: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  pending: { label: 'Menunggu', color: '#FCD34D', icon: '⏳', desc: 'Klaimmu sedang ditinjau oleh admin DPM.' },
  disetujui: { label: 'Disetujui', color: '#6EE7B7', icon: '✅', desc: 'Klaimmu disetujui! Segera ambil barangmu.' },
  ditolak: { label: 'Ditolak', color: '#FCA5A5', icon: '❌', desc: 'Klaimmu tidak disetujui oleh admin.' },
  selesai: { label: 'Selesai', color: '#a78bfa', icon: '🎉', desc: 'Barang telah berhasil dikembalikan.' },
};

export default function StatusPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [myChats, setMyChats] = useState<ChatInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openChatId, setOpenChatId] = useState<string | null>(null);

  const token = useCallback(() => localStorage.getItem('token') || '', []);

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/chat/mine', {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setMyChats(data.data);
    } catch (_) {}
  }, [token]);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    const init = async () => {
      setLoading(true);
      const t = token();
      await Promise.all([
        fetch('http://localhost:5000/api/claim/mine', { headers: { Authorization: `Bearer ${t}` } })
          .then((r) => r.json())
          .then((d) => { if (d.success) setClaims(d.data); }),
        fetchChats(),
      ]);
      setLoading(false);
    };
    init();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [router, token, fetchChats]);

  const getChatFor = (id: string) => myChats.find((c) => c.konteksId === id) || null;
  const hasUnread = (id: string) => {
    const chat = getChatFor(id);
    return !!(chat && chat.pesan.length > 0 && chat.pesan[chat.pesan.length - 1].pengirim === 'admin');
  };

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
                const chatOn = !!getChatFor(claim.claimId);
                const unread = hasUnread(claim.claimId);
                const isOpen = openChatId === claim.claimId;

                // Nama & lokasi: pakai field barang (dari populate), fallback ke snapshot
                const namaBarang = claim.barangId?.nama || claim.namaBarang || 'Barang tidak diketahui';
                const lokasiBarang = claim.barangId?.lokasi || claim.lokasiBarang || null;
                const fotoBarang = claim.barangId?.foto || null;

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
                        <button
                          className={`${styles.btnChat} ${unread ? styles.btnChatUnread : ''}`}
                          onClick={() => setOpenChatId(isOpen ? null : claim.claimId)}
                        >
                          {unread ? '💬 Pesan Baru!' : '💬 Chat'}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ marginTop: 8 }}>
                        <ChatPanel
                          konteksType="claim"
                          konteksId={claim.claimId}
                          userId=""
                          role="mahasiswa"
                          itemName={namaBarang}
                          onClose={() => setOpenChatId(null)}
                        />
                      </div>
                    )}
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