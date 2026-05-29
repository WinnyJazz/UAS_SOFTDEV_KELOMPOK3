'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './superadmin.module.css';

// ── Types ──────────────────────────────────────────────
type Section = 'overview' | 'aspirasi' | 'userdata' | 'notif';
type LFStatus = 'Pending' | 'Claimed' | 'Expired';
type NotifCategory = 'Semua' | 'Lost & Found' | 'Aspirasi' | 'User' | 'Sistem';
type NotifReadFilter = 'Semua' | 'Belum Dibaca' | 'Sudah Dibaca';

interface User {
    userId: string;
    nama: string;
    email: string;
    nim?: string;
    role: string;
    isVerified?: boolean;
    profilePhoto?: string | null;
    nickname?: string | null;
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

interface SesiAspirasi {
    _id: string;
    nama: string;
    bulan: number;
    tahun: number;
    pertanyaan: { _id: string; teks: string; urutan: number }[];
}

interface Jawaban {
    _id: string;
    sesiId: string;
    pertanyaanId: string | { _id: string; teks: string };
    teks: string;
    userId: string;
    createdAt: string;
}

interface HasilRespons {
    _id: string;
    sesiId: string;
    judul: string;
    isi: string;
    createdAt: string;
}

// ── Overview data interface ────────────────────────────
interface OverviewData {
    lostFound: {
        totalBarang: number;
        claimed: number;
        pending: number;
        expired: number;
    };
    aspirasi: {
        totalAspirasi: number;
        dalamProses: number;
        selesai: number;
        totalJawaban: number;
    };
    users: {
        totalMahasiswa: number;
        terverifikasi: number;
        belumVerifikasi: number;
        totalAdmin: number;
        unreadNotif: number;
    };
    recentActivity: {
        icon: string;
        iconBg: string;
        text: string;
        time: string;
        category: string;
    }[];
}

// ── Mock fallback notifs ───────────────────────────────
const INITIAL_NOTIFS: NotifItem[] = [
    { id: 1, icon: '📦', iconBg: '#ede9fe', title: 'Claim Barang Baru', desc: 'Budi Santoso mengklaim charger hitam di R.904', time: '2 menit lalu', read: false, category: 'Lost & Found' },
    { id: 2, icon: '👤', iconBg: '#dbeafe', title: 'User Baru Terdaftar', desc: 'sari.putri@student.untar.ac.id mendaftar', time: '15 menit lalu', read: false, category: 'User' },
    { id: 3, icon: '💬', iconBg: '#d1fae5', title: 'Aspirasi Baru Masuk', desc: 'Aspirasi tentang perbaikan AC Lt.9 telah diterima', time: '1 jam lalu', read: false, category: 'Aspirasi' },
    { id: 4, icon: '⚠️', iconBg: '#fef3c7', title: 'Barang Hampir Expired', desc: '5 barang akan expired dalam 3 hari', time: '3 jam lalu', read: true, category: 'Lost & Found' },
    { id: 5, icon: '🔐', iconBg: '#fee2e2', title: 'Login Baru Terdeteksi', desc: 'Login admin dari perangkat baru (Chrome / Windows)', time: 'Kemarin, 20:34', read: true, category: 'Sistem' },
];

// ── Bar Chart Component ────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
    const max = Math.max(...data.map(d => d.value), 1);
    const ticks = [0, Math.round(max / 3), Math.round((max * 2) / 3), max];
    return (
        <div className={styles.chartWrap}>
            <div className={styles.chartYAxis}>
                {[...ticks].reverse().map((t, i) => (
                    <span key={i} className={styles.chartYTick}>{t}</span>
                ))}
            </div>
            <div className={styles.chartBars}>
                {data.map((d, i) => (
                    <div key={i} className={styles.chartBarCol}>
                        <div
                            className={styles.chartBar}
                            style={{ height: `${(d.value / max) * 100}%` }}
                        />
                        <span className={styles.chartBarLabel}>{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── NIM Highlight Helper ───────────────────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
    if (!query.trim() || !text) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <span className={styles.nimHighlight}>
                {text.slice(idx, idx + query.trim().length)}
            </span>
            {text.slice(idx + query.trim().length)}
        </>
    );
}

// ── Sidebar Avatar Icon ────────────────────────────────
function AvatarIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)" width="52" height="52">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
    );
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
    const [respondentCount, setRespondentCount] = useState(0);
    const [sesiTerkini, setSesiTerkini] = useState<SesiAspirasi | null>(null);

    const [activeSection, setActiveSection] = useState<Section>('overview');
    const [nimFilter, setNimFilter] = useState('');
    const [lfItems, setLfItems] = useState<LFItem[]>([]);

    const [overviewData, setOverviewData] = useState<OverviewData | null>(null);

    const [notifs, setNotifs] = useState<NotifItem[]>(INITIAL_NOTIFS);
    const [notifReadFilter, setNotifReadFilter] = useState<NotifReadFilter>('Semua');
    const [notifCatFilter, setNotifCatFilter] = useState<NotifCategory>('Semua');

    const [sesiList, setSesiList] = useState<SesiAspirasi[]>([]);
    const [selectedSesi, setSelectedSesi] = useState<string>('');
    const [jawabanList, setJawabanList] = useState<Jawaban[]>([]);
    const [hasilList, setHasilList] = useState<HasilRespons[]>([]);
    const [aspirasiTab, setAspirasiTab] = useState<'jawaban' | 'hasil'>('jawaban');
    const [loadingJawaban, setLoadingJawaban] = useState(false);

    const [weeklyClaimData] = useState([
        { label: 'M1', value: 4 },
        { label: 'M2', value: 7 },
        { label: 'M3', value: 5 },
        { label: 'M4', value: 9 },
    ]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!storedUser || !token) {
            setUser({ userId: '1', nama: 'Super Admin', email: 'superadmin@untar.ac.id', role: 'superadmin' });
            setLoading(false);
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'superadmin' && parsedUser.role !== 'admin') {
            router.push('/dashboard');
            return;
        }
        setUser(parsedUser);
        fetchUsers(token);
        fetchLF(token);
        fetchNotifs(token);
        fetchSesi(token);
        fetchHasil(token);
        fetchOverview(token); 
        setLoading(false);

        const handleProfileUpdate = () => {
            const stored = localStorage.getItem('user');
            if (stored) {
                const updated = JSON.parse(stored);
                setUser(prev => prev ? { ...prev, profilePhoto: updated.profilePhoto } : prev);
            }
        };
        window.addEventListener('profileUpdated', handleProfileUpdate);
        return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
    }, [router]);

    // ── NEW: Fetch overview from backend ──────────────
    const fetchOverview = async (token: string) => {
        try {
            const res = await fetch('http://localhost:5000/api/dashboard/overview', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            console.log('overviewData:', data);
            if (res.ok) {
                setOverviewData(data.data);
            }
        } catch (err) {
            console.error('fetchOverview error:', err);
        }
    };

    const fetchUsers = async (token: string) => {
        try {
            const res = await fetch('http://localhost:5000/api/auth/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
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

    const fetchLF = async (token: string) => {
        try {
            const res = await fetch('http://localhost:5000/api/dashboard/lostfound', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setLfItems(data.data);
            }
        } catch (err) { console.error(err); }
    };

    const fetchNotifs = async (token: string) => {
        try {
            const res = await fetch('http://localhost:5000/api/dashboard/notifikasi', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifs(data.data);
            }
        } catch (err) { console.error(err); }
    };

    const fetchSesi = async (token: string) => {
        try {
            const res = await fetch('http://localhost:5000/api/aspirasi/sesi', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data: SesiAspirasi[] = await res.json();

                // Sort dari yang paling baru (tahun & bulan terbesar duluan)
                const sorted = [...data].sort((a, b) =>
                    b.tahun !== a.tahun ? b.tahun - a.tahun : b.bulan - a.bulan
                );

                setSesiList(sorted);

                if (sorted.length > 0) {
                    const terkini = sorted[0];
                    setSesiTerkini(terkini);
                    setSelectedSesi(terkini._id);
                    fetchJawabanTerkini(token, terkini._id);
                }
            }
        } catch (err) { console.error(err); }
    };

    const fetchJawaban = async (token: string, sesiId: string) => {
        try {
            setLoadingJawaban(true);
            const res = await fetch(
                `http://localhost:5000/api/aspirasi/jawaban?sesiId=${sesiId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                const data: Jawaban[] = await res.json();
                setJawabanList(data);
            }
        } catch (err) { console.error(err); }
        finally { setLoadingJawaban(false); }
    };

    const fetchJawabanTerkini = async (token: string, sesiId: string) => {
        try {
            const res = await fetch(
                `http://localhost:5000/api/aspirasi/jawaban?sesiId=${sesiId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                const data: Jawaban[] = await res.json();
                const uniqueUsers = new Set(data.map(j => j.userId));
                setRespondentCount(uniqueUsers.size);
            }
        } catch (err) { console.error(err); }
    };

    const fetchHasil = async (token: string) => {
        try {
            const res = await fetch('http://localhost:5000/api/aspirasi/hasil', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data: HasilRespons[] = await res.json();
                setHasilList(data);
            }
        } catch (err) { console.error(err); }
    };

    const handleSesiChange = (sesiId: string) => {
        setSelectedSesi(sesiId);
        const token = localStorage.getItem('token');
        if (token) fetchJawaban(token, sesiId);
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
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
        router.push('/');
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

    const filteredMahasiswaBiasa = nimFilter.trim()
        ? mahasiswaBiasa.filter(m =>
            m.nim?.toLowerCase().includes(nimFilter.trim().toLowerCase()) ||
            m.nama?.toLowerCase().includes(nimFilter.trim().toLowerCase())
        )
        : mahasiswaBiasa;

    // ── Use overviewData for Lost & Found stats (correct pending count) ──
    const lfTotal = overviewData?.lostFound?.totalBarang ?? lfItems.length;
    const lfClaimed = overviewData?.lostFound?.claimed ?? lfItems.filter(i => i.status === 'Claimed').length;
    const lfPending = overviewData?.lostFound?.pending ?? lfItems.filter(i => i.status === 'Pending').length;
    const lfExpired = overviewData?.lostFound?.expired ?? lfItems.filter(i => i.status === 'Expired').length;

    // ── Aspirasi stats ──
    const aspirasiDalamProsesCount = overviewData?.aspirasi?.dalamProses ?? Math.max(0, sesiList.length - hasilList.length);
    const aspirasiResponseRate = sesiList.length > 0
        ? Math.round((hasilList.length / sesiList.length) * 100)
        : 0;

    // ── Recent activity: prefer API data, fallback to static ──
    const recentActivity = overviewData?.recentActivity?.map(a => ({
        icon: a.icon,
        iconBg: a.iconBg,
        title: a.text,
        desc: a.category,
        time: a.time,
    })) ?? [
            { icon: '📦', iconBg: '#ede9fe', title: 'Claim Barang Baru', desc: 'Mahasiswa melakukan claim barang', time: '2 menit lalu' },
            { icon: '💬', iconBg: '#d1fae5', title: 'Aspirasi Baru', desc: 'Aspirasi baru telah masuk', time: '10 menit lalu' },
            { icon: '👤', iconBg: '#dbeafe', title: 'User Baru', desc: 'Mahasiswa baru berhasil register', time: '1 jam lalu' },
        ];

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (!user) return null;

    const nav = (s: Section) => setActiveSection(s);

    const navItems: { id: Section; label: string }[] = [
        { id: 'overview', label: 'Overview' },
        ...(user.role === 'superadmin' ? [
            { id: 'userdata' as Section, label: 'User data' },
        ] : []),
        { id: 'notif', label: 'Notification' },
    ];

    return (
        <div className={styles.root}>
            <div className={styles.layout}>

                {/* ── SIDEBAR ── */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarAvatar}>
                        {user.profilePhoto ? (
                            <img
                                src={user.profilePhoto}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <AvatarIcon />
                        )}
                    </div>

                    <div className={styles.sidebarName}>{user.nama}</div>

                    <ul className={styles.sidebarMenu}>
                        {navItems.map(({ id, label }) => (
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

                {/* ── MAIN CONTENT ── */}
                <main className={styles.main}>
                    {error && <div className={styles.errorBanner}>{error}</div>}

                    {/* ══════════ OVERVIEW ══════════ */}
                    {activeSection === 'overview' && (
                        <div>
                            <div className={styles.welcomeBanner}>
                                <div className={styles.welcomeTitle}>
                                    Hello welcome <span>{user.role === 'superadmin' ? 'Super Admin' : (user.nickname || user.nama)}!</span>
                                </div>
                                <div className={styles.welcomeSub}>
                                    Pantau aktivitas sistem DPM FTI secara realtime.
                                </div>
                            </div>

                            {/* Lost & Found Section */}
                            <div className={styles.sectionLabel}>Lost &amp; Found</div>
                            <div className={styles.statRow}>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>📦</div>
                                    <div className={styles.statLabel}>Total Barang</div>
                                    <div className={styles.statValue}>{lfTotal}</div>
                                    <div className={styles.statSub}>dari database</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>✅</div>
                                    <div className={styles.statLabel}>Barang Claimed</div>
                                    <div className={styles.statValue}>{lfClaimed}</div>
                                    <div className={styles.statSub}>{lfTotal > 0 ? Math.round((lfClaimed / lfTotal) * 100) : 0}% claim rate</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>⏳</div>
                                    <div className={styles.statLabel}>Pending Claim</div>
                                    <div className={styles.statValue}>{lfPending}</div>
                                    <div className={styles.statSub}>Perlu verifikasi</div>
                                </div>
                            </div>

                            {/* Aspirasi Section */}
                            <div className={styles.sectionLabel}>Aspirasi</div>
                            <div className={styles.statRow}>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>💬</div>
                                    <div className={styles.statLabel}>Sesi Aspirasi Terkini</div>
                                    <div className={styles.statValue}>{respondentCount}</div>
                                    <div className={styles.statSub}>
                                        {sesiTerkini
                                            ? `${sesiTerkini.nama} · ${respondentCount} responden`
                                            : 'Belum ada sesi'}
                                    </div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>🔄</div>
                                    <div className={styles.statLabel}>Belum Direspon</div>
                                    <div className={styles.statValue}>{aspirasiDalamProsesCount}</div>
                                    <div className={styles.statSub}>sesi tanpa hasil</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>✔️</div>
                                    <div className={styles.statLabel}>Hasil Respons DPM</div>
                                    <div className={styles.statValue}>{hasilList.length}</div>
                                    <div className={styles.statSub}>{aspirasiResponseRate}% response rate</div>
                                </div>
                            </div>

                            {/* Chart + Activity */}
                            <div className={styles.twoColChart}>
                                <div className={styles.bigCard}>
                                    <h3>📊 Claim Barang per Minggu</h3>
                                    <BarChart data={weeklyClaimData} />
                                </div>
                                <div className={styles.bigCard}>
                                    <h3>🕐 Recent Activity</h3>
                                    {recentActivity.map((a, i) => (
                                        <div key={i} className={styles.activityItem}>
                                            <div className={styles.activityIcon} style={{ background: a.iconBg }}>{a.icon}</div>
                                            <div className={styles.activityBody}>
                                                <div className={styles.activityTitle}>{a.title}</div>
                                                <div className={styles.activityDesc}>{a.desc}</div>
                                                <div className={styles.activityTime}>{a.time}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bottom stat row */}
                            <div className={styles.statRow4}>
                                <div className={styles.statCard4}>
                                    <div className={styles.statCardIcon}>💬</div>
                                    <div className={styles.statCardBody}>
                                        <div className={styles.statCardLabel}>Total Sesi Aspirasi</div>
                                        <div className={styles.statCardValue}>{sesiList.length}</div>
                                    </div>
                                </div>
                                <div className={styles.statCard4}>
                                    <div className={styles.statCardIcon}>✉️</div>
                                    <div className={styles.statCardBody}>
                                        <div className={styles.statCardLabel}>Total Jawaban Masuk</div>
                                        <div className={styles.statCardValue}>
                                            {overviewData?.aspirasi?.totalJawaban ?? 0}
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.statCard4}>
                                    <div className={styles.statCardIcon}>📦</div>
                                    <div className={styles.statCardBody}>
                                        <div className={styles.statCardLabel}>Barang Tersedia</div>
                                        <div className={styles.statCardValue}>{lfTotal - lfClaimed - lfExpired}</div>
                                    </div>
                                </div>
                                <div className={styles.statCard4}>
                                    <div className={styles.statCardIcon}>👥</div>
                                    <div className={styles.statCardBody}>
                                        <div className={styles.statCardLabel}>Total Mahasiswa</div>
                                        <div className={styles.statCardValue}>
                                            {overviewData?.users?.totalMahasiswa ?? mahasiswas.length}
                                        </div>
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
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>👥</div>
                                    <div className={styles.statLabel}>Total Mahasiswa</div>
                                    <div className={styles.statValue}>{mahasiswas.length}</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>🟢</div>
                                    <div className={styles.statLabel}>Terverifikasi</div>
                                    <div className={styles.statValue}>{mahasiswas.filter(m => m.isVerified).length}</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>⏳</div>
                                    <div className={styles.statLabel}>Belum Verifikasi</div>
                                    <div className={styles.statValue}>{mahasiswas.filter(m => !m.isVerified).length}</div>
                                </div>
                            </div>

                            <div className={styles.bigCard}>
                                <div className={styles.cardHeader}>
                                    <h3>
                                        🎓 Daftar Mahasiswa ({filteredMahasiswaBiasa.length}
                                        {nimFilter.trim() && ` dari ${mahasiswaBiasa.length}`})
                                    </h3>
                                    {selectedUsers.length > 0 && (
                                        <div className={styles.inlineActionBar}>
                                            <span className={styles.selectedCount}>{selectedUsers.length} dipilih</span>
                                            <button onClick={handleChangeRole} disabled={changingRole} className={styles.btnSaveSmall}>
                                                {changingRole ? 'Memproses...' : 'Jadikan Admin'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.nimFilterWrap}>
                                    <input
                                        type="text"
                                        className={styles.nimSearchInput}
                                        placeholder="🔍 Cari NIM atau nama..."
                                        value={nimFilter}
                                        onChange={e => { setNimFilter(e.target.value); setSelectedUsers([]); }}
                                    />
                                    {nimFilter.trim() && (
                                        <>
                                            <button className={styles.nimFilterClear} onClick={() => { setNimFilter(''); setSelectedUsers([]); }}>✕ Clear</button>
                                            <span className={styles.nimFilterCount}>{filteredMahasiswaBiasa.length} hasil ditemukan</span>
                                        </>
                                    )}
                                </div>

                                <div className={styles.tableWrap}>
                                    <table className={styles.tbl}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: 40 }}>
                                                    <input
                                                        type="checkbox"
                                                        className={styles.checkbox}
                                                        checked={selectedUsers.length === filteredMahasiswaBiasa.length && filteredMahasiswaBiasa.length > 0}
                                                        onChange={e => setSelectedUsers(e.target.checked ? filteredMahasiswaBiasa.map(m => m.userId) : [])}
                                                    />
                                                </th>
                                                <th>Nama</th><th>Email</th><th>NIM</th><th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMahasiswaBiasa.length > 0 ? filteredMahasiswaBiasa.map(mhs => (
                                                <tr key={mhs.userId} className={selectedUsers.includes(mhs.userId) ? styles.rowSelected : ''}>
                                                    <td>
                                                        <input type="checkbox" className={styles.checkbox}
                                                            checked={selectedUsers.includes(mhs.userId)}
                                                            onChange={() => handleUserSelect(mhs.userId)} />
                                                    </td>
                                                    <td><HighlightText text={mhs.nama} query={nimFilter} /></td>
                                                    <td>{mhs.email}</td>
                                                    <td><HighlightText text={mhs.nim ?? ''} query={nimFilter} /></td>
                                                    <td>
                                                        {mhs.isVerified
                                                            ? <span className={styles.badgeVerified}>✅ Terverifikasi</span>
                                                            : <span className={styles.badgeUnverified}>❌ Belum Verifikasi</span>}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className={styles.emptyState}>
                                                        {nimFilter.trim() ? `Tidak ada mahasiswa dengan NIM/nama "${nimFilter}"` : 'Tidak ada mahasiswa'}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

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
                                                        onChange={e => setSelectedAdmins(e.target.checked ? adminDowngradeable.map(a => a.adminId) : [])} />
                                                </th>
                                                <th>Nama</th><th>Email</th><th>NIM</th><th>Role</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adminDowngradeable.length > 0 ? adminDowngradeable.map(adm => (
                                                <tr key={adm.adminId} className={selectedAdmins.includes(adm.adminId) ? styles.rowSelectedDanger : ''}>
                                                    <td><input type="checkbox" className={styles.checkbox}
                                                        checked={selectedAdmins.includes(adm.adminId)}
                                                        onChange={() => handleAdminSelect(adm.adminId)} /></td>
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
                                            <thead><tr><th>Nama</th><th>Email</th><th>Role</th></tr></thead>
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

                    {/* ══════════ ASPIRASI ══════════ */}
                    {activeSection === 'aspirasi' && (
                        <div>
                            <div className={styles.pageTitle}>Aspirasi Mahasiswa</div>

                            <div className={styles.tabRow}>
                                <button
                                    className={`${styles.tabBtn} ${aspirasiTab === 'jawaban' ? styles.tabBtnActive : ''}`}
                                    onClick={() => setAspirasiTab('jawaban')}>
                                    💬 Jawaban Mahasiswa
                                </button>
                                <button
                                    className={`${styles.tabBtn} ${aspirasiTab === 'hasil' ? styles.tabBtnActive : ''}`}
                                    onClick={() => setAspirasiTab('hasil')}>
                                    📋 Hasil Respons DPM
                                </button>
                            </div>

                            {aspirasiTab === 'jawaban' && (
                                <div className={styles.bigCard}>
                                    <div className={styles.cardHeader}>
                                        <h3>💬 Jawaban per Sesi</h3>
                                        <select className={styles.sesiSelect} value={selectedSesi}
                                            onChange={e => handleSesiChange(e.target.value)}>
                                            {sesiList.map(s => (
                                                <option key={s._id} value={s._id}>
                                                    {s.nama} ({s.bulan}/{s.tahun})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {loadingJawaban ? (
                                        <div className={styles.emptyState}>Loading jawaban...</div>
                                    ) : jawabanList.length === 0 ? (
                                        <div className={styles.emptyState}>Belum ada jawaban untuk sesi ini</div>
                                    ) : (
                                        (() => {
                                            const sesi = sesiList.find(s => s._id === selectedSesi);
                                            const pertanyaans = sesi?.pertanyaan ?? [];
                                            return pertanyaans.map(p => {
                                                const jawabanUntukP = jawabanList.filter(j => {
                                                    const pid = typeof j.pertanyaanId === 'string' ? j.pertanyaanId : j.pertanyaanId._id;
                                                    return pid === p._id;
                                                });
                                                return (
                                                    <div key={p._id} className={styles.pertanyaanGroup}>
                                                        <div className={styles.pertanyaanHeading}>
                                                            <span className={styles.pertanyaanNum}>Q{p.urutan}</span>
                                                            <p>{p.teks}</p>
                                                        </div>
                                                        {jawabanUntukP.length === 0 ? (
                                                            <div className={styles.emptyJawaban}>Belum ada jawaban</div>
                                                        ) : (
                                                            jawabanUntukP.map(j => (
                                                                <div key={j._id} className={styles.jawabanCard}>
                                                                    <div className={styles.jawabanAvatar}>{j.userId.charAt(0).toUpperCase()}</div>
                                                                    <div className={styles.jawabanContent}>
                                                                        <div className={styles.jawabanUserId}>{j.userId}</div>
                                                                        <div className={styles.jawabanTeks}>{j.teks || '(tidak ada teks)'}</div>
                                                                        <div className={styles.jawabanTime}>
                                                                            {new Date(j.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()
                                    )}
                                </div>
                            )}

                            {aspirasiTab === 'hasil' && (
                                <div className={styles.bigCard}>
                                    <h3>📋 Hasil Respons DPM</h3>
                                    {hasilList.length === 0 ? (
                                        <div className={styles.emptyState}>Belum ada hasil respons</div>
                                    ) : (
                                        hasilList.map(h => {
                                            const sesi = sesiList.find(s => s._id === h.sesiId);
                                            return (
                                                <div key={h._id} className={styles.hasilCard}>
                                                    <div className={styles.hasilHeader}>
                                                        <h4>{h.judul}</h4>
                                                        {sesi && <span className={styles.hasilSesiBadge}>{sesi.nama}</span>}
                                                    </div>
                                                    <p className={styles.hasilIsi}>{h.isi}</p>
                                                    <div className={styles.hasilTime}>
                                                        {new Date(h.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
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
                                            <button key={f}
                                                className={`${styles.tabBtn} ${notifReadFilter === f ? styles.tabBtnActive : ''}`}
                                                onClick={() => setNotifReadFilter(f)}>
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
                                            <button key={cat}
                                                className={`${styles.tabBtn} ${notifCatFilter === cat ? styles.tabBtnActive : ''}`}
                                                onClick={() => setNotifCatFilter(cat)}>
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {filteredNotifs.length === 0 && <div className={styles.emptyState}>Tidak ada notifikasi</div>}
                                {filteredNotifs.map(n => (
                                    <div key={n.id}
                                        className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ''}`}
                                        onClick={() => markRead(n.id)}>
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