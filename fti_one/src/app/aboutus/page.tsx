'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './aboutus.module.css';

type Tab = 'who' | 'divisions' | 'team';

const misiList = [
  'Menampung dan menyuarakan aspirasi mahasiswa FTI Untar secara aktif dan berkelanjutan dengan mengutamakan nilai integritas dan keberpihakan terhadap kepentingan mahasiswa.',
  'Menjalin kolaborasi yang sinergis dengan pihak internal dan eksternal FTI Untar untuk menciptakan perubahan positif yang nyata bagi seluruh elemen kampus.',
  'Meningkatkan kualitas komunikasi serta keterbukaan informasi guna membangun hubungan yang kuat dan transparan antar mahasiswa dan lembaga.',
  'Mendorong budaya organisasi yang profesional dan progresif, dengan sistem kerja yang terstruktur, partisipatif, dan berorientasi pada kebermanfaatan.',
  'Membangun suasana internal DPM FTI yang harmonis dan solid, dengan menjunjung tinggi asas kekeluargaan dan semangat gotong royong antar anggota.',
];

const komisiData = [
  {
    title: 'KOMISI 1',
    tasks: [
      'Menjadi tempat mahasiswa FTI UNTAR menyampaikan kritik, saran, dan pendapat.',
      'Mengkaji serta mengevaluasi peraturan AD-ART di fakultas dan universitas.',
      'Mengawasi implementasi peraturan yang telah ditetapkan.',
    ],
  },
  {
    title: 'KOMISI 2',
    tasks: [
      'Mengontrol keuangan AD/ART dalam Ormawa FTI UNTAR dengan memeriksa pemakaian dana.',
      'Berkewajiban mengawasi dan mempertanyakan seluruh kegiatan yang dilakukan oleh Ormawa FTI UNTAR.',
    ],
  },
  {
    title: 'KOMISI 3',
    tasks: [
      'Menjadi penghubung dan membangun relasi baik dengan seluruh civitas Untar.',
      'Memperkenalkan kegiatan atau program kerja dari DPM FTI Untar melalui media sosial.',
      'Membuat konten-konten menarik dan informatif untuk dibagikan di sosial media DPM FTI Untar.',
    ],
  },
  {
    title: 'KOMISI 4',
    tasks: [
      'Tugas Harian Komisi IV: Melakukan pengembangan terhadap sistematika internal dan eksternal DPM FTI UNTAR.',
      'Bertanggung jawab atas arsip atau penyimpanan berkas dan properti DPM FTI UNTAR.',
      'Mengawasi piket dan penggunaan Pakaian Dinas Lapangan (PDL) DPM FTI UNTAR.',
    ],
  },
];

const DIVISIONS = [
  { id: 'bphi', label: 'BPHI' },
  { id: 'komisi1', label: 'KOMISI 1' },
  { id: 'komisi2', label: 'KOMISI 2' },
  { id: 'komisi3', label: 'KOMISI 3' },
  { id: 'komisi4', label: 'KOMISI 4' },
];
function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Types 

interface TeamPhoto {
  _id: string;
  division: string;
  name: string;
  imageUrl: string;
}

//  Main Component 

