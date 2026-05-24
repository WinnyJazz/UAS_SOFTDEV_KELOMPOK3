'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './superadmin.module.css';

// ── Types ──────────────────────────────────────────────
type Section = 'overview' | 'lostfound' | 'aspirasi' | 'userdata' | 'notif';
type LFStatus = 'Pending' | 'Claimed' | 'Expired';
type LFTab = 'Semua' | 'Pending' | 'Claimed' | 'Expired';
type NotifCategory = 'Semua' | 'Lost & Found' | 'Aspirasi' | 'User' | 'Sistem';
type NotifReadFilter = 'Semua' | 'Belum Dibaca' | 'Sudah Dibaca';

interface User {
    userId: string;
    nama: string;
    email: string;
    nim?: string;
    role: string;
    isVerified?: boolean;
}

interface AdminUser {
    adminId: string;
    nama: string;
    email: string;
    nim?: string;
    role: string;
}

interface LFItem {
    id: string;
    barang: string;
    penemu: string;
    lokasi: string;
    tanggal: string;
    status: LFStatus;
    claimedBy?: string;
}

interface AspirasiItem {
    id: number;
    judul: string;
    isi: string;
    kategori: string;
    status: string;
    tanggal: string;
    response?: string;
}

interface NotifItem {
    id: number;
    icon: string;
    iconBg: string;
    title: string;
    desc: string;
    time: string;
    read: boolean;
    category: NotifCategory;
}

// ── Mock Data ──────────────────────────────────────────
const INITIAL_LF_ITEMS: LFItem[] = [
    { id: '1', barang: 'Charger Hitam', penemu: 'Riko A.', lokasi: 'R.904 Lt.9', tanggal: '12 Mei 2025', status: 'Pending' },
    { id: '2', barang: 'Dompet Coklat', penemu: 'Dewi S.', lokasi: 'Kantin FTI', tanggal: '11 Mei 2025', status: 'Claimed', claimedBy: 'Budi Santoso (115220001)' },
    { id: '3', barang: 'Laptop ASUS', penemu: 'Admin', lokasi: 'Lab Komputer', tanggal: '10 Mei 2025', status: 'Pending' },
    { id: '4', barang: 'Kacamata', penemu: 'Budi T.', lokasi: 'Perpustakaan', tanggal: '09 Mei 2025', status: 'Claimed', claimedBy: 'Sari Putri (115220042)' },
    { id: '5', barang: 'Earphone', penemu: 'Sari P.', lokasi: 'Lobby FTI', tanggal: '08 Mei 2025', status: 'Expired' },
    { id: '6', barang: 'Payung Biru', penemu: 'Ahmad F.', lokasi: 'Tangga Lt.3', tanggal: '07 Mei 2025', status: 'Pending' },
    { id: '7', barang: 'ID Card', penemu: 'Rina W.', lokasi: 'Lift FTI', tanggal: '06 Mei 2025', status: 'Expired' },
];

const ASPIRASI_BY_MONTH: Record<string, AspirasiItem[]> = {
    'Mei 2025': [
        { id: 1, judul: 'Perbaikan AC', isi: 'AC di R.904 Lt.9 sudah rusak 2 minggu', kategori: 'Fasilitas', status: 'Dalam Proses', tanggal: '12 Mei 2025', response: 'Sudah dikordinasikan dengan tim teknis.' },
        { id: 2, judul: 'Jadwal UAS', isi: 'Minta kejelasan jadwal UAS semester ini', kategori: 'Akademik', status: 'Selesai', tanggal: '10 Mei 2025', response: 'Jadwal UAS sudah diunggah di portal akademik.' },
        { id: 3, judul: 'Beasiswa Info', isi: 'Update info beasiswa lebih cepat', kategori: 'Kemahasiswaan', status: 'Pending', tanggal: '08 Mei 2025' },
    ],
    'April 2025': [
        { id: 4, judul: 'Parkir Motor', isi: 'Kapasitas parkir motor sudah sangat penuh', kategori: 'Fasilitas', status: 'Selesai', tanggal: '28 Apr 2025', response: 'Area parkir tambahan sudah dibuka di gedung B.' },
        { id: 5, judul: 'WiFi Kampus', isi: 'Kecepatan WiFi di Lab menurun drastis', kategori: 'Fasilitas', status: 'Selesai', tanggal: '20 Apr 2025', response: 'Infrastruktur jaringan sudah diupgrade.' },
    ],
    'Maret 2025': [
        { id: 6, judul: 'Ruang Diskusi', isi: 'Butuh ruang diskusi tambahan untuk mahasiswa', kategori: 'Fasilitas', status: 'Dalam Proses', tanggal: '15 Mar 2025', response: 'Sedang dalam evaluasi ketersediaan ruangan.' },
        { id: 7, judul: 'Dosen Pembimbing', isi: 'Jadwal konsultasi dosen susah ditemui', kategori: 'Akademik', status: 'Selesai', tanggal: '05 Mar 2025', response: 'Sistem booking konsultasi online sudah dibuat.' },
    ],
};

