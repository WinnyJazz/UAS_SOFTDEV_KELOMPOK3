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

interface FormData {
  nama: string;
  lokasi: string;
  tanggal: string;
  foto: string | null;
}

const API_URL = 'http://localhost:5000/api/barang';

export default function LostFoundAdmin() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [barangList, setBarangList] = useState<BarangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nama: '',
    lokasi: '',
    tanggal: '',
    foto: null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Auth check
  useEffect(() => {
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

    fetchBarang();
  }, [router]);

  const getToken = () => localStorage.getItem('token') || '';

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
        setBarangList(data.data);
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

  const formatDateForInput = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  // Open modal for new item
  const openNewModal = () => {
    setEditingId(null);
    setFormData({ nama: '', lokasi: '', tanggal: '', foto: null });
    setPreviewUrl(null);
    setShowModal(true);
  };

  // Open modal for editing
  const openEditModal = (item: BarangItem) => {
    setEditingId(item.barangId);
    setFormData({
      nama: item.nama,
      lokasi: item.lokasi,
      tanggal: formatDateForInput(item.tanggal),
      foto: null, // only set if user picks a new photo
    });
    setPreviewUrl(item.foto);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ nama: '', lokasi: '', tanggal: '', foto: null });
    setPreviewUrl(null);
  };

  // Handle file select → convert to base64
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({ ...prev, foto: base64 }));
      setPreviewUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  // Submit form (create or update)
  const handleSubmit = async () => {
    if (!formData.nama.trim() || !formData.lokasi.trim()) {
      alert('Nama barang dan lokasi wajib diisi!');
      return;
    }

    setSaving(true);

    try {
      const token = getToken();
      const body: Record<string, string | null> = {
        nama: formData.nama,
        lokasi: formData.lokasi,
        tanggal: formData.tanggal || null,
      };

      // Only include foto if user selected a new image
      if (formData.foto) {
        body.foto = formData.foto;
      }

      const isEdit = editingId !== null;
      const url = isEdit ? `${API_URL}/${editingId}` : API_URL;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        closeModal();
        fetchBarang();
      } else {
        alert(data.message || 'Gagal menyimpan barang.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Terjadi kesalahan saat menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  // Mark as done
  const handleDone = async (barangId: string) => {
    if (!confirm('Tandai barang ini sebagai selesai?')) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/${barangId}/done`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        fetchBarang();
      }
    } catch (err) {
      console.error('Mark done error:', err);
    }
  };

  // Execute delete item
  const executeDelete = async (barangId: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/${barangId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        fetchBarang();
      } else {
        alert(data.message || 'Gagal menghapus barang.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Terjadi kesalahan saat menghapus.');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ===== CONTENT ===== */}
      <div className={styles.content}>
        <p className={styles.pageTitle}>Lost n found ADMIN</p>

        {/* Search & Filter */}
        <div className={styles.searchWrapper}>
          <div className={styles.adminControls}>
            <button 
              className={styles.btnClaimsLink}
              onClick={() => router.push('/admin/claims')}
            >
              KLAIM VERIFIKASI
            </button>
          </div>

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
                className={`${styles.card} ${item.status === 'dipinjam' ? styles.statusDone : ''}`}
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
                  
                  {/* Delete Button */}
                  <button 
                    type="button"
                    className={styles.btnDelete} 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteId(item.barangId);
                    }}
                    title="Hapus Barang"
                  >
                    🗑️
                  </button>

                  {item.status === 'dipinjam' && (
                    <span className={`${styles.statusBadge} ${styles.statusBadgeDone}`}>
                      SELESAI
                    </span>
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
                  <div className={styles.cardActions}>
                    <button
                      className={styles.btnEdit}
                      onClick={() => openEditModal(item)}
                      id={`edit-${item.barangId}`}
                    >
                      EDIT
                    </button>
                    <button
                      className={styles.btnDone}
                      onClick={() => handleDone(item.barangId)}
                      disabled={item.status === 'dipinjam'}
                      id={`done-${item.barangId}`}
                    >
                      DONE
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== FAB ===== */}
      <button className={styles.fab} onClick={openNewModal} id="fab-add">
        +
      </button>

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}>
          <div className={styles.modal}>
            <button className={styles.modalClose} onClick={closeModal}>✕</button>

            <div className={styles.modalBody}>
              <div className={styles.modalLeft}>
                {/* Image Preview */}
                <div className={styles.formImagePreview}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" />
                  ) : (
                    <div className={styles.formImagePlaceholder}>📷</div>
                  )}
                </div>

                {/* Upload Button */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                  id="input-foto"
                />
                <button
                  className={styles.btnUpload}
                  onClick={() => fileInputRef.current?.click()}
                  id="btn-upload"
                >
                  UNGGAH FOTO
                </button>
              </div>

              <div className={styles.modalRight}>
                {/* Form Fields */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nama Barang</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="CHARGER BERWARNA HITAM"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    id="input-nama"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Lokasi Ditemukan</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="R.904 Lt.9"
                    value={formData.lokasi}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    id="input-lokasi"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tanggal Ditemukan</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    id="input-tanggal"
                  />
                </div>

                {/* Submit */}
                <button
                  className={styles.btnSimpan}
                  onClick={handleSubmit}
                  disabled={saving}
                  id="btn-simpan"
                >
                  {saving ? 'MENYIMPAN...' : 'SIMPAN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM MODAL ===== */}
      {deleteId && (
        <div className={styles.modalOverlay} onClick={() => setDeleteId(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <h3 style={{ marginBottom: '16px', color: '#fff', fontSize: '24px' }}>Hapus Barang?</h3>
            <p style={{ color: '#ccc', marginBottom: '32px', fontSize: '16px' }}>Yakin ingin menghapus barang ini secara permanen?</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button 
                onClick={() => setDeleteId(null)}
                style={{
                  padding: '12px 24px',
                  background: '#4b5563',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '30px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  executeDelete(deleteId);
                  setDeleteId(null);
                }}
                style={{
                  padding: '12px 24px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '30px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
