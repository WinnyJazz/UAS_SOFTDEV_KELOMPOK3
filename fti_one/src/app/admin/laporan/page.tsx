'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './laporan.module.css';
import ChatPanel from '@/component/ChatPanel';

interface LaporanItem {
  laporanId: string;
  userId: string;
  namaBarang: string;
  deskripsi: string;
  lokasi: string;
  tanggal: string;
  foto: string | null;
  status: string;
  pesanAdmin: string | null;
  user?: {
    nama: string;
    nim: string;
    nomorTelepon?: string;
  } | null;
}

const API_URL = 'http://localhost:5000/api/laporan';

const statusConfig: Record<string, { label: string; color: string; icon: string; next: string; nextLabel: string }> = {
  pending:   { label: 'Menunggu',  color: '#FCD34D', icon: '⏳', next: 'diterima',  nextLabel: 'Tandai Diproses' },
  diterima:  { label: 'Diproses',  color: '#60A5FA', icon: '🔍', next: 'ditemukan', nextLabel: 'Tandai Ditemukan' },
  ditemukan: { label: 'Ditemukan', color: '#6EE7B7', icon: '🎊', next: '',          nextLabel: '' },
};

function getInitials(name: string) {
  return (name || 'U')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export default function AdminLaporan() {
  const router = useRouter();
  const [laporan, setLaporan]       = useState<LaporanItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<LaporanItem | null>(null);
  const [pesanAdmin, setPesanAdmin] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [showChat, setShowChat]     = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!storedUser || !token) { router.push('/login'); return; }
    const user = JSON.parse(storedUser);
    if (user.role !== 'admin' && user.role !== 'superadmin') { router.push('/dashboard'); return; }
    fetchLaporan();
  }, [router]);

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setLaporan(data.data);
    } catch (err) {
      console.error('Fetch laporan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (laporanId: string, status: string) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/${laporanId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, pesanAdmin: pesanAdmin || null }),
      });
      const data = await res.json();
      if (data.success) {
        setSelected(null);
        setPesanAdmin('');
        fetchLaporan();
      } else {
        alert(data.message || 'Gagal update status');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const filtered = filterStatus === 'semua' ? laporan : laporan.filter((l) => l.status === filterStatus);

  const counts = {
    semua:    laporan.length,
    pending:  laporan.filter((l) => l.status === 'pending').length,
    diterima: laporan.filter((l) => l.status === 'diterima').length,
    ditemukan:laporan.filter((l) => l.status === 'ditemukan').length,
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Laporan Barang Hilang</h1>
            <p className={styles.subtitle}>Kelola laporan barang hilang dari mahasiswa</p>
          </div>
          <button className={styles.btnBack} onClick={() => router.push('/admin/lost-found')}>
            ← Lost &amp; Found
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className={styles.statsRow}>
            {[
              { key: 'semua',    label: 'Total',     color: '#c4b5fd', icon: '📋' },
              { key: 'pending',  label: 'Menunggu',  color: '#FCD34D', icon: '⏳' },
              { key: 'diterima', label: 'Diproses',  color: '#60A5FA', icon: '🔍' },
              { key: 'ditemukan',label: 'Ditemukan', color: '#6EE7B7', icon: '🎊' },
            ].map((s) => (
              <button
                key={s.key}
                className={`${styles.statCard} ${filterStatus === s.key ? styles.statCardActive : ''}`}
                onClick={() => setFilterStatus(s.key)}
              >
                <div className={styles.statIcon}>{s.icon}</div>
                <div className={styles.statNumber} style={{ color: s.color }}>
                  {counts[s.key as keyof typeof counts]}
                </div>
                <div className={styles.statLabel}>{s.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Memuat laporan...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📋</div>
            <p>Tidak ada laporan{filterStatus !== 'semua' ? ` dengan status "${filterStatus}"` : ''}.</p>
          </div>
        ) : (
          <div className={styles.cardList}>
            {filtered.map((item) => {
              const cfg = statusConfig[item.status] || statusConfig.pending;
              return (
                <div
                  key={item.laporanId}
                  className={styles.reportCard}
                  style={{ '--accent': cfg.color } as React.CSSProperties}
                >
                  {/* Photo */}
                  <div className={styles.cardPhoto}>
                    {item.foto ? (
                      <img src={item.foto} alt={item.namaBarang} />
                    ) : (
                      <div className={styles.cardPhotoPlaceholder}>🔍</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className={styles.cardInfo}>
                    <div className={styles.cardItemName}>{item.namaBarang}</div>
                    {item.deskripsi && (
                      <div className={styles.cardDesc}>{item.deskripsi}</div>
                    )}
                    <div className={styles.cardMetas}>
                      <span>👤 {item.user?.nama || 'Unknown'} · {item.user?.nim || '-'}</span>
                      <span>📍 {item.lokasi}</span>
                      <span>🕐 {formatDate(item.tanggal)}</span>
                    </div>
                    {item.pesanAdmin && (
                      <div className={styles.adminMsgPreview}>
                        💬 {item.pesanAdmin}
                      </div>
                    )}
                  </div>

                  {/* Status + Action */}
                  <div className={styles.cardRight}>
                    <div className={styles.statusPill} style={{ color: cfg.color, borderColor: `${cfg.color}44`, background: `${cfg.color}18` }}>
                      {cfg.icon} {cfg.label}
                    </div>
                    <button className={styles.btnDetail} onClick={() => { setSelected(item); setPesanAdmin(item.pesanAdmin || ''); }}>
                      DETAIL
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {selected && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) { setSelected(null); setPesanAdmin(''); setShowChat(false); } }}>
          <div className={styles.modal}>
            <button className={styles.modalClose} onClick={() => { setSelected(null); setPesanAdmin(''); setShowChat(false); }}>✕</button>

            <div className={styles.modalHeader}>
              <h2>Detail Laporan</h2>
              <button
                className={`${styles.btnChatToggle} ${showChat ? styles.btnChatActive : ''}`}
                onClick={() => setShowChat((v) => !v)}
              >
                💬 {showChat ? 'Tutup Chat' : 'Chat dengan Mahasiswa'}
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Left: foto */}
              <div className={styles.modalLeft}>
                <div className={styles.modalPhoto}>
                  {selected.foto ? (
                    <img src={selected.foto} alt={selected.namaBarang} />
                  ) : (
                    <div className={styles.modalPhotoPlaceholder}>🔍</div>
                  )}
                </div>

                {/* Student info */}
                <div className={styles.modalSection}>
                  <div className={styles.sectionTitle}>Info Mahasiswa</div>
                  <div className={styles.avatarRow}>
                    <div className={styles.avatar}>{getInitials(selected.user?.nama || 'U')}</div>
                    <div>
                      <div className={styles.infoValue}>{selected.user?.nama || '-'}</div>
                      <div className={styles.infoLabel}>{selected.user?.nim || '-'}</div>
                    </div>
                  </div>
                  {selected.user?.nomorTelepon && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>📞 Telepon</span>
                      <span className={styles.infoValue}>{selected.user.nomorTelepon}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: laporan detail + action */}
              <div className={styles.modalRight}>
                {/* Item info */}
                <div className={styles.modalSection}>
                  <div className={styles.sectionTitle}>Detail Laporan</div>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>NAMA BARANG</span>
                      <span className={styles.infoValue}>{selected.namaBarang}</span>
                    </div>
                    {selected.deskripsi && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>DESKRIPSI</span>
                        <span className={styles.infoValue}>{selected.deskripsi}</span>
                      </div>
                    )}
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>TERAKHIR DILIHAT DI</span>
                      <span className={styles.infoValue}>📍 {selected.lokasi}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>TANGGAL DILAPORKAN</span>
                      <span className={styles.infoValue}>🕐 {formatDate(selected.tanggal)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>STATUS</span>
                      <span>
                        {(() => {
                          const cfg = statusConfig[selected.status] || statusConfig.pending;
                          return (
                            <span className={styles.statusPill} style={{ color: cfg.color, borderColor: `${cfg.color}44`, background: `${cfg.color}18` }}>
                              {cfg.icon} {cfg.label}
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin message */}
                <div className={styles.modalSection}>
                  <div className={styles.sectionTitle}>Pesan ke Mahasiswa <span className={styles.optional}>(opsional)</span></div>
                  <textarea
                    className={styles.pesanInput}
                    placeholder="Cth: Barang kamu sudah ditemukan, bisa diambil di sekretariat DPM lantai 3 hari Senin–Jumat jam 09.00–16.00"
                    value={pesanAdmin}
                    onChange={(e) => setPesanAdmin(e.target.value)}
                    rows={3}
                  />
                  <p className={styles.pesanHint}>Pesan ini akan ditampilkan kepada mahasiswa di halaman Status & Notifikasi mereka.</p>
                </div>

                {/* Action buttons */}
                {selected.status !== 'ditemukan' && (
                  <div className={styles.actionButtons}>
                    {(() => {
                      const cfg = statusConfig[selected.status];
                      if (!cfg || !cfg.next) return null;
                      return (
                        <button
                          className={styles.btnNext}
                          onClick={() => updateStatus(selected.laporanId, cfg.next)}
                          disabled={processing}
                        >
                          {processing ? (
                            <span className={styles.spinner} />
                          ) : (
                            <>
                              {cfg.icon} {cfg.nextLabel}
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                )}

                {selected.status === 'ditemukan' && (
                  <div className={styles.foundBanner}>
                    <span>🎊</span>
                    <span>Barang sudah ditemukan dan mahasiswa telah diberitahu.</span>
                  </div>
                )}

                {/* Save message only button */}
                <button
                  className={styles.btnSaveMsg}
                  onClick={() => updateStatus(selected.laporanId, selected.status)}
                  disabled={processing}
                >
                  💾 Simpan Pesan Saja
                </button>
              </div>
            </div>

            {/* Chat Panel */}
            {showChat && (
              <div style={{ padding: '0 24px 20px' }}>
                <ChatPanel
                  konteksType="laporan"
                  konteksId={selected.laporanId}
                  userId={selected.userId}
                  role="admin"
                  itemName={selected.namaBarang}
                  onClose={() => setShowChat(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
