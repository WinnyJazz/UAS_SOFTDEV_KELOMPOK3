'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './claims.module.css';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ClaimItem {
  claimId: string;
  claimUserId?: string;  // original string userId
  userId: { nama: string; nim: string } | null;
  barangId: { nama: string; lokasi: string; foto: string } | null;
  nama: string;
  nim: string;
  nomorTelepon: string;
  fotoKTM: string;
  status: string;
  tanggal: string;
  catatan?: string;
}

const API_URL = `${API_BASE}/api/claim`;

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

function getStatusBadgeClass(status: string) {
  if (status === 'pending') return styles.statusPendingBadge;
  if (status === 'disetujui') return styles.statusDisetujuiBadge;
  if (status === 'ditolak') return styles.statusDitolakBadge;
  return '';
}

function getCardStatusClass(status: string) {
  if (status === 'pending') return styles.statusPending;
  if (status === 'disetujui') return styles.statusDisetujui;
  if (status === 'ditolak') return styles.statusDitolak;
  return '';
}

export default function AdminClaims() {
  const router = useRouter();
  const [claims, setClaims]       = useState<ClaimItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showChat, setShowChat]   = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!storedUser || !token) { router.push('/login'); return; }
    const user = JSON.parse(storedUser);
    if (user.role !== 'admin' && user.role !== 'superadmin') { router.push('/dashboard'); return; }
    fetchClaims();
  }, [router]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setClaims(data.data);
    } catch (err) {
      console.error('Fetch claims error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (claimId: string, status: 'disetujui' | 'ditolak') => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/${claimId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Klaim berhasil ${status}`);
        setSelectedClaim(null);
        fetchClaims();
      } else {
        alert(data.message || 'Gagal update status');
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const pending   = claims.filter((c) => c.status === 'pending').length;
  const approved  = claims.filter((c) => c.status === 'disetujui').length;
  const rejected  = claims.filter((c) => c.status === 'ditolak').length;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>

        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Verifikasi Klaim Barang</h1>
          <button className={styles.btnBack} onClick={() => router.push('/admin/lost-found')}>
            ← Lost &amp; Found
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statNumber} style={{ color: '#FCD34D' }}>{pending}</div>
              <div className={styles.statLabel}>Menunggu</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber} style={{ color: '#6EE7B7' }}>{approved}</div>
              <div className={styles.statLabel}>Disetujui</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber} style={{ color: '#FCA5A5' }}>{rejected}</div>
              <div className={styles.statLabel}>Ditolak</div>
            </div>
          </div>
        )}

        {/* Claims list */}
        {loading ? (
          <div className={styles.loading}>Memuat data klaim...</div>
        ) : claims.length === 0 ? (
          <div className={styles.empty}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
            <p>Belum ada pengajuan klaim.</p>
          </div>
        ) : (
          <div className={styles.claimsGrid}>
            {claims.map((claim) => (
              <div
                key={claim.claimId}
                className={`${styles.claimCard} ${getCardStatusClass(claim.status)}`}
              >
                {/* Avatar */}
                <div className={styles.claimAvatar}>
                  {getInitials(claim.nama)}
                </div>

                {/* Student */}
                <div className={styles.claimStudentInfo}>
                  <div className={styles.claimStudentName}>{claim.nama}</div>
                  <div className={styles.claimStudentNim}>{claim.nim}</div>
                </div>

                {/* Item */}
                <div className={styles.claimItemInfo}>
                  <div className={styles.claimItemName}>
                    {claim.barangId?.nama || 'Barang Terhapus'}
                  </div>
                  <div className={styles.claimItemLoc}>
                    <span>📍</span>
                    {claim.barangId?.lokasi || '-'}
                  </div>
                </div>

                {/* Date */}
                <div className={styles.claimDate}>{formatDate(claim.tanggal)}</div>

                {/* Status */}
                <div className={styles.claimStatus}>
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(claim.status)}`}>
                    {claim.status}
                  </span>
                </div>

                {/* Action */}
                <div className={styles.claimAction}>
                  <button
                    className={styles.btnDetail}
                    onClick={() => setSelectedClaim(claim)}
                  >
                    DETAIL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {selectedClaim && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedClaim(null); setShowChat(false); } }}
        >
          <div className={styles.modal}>
            <button className={styles.modalClose} onClick={() => { setSelectedClaim(null); setShowChat(false); }}>✕</button>

            <div className={styles.modalHeader}>
              <h2>Detail Verifikasi Klaim</h2>
              <button
                className={`${styles.btnChatToggle} ${showChat ? styles.btnChatActive : ''}`}
                onClick={() => setShowChat((v) => !v)}
              >
                💬 {showChat ? 'Tutup Chat' : 'Chat dengan Mahasiswa'}
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Row 1: Info cards */}
              <div className={styles.infoRow}>
                {/* Student info */}
                <div className={styles.infoSection}>
                  <h3>Informasi Mahasiswa</h3>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Nama</div>
                    <div className={styles.infoValue}>{selectedClaim.nama}</div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>NIM</div>
                    <div className={styles.infoValue}>{selectedClaim.nim}</div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Nomor Telepon</div>
                    <div className={styles.infoValue}>{selectedClaim.nomorTelepon}</div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Tanggal Pengajuan</div>
                    <div className={styles.infoValue}>{formatDate(selectedClaim.tanggal)}</div>
                  </div>
                </div>

                {/* Item info */}
                <div className={styles.infoSection}>
                  <h3>Informasi Barang</h3>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Nama Barang</div>
                    <div className={styles.infoValue}>{selectedClaim.barangId?.nama || '-'}</div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Lokasi Ditemukan</div>
                    <div className={styles.infoValue}>{selectedClaim.barangId?.lokasi || '-'}</div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Status Klaim</div>
                    <div className={styles.infoValue}>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(selectedClaim.status)}`}>
                        {selectedClaim.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Images */}
              <div className={styles.imageRow}>
                <div className={styles.imageSection}>
                  <h3>Foto Barang</h3>
                  <div className={styles.imageWrapper}>
                    {selectedClaim.barangId?.foto ? (
                      <img src={selectedClaim.barangId.foto} alt="Foto barang" />
                    ) : (
                      <div className={styles.noImage}>📷</div>
                    )}
                  </div>
                </div>

                <div className={styles.imageSection}>
                  <h3>Foto KTM</h3>
                  <div className={styles.imageWrapper}>
                    <img src={selectedClaim.fotoKTM} alt="Foto KTM" />
                  </div>
                </div>
              </div>

              {/* Row 3: Actions */}
              {selectedClaim.status === 'pending' ? (
                <div className={styles.actions}>
                  <button
                    className={styles.btnReject}
                    onClick={() => updateStatus(selectedClaim.claimId, 'ditolak')}
                    disabled={processing}
                  >
                    {processing ? '...' : '✕  REJECT'}
                  </button>
                  <button
                    className={styles.btnApprove}
                    onClick={() => updateStatus(selectedClaim.claimId, 'disetujui')}
                    disabled={processing}
                  >
                    {processing ? '...' : '✓  APPROVE'}
                  </button>
                </div>
              ) : (
                <div className={styles.statusResult}>
                  <p style={{ color: selectedClaim.status === 'disetujui' ? '#6EE7B7' : '#FCA5A5' }}>
                    {selectedClaim.status === 'disetujui' ? '✅' : '❌'}&nbsp;
                    Klaim sudah {selectedClaim.status.toUpperCase()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
