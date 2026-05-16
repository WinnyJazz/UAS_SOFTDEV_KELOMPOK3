'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function AdminInfo() {
  const router = useRouter();
  const [infos, setInfos] = useState<InfoItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Modal Tambah Info
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    judul: '',
    isi: '',
    kategori: 'Pengumuman',
    media: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Basic auth check
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || (user.role !== 'admin' && user.role !== 'superadmin')) {
      router.push('/login'); // Arahkan kalau bukan admin
      return;
    }
    fetchInfos();
  }, [router]);

  const fetchInfos = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/informasi');
      const data = await res.json();
      if (data.success) {
        setInfos(data.data);
      }
    } catch (err) {
      console.error('Gagal fetch info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm('Apakah kamu yakin ingin menghapus informasi ini?')) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/informasi/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if(data.success) {
          alert('Berhasil dihapus!');
          fetchInfos(); 
        } else {
          alert(data.message || 'Gagal menghapus');
        }
      } catch (error) {
        console.error("Error delete:", error);
      }
    }
  };

  // Convert File ke Base64 untuk image preview & upload simple
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, media: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const res = await fetch('http://localhost:5000/api/informasi', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          adminId: user.adminId || user.id || 'admin'
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Informasi berhasil ditambahkan!');
        setShowModal(false);
        setFormData({ judul: '', isi: '', kategori: 'Pengumuman', media: '' });
        fetchInfos(); 
      } else {
        alert(data.message || 'Gagal menyimpan');
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.adminHeader}>
        <button className={styles.btnBack} onClick={() => router.push('/admin/dashboard')}>
          ← Dashboard
        </button>
        <button className={styles.btnAdd} onClick={() => setShowModal(true)}>
          + Tambah Info
        </button>
      </div>

      <div className={styles.contentContainer}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.mainTitle}>INFORMASI TERKINI</h1>
        </div>

        {loading ? (
          <div className={styles.loading}>Memuat informasi...</div>
        ) : infos.length === 0 ? (
          <div className={styles.empty}>Belum ada informasi yang diunggah.</div>
        ) : (
          <div className={styles.gridContainer}>
            {infos.map((info) => (
              <div key={info.informasiId || info._id} className={styles.card}>
                
                <div className={styles.adminActions}>
                  <button className={styles.btnEdit} title="Edit">✏️</button>
                  <button 
                    className={styles.btnDelete} 
                    onClick={() => handleDelete(info.informasiId || info._id!)} 
                    title="Hapus"
                  >🗑️</button>
                </div>

                <div className={styles.imageWrapper}>
                  <img 
                    src={info.media || `https://via.placeholder.com/400x500/1e0050/ffffff?text=${encodeURIComponent(info.judul)}`} 
                    alt={info.judul} 
                  />
                </div>
                
                <h3 className={styles.cardTitle}>{info.judul}</h3>
                <p className={styles.cardDate}>{formatDate(info.tanggal)}</p>
                
                <button className={styles.btnMore}>MORE DETAILS</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH INFO */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Tambah Info</h2>
              <button className={styles.btnClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Judul</label>
                <input 
                  type="text" required 
                  value={formData.judul}
                  onChange={(e) => setFormData({...formData, judul: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Kategori</label>
                <select 
                  value={formData.kategori}
                  onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                >
                  <option value="Pengumuman">Pengumuman</option>
                  <option value="Berita">Berita</option>
                  <option value="Kegiatan">Kegiatan</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Gambar</label>
                <input type="file" accept="image/*" onChange={handleFileChange} />
                {formData.media && <img src={formData.media} alt="Preview" className={styles.previewImage} />}
              </div>

              <div className={styles.formGroup}>
                <label>Isi (Deskripsi)</label>
                <textarea 
                  required rows={4}
                  value={formData.isi}
                  onChange={(e) => setFormData({...formData, isi: e.target.value})}
                ></textarea>
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}