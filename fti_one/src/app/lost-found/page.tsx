'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './lostfound.module.css';

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

const API_URL = 'http://localhost:5000/api/barang';

export default function LostFoundStudent() {
  const router = useRouter();

  const [barangList, setBarangList] = useState<BarangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<BarangItem | null>(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimData, setClaimData] = useState({
    nama: '',
    nim: '',
    nomorTelepon: '',
    fotoKTM: null as string | null,
  });
  const [submitting, setSaving] = useState(false);
  const ktmInputRef = useRef<HTMLInputElement>(null);

  // Auth check
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/login');
      return;
    }

    fetchBarang();
  }, [router]);

  const fetchBarang = async (searchQuery?: string) => {
    try {
      setLoading(true);
      const query = searchQuery !== undefined ? searchQuery : search;
      
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (filterTanggal) params.append('tanggal', filterTanggal);
      if (filterLokasi) params.append('lokasi', filterLokasi);
      
      const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        // Only show items that are 'tersedia' for students
        setBarangList(data.data.filter((item: BarangItem) => item.status === 'tersedia'));
      }
    } catch (err) {
      console.error('Fetch barang error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchBarang(search);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleClaimClick = (item: BarangItem) => {
    setSelectedBarang(item);
    setShowClaimForm(true);
    // Autofill nama & nim from stored user if available
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setClaimData((prev) => ({
        ...prev,
        nama: user.nama || '',
        nim: user.nim || '',
      }));
    }
  };

  const handleKtmSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setClaimData((prev) => ({ ...prev, fotoKTM: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitClaim = async () => {
    if (!claimData.nama || !claimData.nim || !claimData.nomorTelepon || !claimData.fotoKTM) {
      alert('Semua field verifikasi wajib diisi!');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barangId: selectedBarang?.barangId,
          ...claimData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Pengajuan klaim berhasil! Silahkan tunggu verifikasi admin.');
        setShowClaimForm(false);
        setSelectedBarang(null);
        setClaimData({ nama: '', nim: '', nomorTelepon: '', fotoKTM: null });
        fetchBarang();
      } else {
        alert(data.message || 'Gagal mengajukan klaim.');
      }
    } catch (err) {
      console.error('Claim error:', err);
      alert('Terjadi kesalahan saat mengirim klaim.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ===== CONTENT ===== */}
      <div className={styles.content}>
        <p className={styles.pageTitle}>Lost n found</p>

        {/* Search & Filter */}
        <div className={styles.searchWrapper}>
          <div className={styles.filterContainer}>
            <button 
              className={styles.btnFilter} 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              FILTER
            </button>
            
            {isFilterOpen && (
              <div className={styles.filterDropdown}>
                <input 
                  type="date" 
                  className={styles.filterInput}
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  placeholder="Tanggal"
                />
                <div className={styles.lokasiWrapper}>
                  <input 
                    type="text" 
                    className={styles.filterInput}
                    value={filterLokasi}
                    onChange={(e) => setFilterLokasi(e.target.value)}
                    placeholder="Lokasi"
                  />
                  <span className={styles.selectArrow}>⌵</span>
                </div>
                <button 
                  className={styles.btnApplyFilter}
                  onClick={() => {
                    fetchBarang();
                    setIsFilterOpen(false);
                  }}
                >
                  Cari
                </button>
              </div>
            )}
          </div>

          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="SEARCH"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="search-input"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner} />
            Loading...
          </div>
        ) : barangList.length === 0 ? (
          <div className={styles.emptyState}>
            <div style={{ fontSize: 64 }}>📦</div>
            <p>Belum ada barang ditemukan.</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {barangList.map((item) => (
              <div
                key={item.barangId}
                className={styles.card}
                id={`card-${item.barangId}`}
              >
                <div className={styles.cardImageWrapper}>
                  {item.foto ? (
                    <img
                      src={item.foto}
                      alt={item.nama}
                      className={styles.cardImage}
                    />
                  ) : (
                    <div className={styles.cardImagePlaceholder}>📷</div>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTitle}>{item.nama}</div>
                  <div className={styles.cardMeta}>
                    <span>
                      <span className={styles.metaIcon}>📍</span>
                      Lokasi: {item.lokasi}
                    </span>
                    <span>
                      <span className={styles.metaIcon}>📅</span>
                      Waktu: {formatDate(item.tanggal)}
                    </span>
                  </div>
                  <button
                    className={styles.btnClaim}
                    onClick={() => handleClaimClick(item)}
                    id={`claim-${item.barangId}`}
                  >
                    CLAIM
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== CLAIM FORM MODAL ===== */}
      {showClaimForm && selectedBarang && (
        <div className={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) setShowClaimForm(false);
        }}>
          <div className={styles.claimModal}>
            <button className={styles.modalClose} onClick={() => setShowClaimForm(false)}>✕</button>
            <h2 className={styles.claimTitle}>FORM VERIFIKASI</h2>
            
            <div className={styles.claimBody}>
              {/* Left Side: Item Info */}
              <div className={styles.claimInfo}>
                <div className={styles.claimImageWrapper}>
                  {selectedBarang.foto ? (
                    <img src={selectedBarang.foto} alt={selectedBarang.nama} />
                  ) : (
                    <div className={styles.cardImagePlaceholder}>📷</div>
                  )}
                </div>
                <div className={styles.claimItemDetails}>
                  <h3>{selectedBarang.nama}</h3>
                  <p>Lokasi: {selectedBarang.lokasi}</p>
                  <p>Waktu: {formatDate(selectedBarang.tanggal)}</p>
                </div>
              </div>

              {/* Right Side: Form */}
              <div className={styles.claimForm}>
                <div className={styles.claimFormInfo}>
                  <p>BARANG: {selectedBarang.nama}</p>
                  <p>LOKASI DITEMUKAN: {selectedBarang.lokasi}</p>
                </div>

                <div className={styles.claimFormGroup}>
                  <label>NAMA</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan nama anda"
                    value={claimData.nama}
                    onChange={(e) => setClaimData({...claimData, nama: e.target.value})}
                  />
                </div>
                <div className={styles.claimFormGroup}>
                  <label>NIM</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan NIM anda"
                    value={claimData.nim}
                    onChange={(e) => setClaimData({...claimData, nim: e.target.value})}
                  />
                </div>
                <div className={styles.claimFormGroup}>
                  <label>NOMOR TELEPON</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan nomor telepon anda"
                    value={claimData.nomorTelepon}
                    onChange={(e) => setClaimData({...claimData, nomorTelepon: e.target.value})}
                  />
                </div>
                <div className={styles.claimFormGroup}>
                  <label>FOTO KTM</label>
                  <div className={styles.ktmUploadWrapper} onClick={() => ktmInputRef.current?.click()}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={ktmInputRef} 
                      style={{ display: 'none' }}
                      onChange={handleKtmSelect}
                    />
                    <span>{claimData.fotoKTM ? "✅ Foto terpilih" : "Unggah foto ktm"}</span>
                  </div>
                </div>

                <button 
                  className={styles.btnSubmitClaim} 
                  onClick={handleSubmitClaim}
                  disabled={submitting}
                >
                  {submitting ? 'MENGIRIM...' : 'CLAIM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
