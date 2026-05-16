'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './status.module.css';
import ChatPanel from '@/component/ChatPanel';

interface ClaimItem {
  claimId: string;
  barangId: { nama: string; lokasi: string; foto: string } | null;
  status: string;
  tanggal: string;
  catatan?: string;
}

interface LaporanItem {
  laporanId: string;
  namaBarang: string;
  deskripsi: string;
  lokasi: string;
  tanggal: string;
  foto: string | null;
  status: string;
  pesanAdmin: string | null;
}

interface ChatInfo {
  chatId: string;
  konteksType: string;
  konteksId: string;
  pesan: { pengirim: string; isi: string; waktu: string }[];
}

const statusClaimConfig: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  pending:   { label: 'Menunggu',  color: '#FCD34D', icon: '⏳', desc: 'Klaimmu sedang ditinjau oleh admin DPM.' },
  disetujui: { label: 'Disetujui', color: '#6EE7B7', icon: '✅', desc: 'Klaimmu disetujui! Segera ambil barangmu.' },
  ditolak:   { label: 'Ditolak',   color: '#FCA5A5', icon: '❌', desc: 'Klaimmu tidak disetujui oleh admin.' },
  selesai:   { label: 'Selesai',   color: '#a78bfa', icon: '🎉', desc: 'Barang telah berhasil dikembalikan.' },
};

const statusLaporanConfig: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  pending:   { label: 'Diterima DPM', color: '#FCD34D', icon: '📋', desc: 'Laporanmu telah diterima oleh Tim DPM FTI.' },
  diterima:  { label: 'Diproses',     color: '#60A5FA', icon: '🔍', desc: 'Tim DPM sedang aktif mencari barangmu.' },
  ditemukan: { label: 'Ditemukan!',   color: '#6EE7B7', icon: '🎊', desc: 'Barang hilangmu telah ditemukan oleh Tim DPM FTI.' },
};