const INITIAL_NOTIFS: NotifItem[] = [
    { id: 1, icon: '📦', iconBg: '#ede9fe', title: 'Claim Barang Baru', desc: 'Budi Santoso mengklaim charger hitam di R.904', time: '2 menit lalu', read: false, category: 'Lost & Found' },
    { id: 2, icon: '👤', iconBg: '#dbeafe', title: 'User Baru Terdaftar', desc: 'sari.putri@student.untar.ac.id mendaftar dan menunggu verifikasi', time: '15 menit lalu', read: false, category: 'User' },
    { id: 3, icon: '💬', iconBg: '#d1fae5', title: 'Aspirasi Baru Masuk', desc: 'Aspirasi tentang perbaikan AC Lt.9 telah diterima', time: '1 jam lalu', read: false, category: 'Aspirasi' },
    { id: 4, icon: '⚠️', iconBg: '#fef3c7', title: 'Barang Hampir Expired', desc: '5 barang akan expired dalam 3 hari jika tidak diklaim', time: '3 jam lalu', read: true, category: 'Lost & Found' },
    { id: 5, icon: '🔐', iconBg: '#fee2e2', title: 'Login Baru Terdeteksi', desc: 'Login admin dari perangkat baru (Chrome / Windows)', time: 'Kemarin, 20:34', read: true, category: 'Sistem' },
    { id: 6, icon: '💬', iconBg: '#d1fae5', title: 'Aspirasi Di-followup', desc: 'Aspirasi "Parkir Motor" telah mendapat respon', time: 'Kemarin, 14:00', read: true, category: 'Aspirasi' },
];

// ── Badge Helper ───────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        Pending: styles.badgeYellow,
        Claimed: styles.badgeGreen,
        Expired: styles.badgeRed,
        Selesai: styles.badgeGreen,
        'Dalam Proses': styles.badgeYellow,
        Verified: styles.badgeVerified,
        User: styles.statusMahasiswa,
        Admin: styles.statusAdmin,
        superadmin: styles.statusSuperAdmin,
        mahasiswa: styles.statusMahasiswa,
        admin: styles.statusAdmin,
    };
    return <span className={`${styles.statusBadge} ${map[status] ?? styles.statusMahasiswa}`}>{status}</span>;
}

