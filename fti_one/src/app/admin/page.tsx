'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';

import styles from './admin.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Section = 'overview' | 'notif';

interface User {
    userId: string;
    nama: string;
    email: string;
    role: string;
    profilePhoto?: string | null;
}

interface NotifItem {
    id: number;
    icon: string;
    iconBg: string;
    title: string;
    desc: string;
    time: string;
    read: boolean;
    category: string;
}

const weeklyData = [
    { week: 'M1', claim: 4 },
    { week: 'M2', claim: 7 },
    { week: 'M3', claim: 5 },
    { week: 'M4', claim: 9 },
];

const initialNotif: NotifItem[] = [
    { id: 1, icon: '📦', iconBg: '#ede9fe', title: 'Claim Barang Baru', desc: 'Mahasiswa melakukan claim barang', time: '2 menit lalu', read: false, category: 'Lost & Found' },
    { id: 2, icon: '💬', iconBg: '#dcfce7', title: 'Aspirasi Baru', desc: 'Aspirasi baru telah masuk', time: '10 menit lalu', read: false, category: 'Aspirasi' },
    { id: 3, icon: '👤', iconBg: '#dbeafe', title: 'User Baru', desc: 'Mahasiswa baru berhasil register', time: '1 jam lalu', read: true, category: 'User' },
];

export default function AdminPage() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [activeSection, setActiveSection] = useState<Section>('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false); // ← hamburger state
    const [notifs, setNotifs] = useState<NotifItem[]>(initialNotif);
    const [stats, setStats] = useState({
        aspirasiMasuk: 18,
        pendingClaim: 6,
        barangTersedia: 21,
        totalMahasiswa: 143,
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!storedUser || !token) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);

        if (parsedUser.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        setUser(parsedUser);
        fetchDashboardData(token);
    }, [router]);

    const fetchDashboardData = async (token: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats || stats);
                if (data.notifs) setNotifs(data.notifs);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const unreadCount = useMemo(() => notifs.filter(n => !n.read).length, [notifs]);

    const nav = (section: Section) => {
        setActiveSection(section);
        setSidebarOpen(false); // tutup drawer saat pilih menu
    };

    const markRead = (id: number) => {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (!user) return null;

    return (
        <div className={styles.root}>

            {/* ── HAMBURGER BUTTON (mobile only) ── */}
            <button
                className={styles.sidebarToggle}
                onClick={() => setSidebarOpen(v => !v)}
                aria-label="Toggle sidebar"
            >
                <span className={`${styles.bar} ${sidebarOpen ? styles.barOpen1 : ''}`} />
                <span className={`${styles.bar} ${sidebarOpen ? styles.barOpen2 : ''}`} />
                <span className={`${styles.bar} ${sidebarOpen ? styles.barOpen3 : ''}`} />
            </button>

            {/* ── OVERLAY ── */}
            {sidebarOpen && (
                <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
            )}

            <div className={styles.layout}>

                {/* ── SIDEBAR ── */}
                <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                    <div className={styles.sidebarProfile}>
                        <div className={styles.profileCircle}>
                            {user.profilePhoto ? (
                                <img src={user.profilePhoto} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            ) : (
                                <span>{user.nama.charAt(0)}</span>
                            )}
                        </div>
                        <h3>{user.nama}</h3>
                        <p>Admin</p>
                    </div>

                    <div className={styles.menu}>
                        <button
                            className={activeSection === 'overview' ? styles.activeMenu : ''}
                            onClick={() => nav('overview')}
                        >
                            📊 Overview
                        </button>
                        <button
                            className={activeSection === 'notif' ? styles.activeMenu : ''}
                            onClick={() => nav('notif')}
                        >
                            🔔 Notifications
                            {unreadCount > 0 && (
                                <span className={styles.badge}>{unreadCount}</span>
                            )}
                        </button>
                    </div>

                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        Logout
                    </button>
                </aside>

                {/* ── MAIN ── */}
                <main className={styles.main}>
                    {activeSection === 'overview' && (
                        <>
                            <div className={styles.welcomeCard}>
                                <div>
                                    <h1>Welcome back, <span>{user.nama}</span></h1>
                                    <p>Pantau aktivitas sistem DPM FTI secara realtime.</p>
                                </div>
                            </div>

                            <div className={styles.statsGrid}>
                                <div className={styles.statsCard}>
                                    <div className={styles.statsIcon}>💬</div>
                                    <div><h3>Aspirasi Masuk</h3><h1>{stats.aspirasiMasuk}</h1></div>
                                </div>
                                <div className={styles.statsCard}>
                                    <div className={styles.statsIcon}>⏳</div>
                                    <div><h3>Claim Pending</h3><h1>{stats.pendingClaim}</h1></div>
                                </div>
                                <div className={styles.statsCard}>
                                    <div className={styles.statsIcon}>📦</div>
                                    <div><h3>Barang Tersedia</h3><h1>{stats.barangTersedia}</h1></div>
                                </div>
                                <div className={styles.statsCard}>
                                    <div className={styles.statsIcon}>👥</div>
                                    <div><h3>Total Mahasiswa</h3><h1>{stats.totalMahasiswa}</h1></div>
                                </div>
                            </div>

                            <div className={styles.bottomGrid}>
                                <div className={styles.chartCard}>
                                    <div className={styles.cardTitle}>📈 Claim Barang per Minggu</div>
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={weeklyData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="week" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="claim" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className={styles.activityCard}>
                                    <div className={styles.cardTitle}>🕒 Recent Activity</div>
                                    {notifs.slice(0, 5).map(item => (
                                        <div key={item.id} className={styles.activityItem}>
                                            <div className={styles.activityIcon} style={{ background: item.iconBg }}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h4>{item.title}</h4>
                                                <p>{item.desc}</p>
                                                <span>{item.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeSection === 'notif' && (
                        <div className={styles.notifWrapper}>
                            <div className={styles.pageTitle}>Notifications</div>
                            {notifs.map(item => (
                                <div
                                    key={item.id}
                                    className={`${styles.notifCard} ${!item.read ? styles.unread : ''}`}
                                    onClick={() => markRead(item.id)}
                                >
                                    <div className={styles.notifIcon} style={{ background: item.iconBg }}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3>{item.title}</h3>
                                        <p>{item.desc}</p>
                                        <span>{item.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}