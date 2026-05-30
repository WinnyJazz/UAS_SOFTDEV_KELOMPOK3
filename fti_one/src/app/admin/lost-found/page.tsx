'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './lostfound.module.css';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface BarangItem {
  barangId: string;
  nama: string;
  lokasi: string;
  tanggal: string;
  kategori: string;
  deskripsi?: string;
  status: string;
  foto: string | null;
}

// ── Sesuai struktur response GET /api/claim (populated) dari claimController ──
interface ClaimItem {
  claimId: string;
  // barangId & userId sudah di-populate oleh controller
  barangId: {
    barangId: string;
    nama: string;
    lokasi: string;
    foto: string | null;
  } | null;
  userId: {
    userId: string;
    nama: string;
    nim: string;
  } | null;
  claimUserId: string;          // string userId asli (untuk chat)
  nama: string;                 // nama pelapor (dari form claim)
  nim: string;
  nomorTelepon: string;
  fotoKTM: string | null;
  // status dari backend: 'pending' | 'disetujui' | 'ditolak'
  status: 'pending' | 'disetujui' | 'ditolak';
  catatan?: string;             // alasan tolak dari admin
  tanggal: string;              // tanggal claim dibuat
  updatedAt?: string;           // dipakai sebagai jam pengambilan jika disetujui
}

interface Notification {
  id: string;
  message: string;
  type: 'claim' | 'approved' | 'rejected' | 'new';
  time: string;
  read: boolean;
}

interface FormData {
  nama: string;
  lokasi: string;
  tanggal: string;
  foto: string | null;
}

const API_URL = `${API_BASE}/api/barang`;
const CLAIMS_API_URL = `${API_BASE}/api/claim`;

// Helper: ubah status backend → label display
const statusLabel = (status: ClaimItem['status']) => {
  if (status === 'pending') return 'Menunggu';
  if (status === 'disetujui') return 'Disetujui';
  return 'Ditolak';
};

// Helper: relative time
const relativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
};