// ── Main Component ─────────────────────────────────────
export default function SuperAdminDashboard() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [mahasiswas, setMahasiswas] = useState<User[]>([]);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
    const [changingRole, setChangingRole] = useState(false);
    const [downgradingAdmin, setDowngradingAdmin] = useState(false);

    const [activeSection, setActiveSection] = useState<Section>('overview');

    const [lfItems, setLfItems] = useState<LFItem[]>(INITIAL_LF_ITEMS);
    const [lfTab, setLfTab] = useState<LFTab>('Semua');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editStatus, setEditStatus] = useState<LFStatus>('Pending');
    const [editClaimedBy, setEditClaimedBy] = useState('');

    const [aspirasiData, setAspirasiData] = useState<Record<string, AspirasiItem[]>>(ASPIRASI_BY_MONTH);
    const [openMonths, setOpenMonths] = useState<string[]>(['Mei 2025']);
    const [respondingId, setRespondingId] = useState<number | null>(null);
    const [responseText, setResponseText] = useState('');

    const [notifs, setNotifs] = useState<NotifItem[]>(INITIAL_NOTIFS);
    const [notifReadFilter, setNotifReadFilter] = useState<NotifReadFilter>('Semua');
    const [notifCatFilter, setNotifCatFilter] = useState<NotifCategory>('Semua');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        // For dev/preview: use a mock user if none found
        if (!storedUser || !token) {
            setUser({ userId: '1', nama: 'Super Admin', email: 'superadmin@untar.ac.id', role: 'superadmin' });
            setLoading(false);
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'superadmin' && parsedUser.role !== 'admin') { router.push('/dashboard'); return; }
        setUser(parsedUser);
        fetchUsers(token);
        fetchDashboardData(token);
        setLoading(false);
    }, [router]);

    const fetchUsers = async (token: string) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/users', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setMahasiswas(data.data.mahasiswas);
                setAdmins(data.data.admins);
            } else {
                setError('Gagal mengambil data user');
            }
        } catch {
            setError('Tidak dapat terhubung ke server');
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardData = async (token: string) => {
        try {
            const lfRes = await fetch('http://localhost:5000/api/dashboard/lostfound', {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('LF status:', lfRes.status);
            if (lfRes.ok) {
                const lfData = await lfRes.json();
                console.log('LF data:', lfData.data);
                setLfItems(lfData.data);
            }

            const aspRes = await fetch('http://localhost:5000/api/dashboard/aspirasi', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (aspRes.ok) {
                const aspData = await aspRes.json();
                setAspirasiData(aspData.data);
            }

            const notifRes = await fetch('http://localhost:5000/api/dashboard/notifikasi', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (notifRes.ok) {
                const notifData = await notifRes.json();
                setNotifs(notifData.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUserSelect = (userId: string) =>
        setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);

    const handleAdminSelect = (adminId: string) =>
        setSelectedAdmins(prev => prev.includes(adminId) ? prev.filter(id => id !== adminId) : [...prev, adminId]);

    const handleChangeRole = async () => {
        if (selectedUsers.length === 0) return alert('Pilih minimal satu mahasiswa');
        const token = localStorage.getItem('token');
        if (!token) return;
        setChangingRole(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/change-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userIds: selectedUsers, newRole: 'admin' }),
            });
            if (res.ok) { alert('Role berhasil diubah!'); setSelectedUsers([]); fetchUsers(token); }
            else { const err = await res.json(); alert('Gagal: ' + err.message); }
        } catch { alert('Terjadi kesalahan'); }
        finally { setChangingRole(false); }
    };

    const handleDowngradeAdmin = async () => {
        if (selectedAdmins.length === 0) return alert('Pilih minimal satu admin');
        const token = localStorage.getItem('token');
        if (!token) return;
        if (!confirm(`Yakin mau downgrade ${selectedAdmins.length} admin ke mahasiswa?`)) return;
        setDowngradingAdmin(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/downgrade-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userIds: selectedAdmins }),
            });
            if (res.ok) { alert('Admin berhasil di-downgrade!'); setSelectedAdmins([]); fetchUsers(token); }
            else { const err = await res.json(); alert('Gagal: ' + err.message); }
        } catch { alert('Terjadi kesalahan'); }
        finally { setDowngradingAdmin(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        const logoutEvent = new CustomEvent('userLoggedOut');
        window.dispatchEvent(logoutEvent);
        
        router.push('/');
    };

    const verifiedUsers = mahasiswas
        .filter(m => m.isVerified)
        .map(m => `${m.nama} (${m.nim ?? m.userId})`);

    const filteredLF = lfItems.filter(i => lfTab === 'Semua' ? true : i.status === lfTab);

    const startEdit = (item: LFItem) => {
        setEditingId(item.id);
        setEditStatus(item.status);
        setEditClaimedBy(item.claimedBy ?? '');
    };

    const saveEdit = async (id: string) => {
        if (editStatus === 'Claimed' && !editClaimedBy) return;
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const res = await fetch(`http://localhost:5000/api/dashboard/lostfound/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ status: editStatus, claimedBy: editStatus === 'Claimed' ? editClaimedBy : null }),
                });
                if (!res.ok) console.error('Failed to save');
            } catch (err) { console.error(err); }
        }
        setLfItems(prev =>
            prev.map(i => i.id === id
                ? { ...i, status: editStatus, claimedBy: editStatus === 'Claimed' ? editClaimedBy : undefined }
                : i
            )
        );
        setEditingId(null);
    };

    const saveResponse = async (id: number) => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await fetch(`http://localhost:5000/api/dashboard/aspirasi/${id}/respond`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ response: responseText }),
                });
            } catch (err) { console.error(err); }
        }
        // Update local state
        setAspirasiData(prev => {
            const updated = { ...prev };
            for (const month in updated) {
                updated[month] = updated[month].map(a =>
                    a.id === id ? { ...a, response: responseText, status: 'Selesai' } : a
                );
            }
            return updated;
        });
        setRespondingId(null);
    };

    const toggleMonth = (month: string) =>
        setOpenMonths(prev => prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]);

    const startRespond = (item: AspirasiItem) => {
        setRespondingId(item.id);
        setResponseText(item.response ?? '');
    };

    const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    const markRead = (id: number) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    const filteredNotifs = notifs.filter(n => {
        const readOk = notifReadFilter === 'Semua' ? true : notifReadFilter === 'Belum Dibaca' ? !n.read : n.read;
        const catOk = notifCatFilter === 'Semua' ? true : n.category === notifCatFilter;
        return readOk && catOk;
    });

    const unreadCount = notifs.filter(n => !n.read).length;

    const mahasiswaBiasa = mahasiswas.filter(m => m.role === 'mahasiswa');
    const adminDowngradeable = admins.filter(a => a.role === 'admin');
    const superAdmins = admins.filter(a => a.role === 'superadmin');

    const lfTotal = lfItems.length;
    const lfClaimed = lfItems.filter(i => i.status === 'Claimed').length;
    const lfPending = lfItems.filter(i => i.status === 'Pending').length;
    const claimRate = lfTotal > 0 ? Math.round((lfClaimed / lfTotal) * 100) : 0;

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (!user) return null;

    const nav = (s: Section) => setActiveSection(s);

    return (
        <div className={styles.root}>

            {/* ── NAVBAR ── */}
            <nav className={styles.navbar}>
                <div className={styles.navLogo} onClick={() => nav('overview')}>
                    <span>DPM</span><span>FTI</span>
                </div>
                <ul className={styles.navLinks}>
                    <li><a href="#">Home</a></li>
                    <li><a href="#" className={styles.navActive}>About Us</a></li>
                    <li><a href="#">Aspirasi</a></li>
                    <li><a href="#">Info</a></li>
                    <li><a href="#">Lost &amp; Found</a></li>
                </ul>
                <div className={styles.navAvatar}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                </div>
            </nav>

            {/* ── LAYOUT ── */}
            <div className={styles.layout}>

                {/* ── SIDEBAR ── */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarAvatar}>
                        <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.85)" width="48" height="48">
                            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                    </div>
                    <div className={styles.sidebarName}>{user.nama}</div>
                    <div className={styles.sidebarRole}>{user.role === 'superadmin' ? 'Super Admin' : 'Admin'}</div>
                    <ul className={styles.sidebarMenu}>
                        {([
                            ['overview', '📊 Overview'],
                            ...(user.role === 'superadmin' ? [
                                ['userdata', '👥 User Data'],
                                ['notif', '🔔 Notifications'],
                            ] : []),
                        ] as [Section, string][]).map(([id, label]) => (
                            <li key={id}>
                                <a
                                    href="#"
                                    className={activeSection === id ? styles.sidebarActive : ''}
                                    onClick={e => { e.preventDefault(); nav(id); }}
                                >
                                    {label}
                                    {id === 'notif' && unreadCount > 0 && (
                                        <span className={styles.notifDot}>{unreadCount}</span>
                                    )}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <button onClick={handleLogout} className={styles.sidebarLogout}>Logout</button>
                </aside>

                {/* ── MAIN ── */}
                <main className={styles.main}>
                    {error && <div className={styles.errorBanner}>{error}</div>}

                    {/* ══════════ OVERVIEW ══════════ */}
                    {activeSection === 'overview' && (
                        <div>
                            <div className={styles.pageTitle}>
                                Hello welcome, <span className={styles.pageTitleName}>{user.nama}!</span>
                            </div>

                            <div className={styles.sectionLabel}>🔍 Lost &amp; Found</div>
                            <div className={styles.statRow}>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>📦</div>
                                    <div className={styles.statLabel}>Total Barang Ditemukan</div>
                                    <div className={styles.statValue}>{lfTotal}</div>
                                    <div className={styles.statSub}>+12 minggu ini</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>✅</div>
                                    <div className={styles.statLabel}>Barang Claimed</div>
                                    <div className={styles.statValue}>{lfClaimed}</div>
                                    <div className={styles.statSub}>{claimRate}% claim rate</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>⏳</div>
                                    <div className={styles.statLabel}>Pending Claim</div>
                                    <div className={styles.statValue}>{lfPending}</div>
                                    <div className={styles.statSub}>Perlu verifikasi</div>
                                </div>
                            </div>

                            <div className={styles.sectionLabel}>💬 Aspirasi</div>
                            <div className={styles.statRow}>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>💬</div>
                                    <div className={styles.statLabel}>Total Aspirasi</div>
                                    <div className={styles.statValue}>67</div>
                                    <div className={styles.statSub}>+5 bulan ini</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>🔄</div>
                                    <div className={styles.statLabel}>Dalam Proses</div>
                                    <div className={styles.statValue}>12</div>
                                    <div className={styles.statSub}>Menunggu respon</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>✔️</div>
                                    <div className={styles.statLabel}>Selesai Direspon</div>
                                    <div className={styles.statValue}>55</div>
                                    <div className={styles.statSub}>82% response rate</div>
                                </div>
                            </div>

                            <div className={styles.twoCol}>
                                <div className={styles.bigCard}>
                                    <h3>👥 Ringkasan User</h3>
                                    <div className={styles.summaryList}>
                                        <div className={styles.summaryRow}><span>Total Mahasiswa</span><strong>{mahasiswas.length}</strong></div>
                                        <div className={styles.summaryRow}><span>Terverifikasi</span><strong className={styles.textGreen}>{mahasiswas.filter(m => m.isVerified).length}</strong></div>
                                        <div className={styles.summaryRow}><span>Belum Verifikasi</span><strong className={styles.textYellow}>{mahasiswas.filter(m => !m.isVerified).length}</strong></div>
                                        <div className={styles.summaryRow}><span>Total Admin</span><strong className={styles.textPurple}>{adminDowngradeable.length}</strong></div>
                                        <div className={styles.summaryRow}><span>Notifikasi Belum Dibaca</span><strong className={styles.textRed}>{unreadCount}</strong></div>
                                    </div>
                                </div>
                                <div className={styles.bigCard}>
                                    <h3>🕐 Aktivitas Terbaru</h3>
                                    <div className={styles.feedItem}>
                                        <div className={styles.feedDot} style={{ background: '#22c55e' }} />
                                        <div><div className={styles.feedText}>User <b>Budi Santoso</b> melakukan claim charger</div><div className={styles.feedTime}>2 menit lalu</div></div>
                                    </div>
                                    <div className={styles.feedItem}>
                                        <div className={styles.feedDot} style={{ background: '#7c3aed' }} />
                                        <div><div className={styles.feedText}>Aspirasi baru masuk dari <b>Mahasiswa TI 2023</b></div><div className={styles.feedTime}>15 menit lalu</div></div>
                                    </div>
                                    <div className={styles.feedItem}>
                                        <div className={styles.feedDot} style={{ background: '#3b82f6' }} />
                                        <div><div className={styles.feedText}>User baru terdaftar: <b>sari.putri@student.untar.ac.id</b></div><div className={styles.feedTime}>1 jam lalu</div></div>
                                    </div>
                                    <div className={styles.feedItem}>
                                        <div className={styles.feedDot} style={{ background: '#f59e0b' }} />
                                        <div><div className={styles.feedText}>Barang <b>Laptop ASUS</b> ditambahkan admin</div><div className={styles.feedTime}>3 jam lalu</div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════ USER DATA ══════════ */}
                    {activeSection === 'userdata' && (
                        <div>
                            <div className={styles.pageTitle}>User Data</div>
                            <div className={styles.statRow}>
                                <div className={styles.statCard}><div className={styles.statIcon}>👥</div><div className={styles.statLabel}>Total Mahasiswa</div><div className={styles.statValue}>{mahasiswas.length}</div></div>
                                <div className={styles.statCard}><div className={styles.statIcon}>🟢</div><div className={styles.statLabel}>Terverifikasi</div><div className={styles.statValue}>{mahasiswas.filter(m => m.isVerified).length}</div></div>
                                <div className={styles.statCard}><div className={styles.statIcon}>⏳</div><div className={styles.statLabel}>Belum Verifikasi</div><div className={styles.statValue}>{mahasiswas.filter(m => !m.isVerified).length}</div></div>
                            </div>

                            {/* Tabel Mahasiswa */}
                            <div className={styles.bigCard}>
                                <div className={styles.cardHeader}>
                                    <h3>🎓 Daftar Mahasiswa ({mahasiswaBiasa.length})</h3>
                                    {selectedUsers.length > 0 && (
                                        <div className={styles.inlineActionBar}>
                                            <span className={styles.selectedCount}>{selectedUsers.length} dipilih</span>
                                            <button onClick={handleChangeRole} disabled={changingRole} className={styles.btnSaveSmall}>
                                                {changingRole ? 'Memproses...' : 'Jadikan Admin'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.tableWrap}>
                                    <table className={styles.tbl}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: 40 }}>
                                                    <input type="checkbox" className={styles.checkbox}
                                                        checked={selectedUsers.length === mahasiswaBiasa.length && mahasiswaBiasa.length > 0}
                                                        onChange={e => setSelectedUsers(e.target.checked ? mahasiswaBiasa.map(m => m.userId) : [])}
                                                    />
                                                </th>
                                                <th>Nama</th><th>Email</th><th>NIM</th><th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mahasiswaBiasa.length > 0 ? mahasiswaBiasa.map(mhs => (
                                                <tr key={mhs.userId} className={selectedUsers.includes(mhs.userId) ? styles.rowSelected : ''}>
                                                    <td>
                                                        <input type="checkbox" className={styles.checkbox}
                                                            checked={selectedUsers.includes(mhs.userId)}
                                                            onChange={() => handleUserSelect(mhs.userId)} />
                                                    </td>
                                                    <td>{mhs.nama}</td>
                                                    <td>{mhs.email}</td>
                                                    <td>{mhs.nim}</td>
                                                    <td>
                                                        {mhs.isVerified
                                                            ? <span className={styles.badgeVerified}>✅ Terverifikasi</span>
                                                            : <span className={styles.badgeUnverified}>❌ Belum Verifikasi</span>}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={5} className={styles.emptyState}>Tidak ada mahasiswa</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Tabel Admin */}
                            <div className={styles.bigCard}>
                                <div className={styles.cardHeader}>
                                    <h3>🛡️ Daftar Admin ({adminDowngradeable.length})</h3>
                                    {selectedAdmins.length > 0 && (
                                        <div className={styles.inlineActionBar}>
                                            <span className={styles.selectedCount}>{selectedAdmins.length} dipilih</span>
                                            <button onClick={handleDowngradeAdmin} disabled={downgradingAdmin} className={styles.btnDangerSmall}>
                                                {downgradingAdmin ? 'Memproses...' : 'Turunkan ke Mahasiswa'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.tableWrap}>
                                    <table className={styles.tbl}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: 40 }}>
                                                    <input type="checkbox" className={styles.checkbox}
                                                        checked={selectedAdmins.length === adminDowngradeable.length && adminDowngradeable.length > 0}
                                                        onChange={e => setSelectedAdmins(e.target.checked ? adminDowngradeable.map(a => a.adminId) : [])}
                                                    />
                                                </th>
                                                <th>Nama</th><th>Email</th><th>NIM</th><th>Role</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adminDowngradeable.length > 0 ? adminDowngradeable.map(adm => (
                                                <tr key={adm.adminId} className={selectedAdmins.includes(adm.adminId) ? styles.rowSelectedDanger : ''}>
                                                    <td>
                                                        <input type="checkbox" className={styles.checkbox}
                                                            checked={selectedAdmins.includes(adm.adminId)}
                                                            onChange={() => handleAdminSelect(adm.adminId)} />
                                                    </td>
                                                    <td>{adm.nama}</td>
                                                    <td>{adm.email}</td>
                                                    <td>{adm.nim ?? '—'}</td>
                                                    <td><span className={`${styles.statusBadge} ${styles.statusAdmin}`}>{adm.role}</span></td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={5} className={styles.emptyState}>Tidak ada admin</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {superAdmins.length > 0 && (
                                <div className={styles.bigCard}>
                                    <h3>👑 Super Admin ({superAdmins.length})</h3>
                                    <div className={styles.tableWrap}>
                                        <table className={styles.tbl}>
                                            <thead>
                                                <tr><th>Nama</th><th>Email</th><th>Role</th></tr>
                                            </thead>
                                            <tbody>
                                                {superAdmins.map(adm => (
                                                    <tr key={adm.adminId}>
                                                        <td>{adm.nama}</td>
                                                        <td>{adm.email}</td>
                                                        <td><span className={`${styles.statusBadge} ${styles.statusSuperAdmin}`}>{adm.role}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ══════════ NOTIFICATIONS ══════════ */}
                    {activeSection === 'notif' && (
                        <div>
                            <div className={styles.pageTitle}>Notifications</div>
                            <div className={styles.bigCard}>
                                <div className={styles.cardHeader}>
                                    <h3>🔔 Aktivitas Sistem</h3>
                                    <button className={styles.btnEdit} onClick={markAllRead}>Tandai semua dibaca</button>
                                </div>

                                <div className={styles.notifFilters}>
                                    <div className={styles.filterGroup}>
                                        <span className={styles.filterLabel}>Status:</span>
                                        {(['Semua', 'Belum Dibaca', 'Sudah Dibaca'] as NotifReadFilter[]).map(f => (
                                            <button
                                                key={f}
                                                className={`${styles.tabBtn} ${notifReadFilter === f ? styles.tabBtnActive : ''}`}
                                                onClick={() => setNotifReadFilter(f)}
                                            >
                                                {f}
                                                {f === 'Belum Dibaca' && unreadCount > 0 && (
                                                    <span className={styles.inlineBadge}>{unreadCount}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <div className={styles.filterGroup}>
                                        <span className={styles.filterLabel}>Kategori:</span>
                                        {(['Semua', 'Lost & Found', 'Aspirasi', 'User', 'Sistem'] as NotifCategory[]).map(cat => (
                                            <button
                                                key={cat}
                                                className={`${styles.tabBtn} ${notifCatFilter === cat ? styles.tabBtnActive : ''}`}
                                                onClick={() => setNotifCatFilter(cat)}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {filteredNotifs.length === 0 && (
                                    <div className={styles.emptyState}>Tidak ada notifikasi</div>
                                )}

                                {filteredNotifs.map(n => (
                                    <div
                                        key={n.id}
                                        className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ''}`}
                                        onClick={() => markRead(n.id)}
                                    >
                                        <div className={styles.notifIcon} style={{ background: n.iconBg }}>{n.icon}</div>
                                        <div className={styles.notifBody}>
                                            <div className={styles.notifTitle}>{n.title}</div>
                                            <div className={styles.notifDesc}>{n.desc}</div>
                                            <div className={styles.notifTime}>{n.time} · <span className={styles.notifCat}>{n.category}</span></div>
                                        </div>
                                        {!n.read && <div className={styles.dotUnread} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