export default function StatusPage() {
  const router = useRouter();
  const [claims, setClaims]     = useState<ClaimItem[]>([]);
  const [laporan, setLaporan]   = useState<LaporanItem[]>([]);
  const [myChats, setMyChats]   = useState<ChatInfo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'klaim' | 'laporan'>('klaim');
  const [openChatId, setOpenChatId] = useState<string | null>(null);

  const token = useCallback(() => localStorage.getItem('token') || '', []);

  const fetchChats = useCallback(async () => {
    try {
      const res  = await fetch('http://localhost:5000/api/chat/mine', { headers: { Authorization: `Bearer ${token()}` } });
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
        fetch('http://localhost:5000/api/claim/mine',   { headers: { Authorization: `Bearer ${t}` } })
          .then((r) => r.json()).then((d) => { if (d.success) setClaims(d.data); }),
        fetch('http://localhost:5000/api/laporan/mine', { headers: { Authorization: `Bearer ${t}` } })
          .then((r) => r.json()).then((d) => { if (d.success) setLaporan(d.data); }),
        fetchChats(),
      ]);
      setLoading(false);
    };
    init();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [router, token, fetchChats]);

  const getChatFor   = (id: string) => myChats.find((c) => c.konteksId === id) || null;
  const hasUnread    = (id: string) => {
    const chat = getChatFor(id);
    return !!(chat && chat.pesan.length > 0 && chat.pesan[chat.pesan.length - 1].pengirim === 'admin');
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>
        <button className={styles.btnBack} onClick={() => router.push('/lost-found')}>← Lost &amp; Found</button>

        <div className={styles.pageHeader}>
          <div className={styles.headerIcon}>🔔</div>
          <h1 className={styles.pageTitle}>Status &amp; Notifikasi</h1>
          <p className={styles.pageSubtitle}>Pantau status klaimmu dan laporan barang hilang</p>
        </div>

        <div className={styles.tabBar}>
          <button className={`${styles.tab} ${activeTab === 'klaim' ? styles.tabActive : ''}`} onClick={() => setActiveTab('klaim')}>
            🏷️ Klaim Barang ({claims.length})
          </button>
          <button className={`${styles.tab} ${activeTab === 'laporan' ? styles.tabActive : ''}`} onClick={() => setActiveTab('laporan')}>
            📋 Laporan Hilang ({laporan.length})
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /><span>Memuat data...</span></div>
        ) : (
          <>
            {/* CLAIMS TAB */}
            {activeTab === 'klaim' && (
              <div className={styles.cardList}>
                {claims.length === 0 ? (
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>🏷️</div>
                    <p>Kamu belum pernah mengajukan klaim.</p>
                    <button className={styles.btnPrimary} onClick={() => router.push('/lost-found')}>Lihat Barang Temuan</button>
                  </div>
                ) : (
                  claims.map((claim) => {
                    const cfg    = statusClaimConfig[claim.status] || statusClaimConfig.pending;
                    const chatOn = !!getChatFor(claim.claimId);
                    const unread = hasUnread(claim.claimId);
                    const isOpen = openChatId === claim.claimId;
                    return (
                      <div key={claim.claimId}>
                        <div className={styles.notifCard} style={{ '--accent': cfg.color } as React.CSSProperties}>
                          <div className={styles.cardImage}>
                            {claim.barangId?.foto
                              ? <img src={claim.barangId.foto} alt={claim.barangId?.nama} />
                              : <div className={styles.cardImagePlaceholder}>📦</div>}
                          </div>
                          <div className={styles.cardInfo}>
                            <div className={styles.cardItemName}>{claim.barangId?.nama || 'Barang Terhapus'}</div>
                            {claim.barangId?.lokasi && <div className={styles.cardMeta}>📍 {claim.barangId.lokasi}</div>}
                            <div className={styles.cardMeta}>🕐 {fmt(claim.tanggal)}</div>
                            <div className={styles.cardDesc}>{cfg.desc}</div>
                          </div>
                          <div className={styles.cardStatus}>
                            <div className={styles.statusIcon}>{cfg.icon}</div>
                            <div className={styles.statusLabel} style={{ color: cfg.color }}>{cfg.label}</div>
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
                              itemName={claim.barangId?.nama}
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

            {/* LAPORAN TAB */}
            {activeTab === 'laporan' && (
              <div className={styles.cardList}>
                {laporan.length === 0 ? (
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📋</div>
                    <p>Kamu belum pernah membuat laporan barang hilang.</p>
                    <button className={styles.btnPrimary} onClick={() => router.push('/lost-found/laporan')}>Laporkan Barang Hilang</button>
                  </div>
                ) : (
                  laporan.map((item) => {
                    const cfg    = statusLaporanConfig[item.status] || statusLaporanConfig.pending;
                    const chatOn = !!getChatFor(item.laporanId);
                    const unread = hasUnread(item.laporanId);
                    const isOpen = openChatId === item.laporanId;
                    return (
                      <div key={item.laporanId}>
                        <div className={styles.notifCard} style={{ '--accent': cfg.color } as React.CSSProperties}>
                          <div className={styles.cardImage}>
                            {item.foto
                              ? <img src={item.foto} alt={item.namaBarang} />
                              : <div className={styles.cardImagePlaceholder}>🔍</div>}
                          </div>
                          <div className={styles.cardInfo}>
                            <div className={styles.cardItemName}>{item.namaBarang}</div>
                            {item.deskripsi && <div className={styles.cardDesc}>{item.deskripsi}</div>}
                            <div className={styles.cardMeta}>📍 Terakhir di: {item.lokasi}</div>
                            <div className={styles.cardMeta}>🕐 {fmt(item.tanggal)}</div>
                            <div className={styles.cardDescStatus}>{cfg.desc}</div>
                            {item.pesanAdmin && (
                              <div className={styles.adminMessage}><span>💬</span><span>{item.pesanAdmin}</span></div>
                            )}
                          </div>
                          <div className={styles.cardStatus}>
                            <div className={styles.statusIcon}>{cfg.icon}</div>
                            <div className={styles.statusLabel} style={{ color: cfg.color }}>{cfg.label}</div>
                            <button
                              className={`${styles.btnChat} ${unread ? styles.btnChatUnread : ''}`}
                              onClick={() => setOpenChatId(isOpen ? null : item.laporanId)}
                            >
                              {unread ? '💬 Pesan Baru!' : '💬 Chat'}
                            </button>
                          </div>
                        </div>
                        {isOpen && (
                          <div style={{ marginTop: 8 }}>
                            <ChatPanel
                              konteksType="laporan"
                              konteksId={item.laporanId}
                              userId=""
                              role="mahasiswa"
                              itemName={item.namaBarang}
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
          </>
        )}

        <button className={styles.fab} onClick={() => router.push('/lost-found/laporan')}>+</button>
      </div>
    </div>
  );
}