export default function InformasiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('who');

  // Our Team state
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [photos, setPhotos] = useState<TeamPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploadingDiv, setUploadingDiv] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [nameModalDiv, setNameModalDiv] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [editingVideo, setEditingVideo] = useState(false);
  const [videoInput, setVideoInput] = useState('');
  const memberInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const groupInputRef = useRef<HTMLInputElement>(null);

  // ── Auth init ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      const tok = localStorage.getItem('token');
      if (stored) {
        const u = JSON.parse(stored);
        setIsSuperAdmin(u.role === 'superadmin');
      }
      if (tok) setToken(tok);
    } catch (_) { }
  }, []);

  // ── Fetch foto saat tab team dibuka ──
  const fetchPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    try {
      const res = await fetch(`${API_BASE}/api/team-photos`);
      const json = await res.json();
      if (json.success) setPhotos(json.data);
    } catch (_) {
      showToast('Gagal memuat foto.');
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'team') fetchPhotos();
  }, [activeTab, fetchPhotos]);

  // ── Toast helper ──
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // ── File picked -> open name modal ──
  const handleFilePicked = (divId: string, file: File) => {
    setPendingFile(file);
    setNameInput(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    setNameModalDiv(divId);
  };

  // ── Confirm upload after name entered ──
  const confirmUpload = async () => {
    if (!pendingFile || !nameModalDiv || !nameInput.trim()) return;
    const divId = nameModalDiv;
    setNameModalDiv(null);
    setUploadingDiv(divId);

    try {
      const formData = new FormData();
      formData.append('file', pendingFile);
      formData.append('division', divId);
      formData.append('name', nameInput.trim());

      const res = await fetch(`${API_BASE}/api/team-photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        // Foto grup hanya 1 — ganti state lama
        if (divId === 'group') {
          setPhotos(prev => [...prev.filter(p => p.division !== 'group'), json.data]);
        } else {
          setPhotos(prev => [...prev, json.data]);
        }
        showToast('Foto berhasil diupload!');
      } else {
        showToast(json.message ?? 'Upload gagal.');
      }
    } catch (_) {
      showToast('Terjadi kesalahan saat upload.');
    } finally {
      setUploadingDiv(null);
      setPendingFile(null);
      setNameInput('');
    }
  };

  // ── Delete ──
  const deletePhoto = async (id: string) => {
    if (!confirm('Hapus foto ini?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/team-photos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setPhotos(prev => prev.filter(p => p._id !== id));
        showToast('Foto berhasil dihapus.');
      } else {
        showToast(json.message ?? 'Hapus gagal.');
      }
    } catch (_) {
      showToast('Terjadi kesalahan saat menghapus.');
    } finally {
      setDeletingId(null);
    }
  };
  const toEmbedUrl = (url: string): string | null => {
    try {
      // Sudah embed
      if (url.includes('youtube.com/embed/')) return url;
      // youtu.be/ID
      const short = url.match(/youtu\.be\/([^?&]+)/);
      if (short) return `https://www.youtube.com/embed/${short[1]}`;
      // youtube.com/watch?v=ID
      const watch = url.match(/[?&]v=([^?&]+)/);
      if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
      return null;
    } catch (_) { return null; }
  };
  // ── Derived ──
  const groupPhoto = photos.find(p => p.division === 'group');
  const byDiv = (id: string) => photos.filter(p => p.division === id);

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/video-url`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) setVideoUrl(json.data);
      })
      .catch(() => { });
  }, []);

  return (
    <div className={styles.pageWrapper}>

      {/* ── Toast ── */}
      {toastMsg && <div className={styles.toast}>{toastMsg}</div>}

      {/* ── Name modal ── */}
      {nameModalDiv && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3 className={styles.modalTitle}>Nama Anggota</h3>
            <p className={styles.modalSub}>Masukkan nama yang akan ditampilkan di bawah foto.</p>
            <input
              className={styles.modalInput}
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmUpload()}
              placeholder="Nama anggota..."
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => { setNameModalDiv(null); setPendingFile(null); }}
              >
                Batal
              </button>
              <button
                className={styles.modalConfirm}
                onClick={confirmUpload}
                disabled={!nameInput.trim()}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Bar ── */}
      <div className={styles.tabBar}>
        {(['who', 'divisions', 'team'] as Tab[]).map(tab => (
          <button
            key={tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'who' ? 'Who are we?' : tab === 'divisions' ? 'Divisions' : 'Our Team'}
          </button>
        ))}
      </div>

      {/* ── Content Card ── */}
      <div
        className={`${styles.card} ${activeTab === 'divisions' || activeTab === 'team' ? styles.divisionCardWrapper : ''
          }`}
      >

        {/* ══ WHO ARE WE ══ */}
        {activeTab === 'who' && (
          <div className={styles.section}>

            {/* Decorative dots
            <div className={styles.dotsTop} aria-hidden="true">
              <span /><span /><span />
            </div> */}

            {/* Title */}
            <h1 className={styles.mainTitle}>
              Dewan Perwakilan Fakultas<br />Teknologi Informasi
            </h1>

            {/* About block */}
            <div className={styles.aboutBlock}>
              <div className={styles.logoBox}>
                <img src="/Rectangle.png" alt="DPM FTI Logo" className={styles.logoImg} />
              </div>
              <p className={styles.aboutText}>
                Dewan Perwakilan Mahasiswa Fakultas Teknologi Informasi Universitas Tarumanagara
                (DPM FTI UNTAR) merupakan sebuah organisasi mahasiswa di tingkat fakultas yang
                berperan sebagai lembaga legislatif mahasiswa. DPM FTI UNTAR memiliki tugas utama
                yaitu menyusun Peraturan Daerah (Perda) Fakultas Teknologi Informasi, menyediakan
                layanan advokasi bagi mahasiswa, mewakili aspirasi mahasiswa, melakukan pengawasan
                melalui SOP terhadap lembaga eksekutif, serta memastikan bahwa setiap kebijakan
                yang diambil oleh lembaga eksekutif mahasiswa (BEM dan HMP) berjalan sesuai dengan
                kepentingan mahasiswa Fakultas Teknologi Informasi.
              </p>
            </div>
            {/* <div className={styles.divider} aria-hidden="true" /> */}
            <div className={styles.videoSection}>
              <div className={styles.videoHeader}>
                {/* <h3 className={styles.videoTitle}>Tentang Kami</h3> */}
                {isSuperAdmin && !editingVideo && (
                  <button
                    className={styles.videoEditBtn}
                    onClick={() => { setVideoInput(videoUrl); setEditingVideo(true); }}
                  >
                    <IconEdit /> Ganti video
                  </button>
                )}
              </div>

              {isSuperAdmin && editingVideo && (
                <div className={styles.videoEditRow}>
                  <input
                    className={styles.videoEditInput}
                    type="text"
                    value={videoInput}
                    onChange={e => setVideoInput(e.target.value)}
                    placeholder="Paste link YouTube..."
                    autoFocus
                    onKeyDown={e => e.key === 'Escape' && setEditingVideo(false)}
                  />
                  <button
                    className={styles.videoSaveBtn}
                    onClick={async () => {
                      const embed = toEmbedUrl(videoInput.trim());
                      if (!embed) { showToast('Link YouTube tidak valid.'); return; }
                      try {
                        const res = await fetch(`${API_BASE}/api/settings/video-url`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ url: embed }),
                        });
                        const json = await res.json();
                        if (json.success) { setVideoUrl(embed); setEditingVideo(false); showToast('Video berhasil diganti!'); }
                        else showToast(json.message ?? 'Gagal menyimpan.');
                      } catch (_) { showToast('Terjadi kesalahan.'); }
                    }}
                    disabled={!videoInput.trim()}
                  >
                    Simpan
                  </button>
                  <button className={styles.videoCancelBtn} onClick={() => setEditingVideo(false)}>
                    Batal
                  </button>
                </div>
              )}

              <div className={styles.videoWrapper}>
                {videoUrl ? (
                  <iframe
                    className={styles.videoIframe}
                    src={videoUrl}
                    title="Video DPM FTI UNTAR"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className={styles.videoPlaceholder}>
                    <span style={{ color: 'rgba(100,100,100,0.5)', fontSize: '13px' }}>Memuat video...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className={styles.divider} aria-hidden="true" />

            {/* Visi & Misi */}
            <h2 className={styles.visiTitle}>VISI &amp; MISI</h2>

            <p className={styles.visiText}>
              Menjadikan DPM FTI sebagai lembaga yang berintegritas dan mengutamakan peran sebagai
              perwakilan mahasiswa dalam memperjuangkan aspirasi mahasiswa FTI Untar melalui
              kolaborasi aktif demi mewujudkan perubahan positif di lingkungan FTI Untar.
            </p>

            <ol className={styles.misiList}>
              {misiList.map((m, i) => (
                <li key={i} className={styles.misiItem}>
                  <span className={styles.misiNum}>{i + 1}.</span>
                  <span>{m}</span>
                </li>
              ))}
            </ol>

            {/* ── Maskot Section ── */}
            <div className={styles.divider} aria-hidden="true" />
            <div className={styles.mascotSection}>
              <h2 className={styles.mascotTitle}>MASKOT KAMI</h2>
              <div className={styles.mascotBlock}>
                <img src="/Mascot.png" alt="Maskot DPM FTI" className={styles.mascotImg} />
                <div className={styles.mascotText}>
                  {/* <h3 className={styles.mascotName}>Dipo</h3> */}
                  <p className={styles.mascotDesc}>
                    Dipo hadir sebagai simbol semangat
                    dan keberanian mahasiswa FTI Untar dalam menyuarakan aspirasi. Layaknya badak yang kokoh dan
                    tangguh, Dipo mencerminkan keteguhan DPM FTI dalam memperjuangkan hak-hak mahasiswa.
                    Dengan semangatnya yang membara, Dipo selalu siap mendampingi setiap langkah perjuangan
                    civitas akademika Fakultas Teknologi Informasi Universitas Tarumanagara.
                  </p>
                </div>
              </div>
            </div>
          </div>


        )}

        {/* ══ DIVISIONS ══ */}
        {activeTab === 'divisions' && (
          <div className={styles.divisionsWrapper}>
            <div className={styles.divisionsGrid}>
              {komisiData.map((komisi, i) => (
                <div key={i} className={styles.divisionCard}>
                  <h2 className={styles.divisionCardTitle}>{komisi.title}</h2>
                  <p className={styles.divisionTaskHeading}>Tugas harian komisi {i + 1} :</p>
                  {/* <br /> */}
                  <ul className={styles.divisionTaskList}>
                    {komisi.tasks.map((task, j) => (
                      <li key={j} className={styles.divisionTaskItem}>
                        <span className={styles.divisionTaskIcon}>🔧</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* ══ OUR TEAM ══ */}
        {activeTab === 'team' && (
          <div className={styles.teamWrapper}>

            <div className={styles.dotsTop} aria-hidden="true">
              <span /><span /><span />
            </div>
            <h1 className={styles.teamTitle}>OUR TEAM</h1>
            <br />
            {/* <p className={styles.teamSubtitle}>DPM FTI UNTAR · Periode 2025-2026</p> */}

            {/* Loading */}
            {loadingPhotos && (
              <div className={styles.loadingWrap}>
                <div className={styles.spinner} />
                <span className={styles.loadingText}>Memuat foto...</span>
              </div>
            )}

            {!loadingPhotos && (
              <>
                {/* ── Group Photo ── */}
                <div className={styles.groupPhotoSection}>
                  {groupPhoto ? (
                    <div className={styles.groupPhotoWrap}>
                      <img src={groupPhoto.imageUrl} alt="Foto Tim DPM FTI" className={styles.groupImg} />
                      {isSuperAdmin && (
                        <div className={styles.groupPhotoActions}>
                          <button
                            className={styles.groupReplaceBtn}
                            onClick={() => groupInputRef.current?.click()}
                            disabled={uploadingDiv === 'group'}
                          >
                            <IconUpload />
                            {uploadingDiv === 'group' ? 'Mengganti...' : 'Ganti foto'}
                          </button>
                          <button
                            className={styles.groupDeleteBtn}
                            onClick={() => deletePhoto(groupPhoto._id)}
                            disabled={deletingId === groupPhoto._id}
                          >
                            <IconTrash />
                            {deletingId === groupPhoto._id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.groupPlaceholder}>
                      <IconPeople />
                      <p className={styles.groupPlaceholderText}>
                        {isSuperAdmin ? 'Upload foto tim di sini' : 'Foto tim belum tersedia'}
                      </p>
                      {isSuperAdmin && (
                        <button
                          className={styles.uploadGroupBtn}
                          onClick={() => groupInputRef.current?.click()}
                          disabled={uploadingDiv === 'group'}
                        >
                          <IconUpload />
                          {uploadingDiv === 'group' ? 'Mengupload...' : 'Upload Foto Tim'}
                        </button>
                      )}
                    </div>
                  )}
                  {isSuperAdmin && (
                    <input
                      ref={groupInputRef}
                      type="file" accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) handleFilePicked('group', f);
                        e.target.value = '';
                      }}
                    />
                  )}
                </div>

                <div className={styles.teamDivider} />

                {/* ── Per-Division Sections ── */}
                {DIVISIONS.map(div => {
                  const divPhotos = byDiv(div.id);
                  const isUploading = uploadingDiv === div.id;

                  return (
                    <div key={div.id} className={styles.divSection}>
                      <div className={styles.divSectionHeader}>
                        <div className={styles.divSectionLine} />
                        <h2 className={styles.divSectionTitle}>{div.label}</h2>
                        <div className={styles.divSectionLine} />
                      </div>

                      <div className={styles.memberGrid}>
                        {divPhotos.map(p => (
                          <div key={p._id} className={styles.memberCard}>
                            <div className={styles.memberImgWrap}>
                              <img src={p.imageUrl} alt={p.name} className={styles.memberImg} />
                              {isSuperAdmin && (
                                <button
                                  className={styles.memberDeleteBtn}
                                  onClick={() => deletePhoto(p._id)}
                                  disabled={deletingId === p._id}
                                  title="Hapus foto"
                                >
                                  {deletingId === p._id ? <IconSpinner /> : <IconTrash size={13} />}
                                </button>
                              )}
                            </div>
                            <p className={styles.memberName}>{p.name}</p>
                          </div>
                        ))}

                        {isSuperAdmin && (
                          <div
                            className={`${styles.uploadSlot} ${isUploading ? styles.uploadSlotLoading : ''}`}
                            onClick={() => !isUploading && memberInputRefs.current[div.id]?.click()}
                            role="button" tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && !isUploading && memberInputRefs.current[div.id]?.click()}
                          >
                            <input
                              ref={el => { memberInputRefs.current[div.id] = el; }}
                              type="file" accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleFilePicked(div.id, f);
                                e.target.value = '';
                              }}
                            />
                            {isUploading ? <IconSpinner /> : <IconUpload color="rgba(255,255,255,0.4)" />}
                            <span className={styles.uploadSlotLabel}>
                              {isUploading ? 'Mengupload...' : 'Upload foto'}
                            </span>
                          </div>
                        )}

                        {!isSuperAdmin && divPhotos.length === 0 && (
                          <p className={styles.emptyState}>Belum ada foto anggota.</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isSuperAdmin && (
                  <div className={styles.adminBadge}>
                    <IconStar /> Mode Superadmin
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

//  Icons 

function IconUpload({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconTrash({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <circle cx="17" cy="8" r="2" />
      <path d="M21 21v-1a3 3 0 0 0-3-3h-1" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      style={{ animation: 'teamSpin 0.8s linear infinite' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}