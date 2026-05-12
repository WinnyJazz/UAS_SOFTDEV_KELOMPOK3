'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './claims.module.css';

interface ClaimItem {
  claimId: string;
  userId: {
    nama: string;
    nim: string;
  };
  barangId: {
    nama: string;
    lokasi: string;
    foto: string;
  };
  nama: string;
  nim: string;
  nomorTelepon: string;
  fotoKTM: string;
  status: string;
  tanggal: string;
  catatan?: string;
}

const API_URL = 'http://localhost:5000/api/claim';

export default function AdminClaims() {
  const router = useRouter();
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Auth check
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!storedUser || !token) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      router.push('/dashboard');
      return;
    }

    fetchClaims();
  }, [router]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setClaims(data.data);
      }
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>
        <h1 className={styles.title}>VERIFIKASI KLAIM BARANG</h1>

        {loading ? (
          <div className={styles.loading}>Memuat data klaim...</div>
        ) : claims.length === 0 ? (
          <div className={styles.empty}>Belum ada pengajuan klaim.</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.claimsTable}>
              <thead>
                <tr>
                  <th>Mahasiswa</th>
                  <th>Barang</th>
                  <th>Tanggal Pengajuan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.claimId}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{claim.nama}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{claim.nim}</div>
                    </td>
                    <td>{claim.barangId?.nama || 'Barang Terhapus'}</td>
                    <td>{formatDate(claim.tanggal)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status${claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}`]}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td>
                      <button className={styles.btnDetail} onClick={() => setSelectedClaim(claim)}>
                        DETAIL
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedClaim && (
        <div className={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedClaim(null);
        }}>
          <div className={styles.modal}>
            <button className={styles.modalClose} onClick={() => setSelectedClaim(null)}>✕</button>
            
            <div className={styles.modalHeader}>
              <h2>DETAIL VERIFIKASI KLAIM</h2>
            </div>

            <div className={styles.modalBody}>
              {/* LEFT: Verification Info */}
              <div className={styles.modalLeft}>
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
                </div>

                <div className={styles.infoSection}>
                  <h3>Informasi Barang</h3>
                  {selectedClaim.barangId?.foto && (
                    <div className={styles.itemImageWrapper}>
                      <img src={selectedClaim.barangId.foto} alt={selectedClaim.barangId.nama} />
                    </div>
                  )}
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Nama Barang</div>
                    <div className={styles.infoValue}>{selectedClaim.barangId?.nama}</div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Lokasi Ditemukan</div>
                    <div className={styles.infoValue}>{selectedClaim.barangId?.lokasi}</div>
                  </div>
                </div>
              </div>

              {/* RIGHT: KTM Photo & Actions */}
              <div className={styles.modalRight}>
                <div className={styles.infoSection}>
                  <h3>Foto KTM</h3>
                  <div className={styles.ktmImageWrapper}>
                    <img src={selectedClaim.fotoKTM} alt="Foto KTM" />
                  </div>
                </div>

                {selectedClaim.status === 'pending' && (
                  <div className={styles.actions}>
                    <button 
                      className={styles.btnReject} 
                      onClick={() => updateStatus(selectedClaim.claimId, 'ditolak')}
                      disabled={processing}
                    >
                      {processing ? '...' : 'REJECT'}
                    </button>
                    <button 
                      className={styles.btnApprove} 
                      onClick={() => updateStatus(selectedClaim.claimId, 'disetujui')}
                      disabled={processing}
                    >
                      {processing ? '...' : 'APPROVE'}
                    </button>
                  </div>
                )}
                
                {selectedClaim.status !== 'pending' && (
                  <div style={{ textAlign: 'center', padding: 20, background: '#f8f8f8', borderRadius: 12 }}>
                    <p style={{ fontWeight: 800, color: selectedClaim.status === 'disetujui' ? '#10B981' : '#EF4444' }}>
                      KLAIM SUDAH {selectedClaim.status.toUpperCase()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