export default function LostFoundAdmin() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<'barang' | 'claims'>('barang');

  // ── Barang state ──
  const [barangList, setBarangList] = useState<BarangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({ nama: '', lokasi: '', tanggal: '', foto: null });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  // ── Claims state ──
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimFilter, setClaimFilter] = useState<'semua' | 'pending' | 'disetujui' | 'ditolak'>('semua');
  const [claimSearch, setClaimSearch] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [claimToReject, setClaimToReject] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Notification state ──
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const [zoomKtm, setZoomKtm] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('token') || '';

  // ── FIX 1: single backtick template literal ──
  const fetchAvailableLocations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/barang/locations/available`);
      const data = await res.json();
      if (data.success) {
        setAvailableLocations(data.data);
      }
    } catch (err) {
      console.error('Fetch available locations error:', err);
    }
  };

  // ── FIX 2: removed nested duplicate fetchBarang, unified parameter name ──
  const fetchBarang = async (searchQuery = search) => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterTanggal) params.append('tanggal', filterTanggal);
      if (filterLokasi) params.append('lokasi', filterLokasi);

      const url = params.toString()
        ? `${API_URL}?${params.toString()}`
        : API_URL;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();

      console.log("RAW BARANG RESPONSE:", data);
      console.log("BARANG LIST:", data.data);

      if (data.success) {
        setBarangList(data.data);
      } else {
        console.log("FETCH BARANG FAILED:", data.message);
      }
    } catch (err) {
      console.error('Fetch barang error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatDateForInput = (dateStr: string) => new Date(dateStr).toISOString().split('T')[0];

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ nama: '', lokasi: '', tanggal: '', foto: null });
    setPreviewUrl(null);
    setShowModal(true);
  };

  const openEditModal = (item: BarangItem) => {
    setEditingId(item.barangId);
    setFormData({ nama: item.nama, lokasi: item.lokasi, tanggal: formatDateForInput(item.tanggal), foto: null });
    setPreviewUrl(item.foto);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ nama: '', lokasi: '', tanggal: '', foto: null });
    setPreviewUrl(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData(prev => ({ ...prev, foto: base64 }));
      setPreviewUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formData.nama.trim() || !formData.lokasi.trim()) { alert('Nama barang dan lokasi wajib diisi!'); return; }
    setSaving(true);
    try {
      const token = getToken();
      const body: Record<string, string | null> = { nama: formData.nama, lokasi: formData.lokasi, tanggal: formData.tanggal || null };
      if (formData.foto) body.foto = formData.foto;
      const isEdit = editingId !== null;
      const res = await fetch(isEdit ? `${API_URL}/${editingId}` : API_URL, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { closeModal(); fetchBarang(); fetchAvailableLocations(); }
      else alert(data.message || 'Gagal menyimpan barang.');
    } catch (err) {
      console.error('Submit error:', err);
      alert('Terjadi kesalahan saat menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDone = async (barangId: string) => {
    if (!confirm('Tandai barang ini sebagai selesai?')) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/${barangId}/done`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { fetchBarang(); fetchAvailableLocations(); }
    } catch (err) { console.error('Mark done error:', err); }
  };

  const executeDelete = async (barangId: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/${barangId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { fetchBarang(); fetchAvailableLocations(); }
      else alert(data.message || 'Gagal menghapus barang.');
    } catch (err) { console.error('Delete error:', err); alert('Terjadi kesalahan saat menghapus.'); }
  };

  // ── Fetch claims dari API ──
  const fetchClaims = async () => {
    try {
      setClaimsLoading(true);
      const token = getToken();

      console.log("TOKEN SAAT FETCH CLAIMS:", token);

      const res = await fetch(CLAIMS_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("RESPONSE CLAIMS:", data);

      if (data.success) {
        setClaims(data.data);
      }
    } catch (err) {
      console.error('fetchClaims error:', err);
    } finally {
      setClaimsLoading(false);
    }
  };

  // Refresh claims saat tab aktif berubah ke 'claims'
  useEffect(() => {
    if (activeTab === 'claims') {
      fetchClaims();
    }
  }, [activeTab]);

  // Auth check
  useEffect(() => {
    const initialize = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!storedUser || !token) {
        router.push('/login');
        return;
      }

      const parsed = JSON.parse(storedUser);

      if (parsed.role !== 'admin' && parsed.role !== 'superadmin') {
        router.push('/dashboard');
        return;
      }

      await fetchBarang();
      await fetchClaims();
      await fetchAvailableLocations();
    };

    initialize();
  }, [router]);

  // Refresh available locations periodically
  useEffect(() => {
    fetchAvailableLocations();
    const interval = setInterval(fetchAvailableLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  // Debounced search for barang
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchBarang(search);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ── Claims stats & filter ──
  const claimStats = {
    semua: claims.length,
    pending: claims.filter(c => c.status === 'pending').length,
    disetujui: claims.filter(c => c.status === 'disetujui').length,
    ditolak: claims.filter(c => c.status === 'ditolak').length,
  };

  const filteredClaims = claims.filter(c => {
    const matchStatus = claimFilter === 'semua' || c.status === claimFilter;
    const q = claimSearch.toLowerCase();
    const matchSearch = !q ||
      c.nama.toLowerCase().includes(q) ||
      c.nim.toLowerCase().includes(q) ||
      (c.barangId?.nama ?? '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ── Approve claim ──
  const handleApproveClaim = async (claimId: string) => {
    try {
      setActionLoading(true);
      const token = getToken();

      console.log("🚀 Approve claim:", claimId);
      console.log("🚀 URL:", `${CLAIMS_API_URL}/${claimId}/status`);
      const res = await fetch(`${CLAIMS_API_URL}/${claimId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'disetujui' }),
      });
      const data = await res.json();
      if (data.success) {
        setClaims(prev => prev.map(c =>
          c.claimId === claimId ? { ...c, status: 'disetujui', updatedAt: new Date().toISOString() } : c
        ));
        setSelectedClaim(null);
        const approved = claims.find(c => c.claimId === claimId);
        addNotif(
          `Claim ${approved?.nama ?? ''} untuk ${approved?.barangId?.nama ?? 'barang'} disetujui`,
          'approved'
        );
        fetchBarang();
        fetchAvailableLocations();
      } else {
        alert(data.message || 'Gagal menyetujui claim.');
      }
    } catch (err) {
      console.error('approveClaim error:', err);
      alert('Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reject claim ──
  const handleRejectClaim = (claimId: string) => {
    setClaimToReject(claimId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!claimToReject) return;
    try {
      setActionLoading(true);
      const token = getToken();
      const res = await fetch(`${CLAIMS_API_URL}/${claimToReject}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'ditolak', catatan: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        setClaims(prev => prev.map(c =>
          c.claimId === claimToReject ? { ...c, status: 'ditolak', catatan: rejectReason } : c
        ));
        const rejected = claims.find(c => c.claimId === claimToReject);
        addNotif(
          `Claim ${rejected?.nama ?? ''} untuk ${rejected?.barangId?.nama ?? 'barang'} ditolak`,
          'rejected'
        );
        setSelectedClaim(null);
      } else {
        alert(data.message || 'Gagal menolak claim.');
      }
    } catch (err) {
      console.error('rejectClaim error:', err);
      alert('Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
      setClaimToReject(null);
      setRejectReason('');
    }
  };

  const addNotif = (message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: crypto.randomUUID(),
      message,
      type,
      time: 'Baru saja',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const notifIcon = (type: Notification['type']) => {
    if (type === 'claim') return '📋';
    if (type === 'approved') return '✅';
    if (type === 'rejected') return '❌';
    return '📦';
  };

  // ── Overview stats for barang ──
  const stats = {
    total: barangList.length,
    tersedia: barangList.filter(b => b.status !== 'dipinjam').length,
    claimed: barangList.filter(b => b.status === 'dipinjam').length,
    pendingClaim: claimStats.pending,
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>

        {/* ── Top bar ── */}
        <div className={styles.topBar}>
          <div className={styles.tabSwitcher}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'barang' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('barang')}
            >
              <span className={styles.tabIcon}>📦</span>
              Kelola Barang
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'claims' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('claims')}
            >
              <span className={styles.tabIcon}>🔍</span>
              Verifikasi Claim
              {claimStats.pending > 0 && (
                <span className={styles.tabBadge}>{claimStats.pending}</span>
              )}
            </button>
          </div>

          {/* Notification Bell */}
          <div className={styles.notifWrapper}>
            <button className={styles.notifBtn} onClick={() => setShowNotifPanel(!showNotifPanel)}>
              🔔
              {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount}</span>}
            </button>

            {showNotifPanel && (
              <div className={styles.notifPanel}>
                <div className={styles.notifHeader}>
                  <span>Notifikasi</span>
                  {unreadCount > 0 && (
                    <button className={styles.markReadBtn} onClick={markAllRead}>Tandai semua dibaca</button>
                  )}
                </div>
                <div className={styles.notifList}>
                  {notifications.length === 0 ? (
                    <div className={styles.notifEmpty}>Tidak ada notifikasi</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ''}`}>
                        <span className={styles.notifItemIcon}>{notifIcon(n.type)}</span>
                        <div className={styles.notifItemContent}>
                          <p>{n.message}</p>
                          <span>{n.time}</span>
                        </div>
                        {!n.read && <span className={styles.notifDot} />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════════════ TAB: BARANG ════════════ */}
        {activeTab === 'barang' && (
          <>
            {/* Overview Stats */}
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.total}</div>
                <div className={styles.statLabel}>Total Barang</div>
              </div>
              <div className={styles.statCard} style={{ borderColor: '#22c55e' }}>
                <div className={styles.statNumber} style={{ color: '#22c55e' }}>{stats.tersedia}</div>
                <div className={styles.statLabel}>Tersedia</div>
              </div>
              <div className={styles.statCard} style={{ borderColor: '#f59e0b' }}>
                <div className={styles.statNumber} style={{ color: '#f59e0b' }}>{stats.claimed}</div>
                <div className={styles.statLabel}>Sudah Claimed</div>
              </div>
              <div
                className={`${styles.statCard} ${styles.statClickable}`}
                style={{ borderColor: '#ef4444' }}
                onClick={() => { setActiveTab('claims'); setClaimFilter('pending'); }}
                title="Lihat pending claims"
              >
                <div className={styles.statNumber} style={{ color: '#ef4444' }}>{stats.pendingClaim}</div>
                <div className={styles.statLabel}>Pending Claim ↗</div>
              </div>
            </div>

            {/* Search & Filter */}
            <div className={styles.searchWrapper}>
              <div className={styles.filterContainer}>
                <button className={styles.btnFilter} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                  ⚙ FILTER
                </button>
                {isFilterOpen && (
                  <div className={styles.filterDropdown}>
                    <input type="date" className={styles.filterInput} value={filterTanggal}
                      onChange={e => setFilterTanggal(e.target.value)} />
                    <div className={styles.lokasiWrapper}>
                      <select className={styles.filterInput} value={filterLokasi}
                        onChange={e => setFilterLokasi(e.target.value)}>
                        <option value="">-- Pilih Lokasi --</option>
                        {availableLocations.map((lokasi) => (
                          <option key={lokasi} value={lokasi}>
                            {lokasi}
                          </option>
                        ))}
                      </select>
                      <span className={styles.selectArrow}>⌵</span>
                    </div>
                    <button className={styles.btnApplyFilter} onClick={() => { fetchBarang(); setIsFilterOpen(false); }}>
                      Cari
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.searchBar}>
                <span className={styles.searchIcon}>🔍</span>
                <input type="text" placeholder="SEARCH" value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className={styles.loadingWrapper}><div className={styles.spinner} />Loading...</div>
            ) : barangList.length === 0 ? (
              <div className={styles.emptyState}><div style={{ fontSize: 64 }}>📦</div><p>Belum ada barang ditemukan.</p></div>
            ) : (
              <div className={styles.cardGrid}>
                {barangList.map(item => (
                  <div key={item.barangId} className={styles.card}>
                    <div className={styles.cardImageWrapper}>
                      {item.foto ? (
                        <img src={item.foto} alt={item.nama} className={styles.cardImage} />
                      ) : (
                        <div className={styles.cardImagePlaceholder}>📷</div>
                      )}
                      <button type="button" className={styles.btnDelete}
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setDeleteId(item.barangId); }}
                        title="Hapus Barang">🗑️</button>
                      {item.status === 'dipinjam' && (
                        <div className={styles.doneOverlay}>
                          <div className={styles.doneCheckmark}>
                            <svg viewBox="0 0 24 24"><polyline points="4,12 9,17 20,6" /></svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTitle}>{item.nama}</div>
                      <div className={styles.cardMeta}>
                        <span><span className={styles.metaIcon}>📍</span>Lokasi: {item.lokasi}</span>
                        <span><span className={styles.metaIcon}>📅</span>Waktu: {formatDate(item.tanggal)}</span>
                      </div>
                      <div className={styles.cardActions}>
                        <button className={styles.btnEdit} onClick={() => openEditModal(item)}>EDIT</button>
                        <button className={styles.btnDone} onClick={() => handleDone(item.barangId)}
                          disabled={item.status === 'dipinjam'}>DONE</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ════════════ TAB: CLAIMS ════════════ */}
        {activeTab === 'claims' && (
          <div className={styles.claimsSection}>

            {/* Claims Overview — clickable filter */}
            <div className={styles.claimsStatsRow}>
              {(['semua', 'pending', 'disetujui', 'ditolak'] as const).map(status => (
                <button
                  key={status}
                  className={`${styles.claimStatCard} ${claimFilter === status ? styles.claimStatActive : ''}`}
                  onClick={() => setClaimFilter(status)}
                >
                  <div className={styles.claimStatNumber}>
                    {claimStats[status]}
                  </div>
                  <div className={styles.claimStatLabel}>
                    {status === 'semua' ? 'Semua' : status === 'pending' ? 'Menunggu' : status === 'disetujui' ? 'Disetujui' : 'Ditolak'}
                  </div>
                </button>
              ))}
            </div>

            {/* Claims search */}
            <div className={styles.claimsSearchRow}>
              <div className={styles.claimsSearchBar}>
                <span>🔍  </span>
                <input type="text" placeholder="Cari NIM, nama, atau nama barang..."
                  value={claimSearch} onChange={e => setClaimSearch(e.target.value)} />
              </div>
            </div>

            {/* Claims Table */}
            <div className={styles.claimsTableWrapper}>
              <table className={styles.claimsTable}>
                <thead>
                  <tr>
                    <th>Foto KTM</th>
                    <th>NIM</th>
                    <th>Nama</th>
                    <th>No. Telepon</th>
                    <th>Barang</th>
                    <th>Status</th>
                    <th>Jam Pengambilan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {claimsLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                          <div className={styles.spinnerDark} />
                          Memuat data claim...
                        </div>
                      </td>
                    </tr>
                  ) : filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                        Tidak ada data claim untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map(claim => (
                      <tr key={claim.claimId} className={styles.claimRow}>
                        <td>
                          <div className={styles.ktmThumb} onClick={() => claim.fotoKTM && setZoomKtm(claim.fotoKTM)}
                            style={{ cursor: claim.fotoKTM ? 'zoom-in' : 'default' }}>
                            {claim.fotoKTM ? (
                              <img src={claim.fotoKTM} alt="KTM" />
                            ) : (
                              <div className={styles.ktmPlaceholder}>🪪</div>
                            )}
                          </div>
                        </td>
                        <td className={styles.tdNim}>{claim.nim}</td>
                        <td className={styles.tdName}>{claim.nama}</td>
                        <td>{claim.nomorTelepon}</td>
                        <td className={styles.tdBarang}>{claim.barangId?.nama ?? '—'}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[`status_${claim.status}`]}`}>
                            {statusLabel(claim.status)}
                          </span>
                        </td>
                        <td className={styles.tdJam}>
                          {claim.status === 'disetujui' && claim.updatedAt
                            ? new Date(claim.updatedAt).toLocaleString('id-ID')
                            : '—'}
                        </td>
                        <td>
                          <div className={styles.claimActions}>
                            <button className={styles.btnDetail} onClick={() => setSelectedClaim(claim)}>
                              ⓘ
                            </button>
                            {claim.status === 'pending' && (
                              <>
                                <button
                                  className={styles.btnApprove}
                                  onClick={() => handleApproveClaim(claim.claimId)}
                                  disabled={actionLoading}
                                >
                                  ✓
                                </button>
                                <button
                                  className={styles.btnReject}
                                  onClick={() => handleRejectClaim(claim.claimId)}
                                  disabled={actionLoading}
                                >
                                  ✕
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      {activeTab === 'barang' && (
        <button className={styles.fab} onClick={openNewModal}>+</button>
      )}

      {/* ── MODAL: Edit/Create Barang ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={styles.modal}>
            <button className={styles.modalClose} onClick={closeModal}>✕</button>
            <div className={styles.modalBody}>
              <div className={styles.modalLeft}>
                <div className={styles.formImagePreview}>
                  {previewUrl ? <img src={previewUrl} alt="Preview" /> : <div className={styles.formImagePlaceholder}>📷</div>}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
                <button className={styles.btnUpload} onClick={() => fileInputRef.current?.click()}>UNGGAH FOTO</button>
              </div>
              <div className={styles.modalRight}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nama Barang</label>
                  <input type="text" className={styles.formInput} placeholder="CHARGER BERWARNA HITAM"
                    value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Lokasi Ditemukan</label>
                  <input type="text" className={styles.formInput} placeholder="R.904 Lt.9"
                    value={formData.lokasi} onChange={e => setFormData({ ...formData, lokasi: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tanggal Ditemukan</label>
                  <input type="date" className={styles.formInput} value={formData.tanggal}
                    onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                </div>
                <button className={styles.btnSimpan} onClick={handleSubmit} disabled={saving}>
                  {saving ? 'MENYIMPAN...' : 'SIMPAN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Claim Detail ── */}
      {selectedClaim && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setSelectedClaim(null); }}>
          <div className={styles.claimDetailModal}>
            <button className={styles.modalClose} onClick={() => setSelectedClaim(null)}>✕</button>
            <h2 className={styles.claimDetailTitle}>Detail Claim</h2>

            <div className={styles.claimDetailGrid}>
              <div className={styles.claimDetailKTM}>
                {selectedClaim.fotoKTM ? (
                  <img src={selectedClaim.fotoKTM} alt="KTM" />
                ) : (
                  <div className={styles.ktmLarge}>🪪<br /><span>Foto KTM</span></div>
                )}
              </div>
              <div className={styles.claimDetailInfo}>
                <div className={styles.detailRow}><span className={styles.detailKey}>NIM</span><span>{selectedClaim.nim}</span></div>
                <div className={styles.detailRow}><span className={styles.detailKey}>Nama</span><span>{selectedClaim.nama}</span></div>
                <div className={styles.detailRow}><span className={styles.detailKey}>Telepon</span><span>{selectedClaim.nomorTelepon}</span></div>
                <div className={styles.detailRow}><span className={styles.detailKey}>Barang</span><span>{selectedClaim.barangId?.nama ?? '—'}</span></div>
                <div className={styles.detailRow}><span className={styles.detailKey}>Lokasi</span><span>{selectedClaim.barangId?.lokasi ?? '—'}</span></div>
                <div className={styles.detailRow}><span className={styles.detailKey}>Tanggal</span><span>{formatDate(selectedClaim.tanggal)}</span></div>
                <div className={styles.detailRow}><span className={styles.detailKey}>Status</span>
                  <span className={`${styles.statusBadge} ${styles[`status_${selectedClaim.status}`]}`}>
                    {statusLabel(selectedClaim.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.claimDetailSection}>
              <p className={styles.detailKey}>Catatan / Alasan Claim</p>
              <p className={styles.detailText}>{selectedClaim.catatan || '—'}</p>
            </div>

            {/* Foto barang yang diklaim */}
            {selectedClaim.barangId?.foto && (
              <div className={styles.claimDetailSection}>
                <p className={styles.detailKey}>Foto Barang</p>
                <img
                  src={selectedClaim.barangId.foto}
                  alt="Foto barang"
                  style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '10px', marginTop: '8px' }}
                />
              </div>
            )}

            {selectedClaim.status === 'pending' && (
              <div className={styles.claimDetailActions}>
                <button
                  className={styles.btnApproveDetail}
                  onClick={() => handleApproveClaim(selectedClaim.claimId)}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Memproses...' : '✓ Setujui Claim'}
                </button>
                <button
                  className={styles.btnRejectDetail}
                  onClick={() => handleRejectClaim(selectedClaim.claimId)}
                  disabled={actionLoading}
                >
                  ✕ Tolak Claim
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: Reject reason ── */}
      {showRejectModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRejectModal(false)}>
          <div className={styles.rejectModal} onClick={e => e.stopPropagation()}>
            <h3>Tolak Claim</h3>
            <p>Berikan alasan penolakan (opsional):</p>
            <textarea
              className={styles.rejectTextarea}
              placeholder="Contoh: Ciri-ciri yang disebutkan tidak sesuai dengan barang yang ada..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className={styles.rejectActions}>
              <button onClick={() => setShowRejectModal(false)} className={styles.btnCancelReject}>Batal</button>
              <button onClick={confirmReject} className={styles.btnConfirmReject}>Tolak</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Confirm ── */}
      {deleteId && (
        <div className={styles.modalOverlay} onClick={() => setDeleteId(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <h3 style={{ marginBottom: '16px', color: '#fff', fontSize: '24px' }}>Hapus Barang?</h3>
            <p style={{ color: '#ccc', marginBottom: '32px', fontSize: '16px' }}>Yakin ingin menghapus barang ini secara permanen?</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '12px 24px', background: '#4b5563', color: '#fff', border: 'none', borderRadius: '30px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', flex: 1 }}>Batal</button>
              <button onClick={() => { executeDelete(deleteId); setDeleteId(null); }} style={{ padding: '12px 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '30px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', flex: 1 }}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ZOOM KTM ── */}
      {zoomKtm && (
        <div
          onClick={() => setZoomKtm(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, cursor: 'zoom-out', padding: '20px'
          }}
        >
          <img
            src={zoomKtm}
            alt="KTM Zoom"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}