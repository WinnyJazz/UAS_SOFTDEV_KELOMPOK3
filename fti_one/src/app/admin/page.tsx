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
    {
        id: 1,
        icon: '📦',
        iconBg: '#ede9fe',
        title: 'Claim Barang Baru',
        desc: 'Mahasiswa melakukan claim barang',
        time: '2 menit lalu',
        read: false,
        category: 'Lost & Found',
    },
    {
        id: 2,
        icon: '💬',
        iconBg: '#dcfce7',
        title: 'Aspirasi Baru',
        desc: 'Aspirasi baru telah masuk',
        time: '10 menit lalu',
        read: false,
        category: 'Aspirasi',
    },
    {
        id: 3,
        icon: '👤',
        iconBg: '#dbeafe',
        title: 'User Baru',
        desc: 'Mahasiswa baru berhasil register',
        time: '1 jam lalu',
        read: true,
        category: 'User',
    },
];

export default function AdminPage() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [activeSection, setActiveSection] =
        useState<Section>('overview');

    const [notifs, setNotifs] =
        useState<NotifItem[]>(initialNotif);

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
            const res = await fetch(
                'http://localhost:5000/api/admin/dashboard',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();

                setStats(data.stats || stats);

                if (data.notifs) {
                    setNotifs(data.notifs);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const unreadCount = useMemo(
        () => notifs.filter(n => !n.read).length,
        [notifs]
    );

    const markRead = (id: number) => {
        setNotifs(prev =>
            prev.map(n =>
                n.id === id
                    ? { ...n, read: true }
                    : n
            )
        );
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        router.push('/');
    };

    if (!user) return null;

    return (
        <div className={styles.root}>
            <div className={styles.layout}>
                {/* SIDEBAR */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarProfile}>
                        <div className={styles.profileCircle}>
                            {user.profilePhoto ? (
                                <img
                                    src={user.profilePhoto}
                                    alt="profile"
                                />
                            ) : (
                                <span>
                                    {user.nama.charAt(0)}
                                </span>
                            )}
                        </div>

                        <h3>{user.nama}</h3>
                        <p>Admin</p>
                    </div>

                    <div className={styles.menu}>
                        <button
                            className={
                                activeSection === 'overview'
                                    ? styles.activeMenu
                                    : ''
                            }
                            onClick={() =>
                                setActiveSection(
                                    'overview'
                                )
                            }
                        >
                            📊 Overview
                        </button>

                        <button
                            className={
                                activeSection === 'notif'
                                    ? styles.activeMenu
                                    : ''
                            }
                            onClick={() =>
                                setActiveSection('notif')
                            }
                        >
                            🔔 Notifications
                        </button>
                    </div>

                    <button
                        className={styles.logoutBtn}
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </aside>

                {/* MAIN */}
                <main className={styles.main}>
                    {activeSection === 'overview' && (
                        <>
                            <div className={styles.welcomeCard}>
                                <div>
                                    <h1>
                                        Welcome back,
                                        <span>
                                            {' '}
                                            {user.nama}
                                        </span>
                                    </h1>

                                    <p>
                                        Pantau aktivitas
                                        sistem DPM FTI
                                        secara realtime.
                                    </p>
                                </div>
                            </div>

                            {/* STATS */}
                            <div className={styles.statsGrid}>
                                <div
                                    className={
                                        styles.statsCard
                                    }
                                >
                                    <div
                                        className={
                                            styles.statsIcon
                                        }
                                    >
                                        💬
                                    </div>

                                    <div>
                                        <h3>
                                            Aspirasi
                                            Masuk
                                        </h3>
                                        <h1>
                                            {
                                                stats.aspirasiMasuk
                                            }
                                        </h1>
                                    </div>
                                </div>

                                <div
                                    className={
                                        styles.statsCard
                                    }
                                >
                                    <div
                                        className={
                                            styles.statsIcon
                                        }
                                    >
                                        ⏳
                                    </div>

                                    <div>
                                        <h3>
                                            Claim Pending
                                        </h3>
                                        <h1>
                                            {
                                                stats.pendingClaim
                                            }
                                        </h1>
                                    </div>
                                </div>

                                <div
                                    className={
                                        styles.statsCard
                                    }
                                >
                                    <div
                                        className={
                                            styles.statsIcon
                                        }
                                    >
                                        📦
                                    </div>

                                    <div>
                                        <h3>
                                            Barang
                                            Tersedia
                                        </h3>
                                        <h1>
                                            {
                                                stats.barangTersedia
                                            }
                                        </h1>
                                    </div>
                                </div>

                                <div
                                    className={
                                        styles.statsCard
                                    }
                                >
                                    <div
                                        className={
                                            styles.statsIcon
                                        }
                                    >
                                        👥
                                    </div>

                                    <div>
                                        <h3>
                                            Total
                                            Mahasiswa
                                        </h3>
                                        <h1>
                                            {
                                                stats.totalMahasiswa
                                            }
                                        </h1>
                                    </div>
                                </div>
                            </div>

                            {/* CHART + ACTIVITY */}
                            <div
                                className={
                                    styles.bottomGrid
                                }
                            >
                                <div
                                    className={
                                        styles.chartCard
                                    }
                                >
                                    <div
                                        className={
                                            styles.cardTitle
                                        }
                                    >
                                        📈 Claim Barang
                                        per Minggu
                                    </div>

                                    <ResponsiveContainer
                                        width="100%"
                                        height={260}
                                    >
                                        <BarChart
                                            data={
                                                weeklyData
                                            }
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                            />

                                            <XAxis dataKey="week" />

                                            <YAxis />

                                            <Tooltip />

                                            <Bar dataKey="claim" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div
                                    className={
                                        styles.activityCard
                                    }
                                >
                                    <div
                                        className={
                                            styles.cardTitle
                                        }
                                    >
                                        🕒 Recent
                                        Activity
                                    </div>

                                    {notifs
                                        .slice(0, 5)
                                        .map(item => (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                className={
                                                    styles.activityItem
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.activityIcon
                                                    }
                                                    style={{
                                                        background:
                                                            item.iconBg,
                                                    }}
                                                >
                                                    {
                                                        item.icon
                                                    }
                                                </div>

                                                <div>
                                                    <h4>
                                                        {
                                                            item.title
                                                        }
                                                    </h4>

                                                    <p>
                                                        {
                                                            item.desc
                                                        }
                                                    </p>

                                                    <span>
                                                        {
                                                            item.time
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeSection === 'notif' && (
                        <div className={styles.notifWrapper}>
                            <div className={styles.pageTitle}>
                                Notifications
                            </div>

                            {notifs.map(item => (
                                <div
                                    key={item.id}
                                    className={`${styles.notifCard} ${
                                        !item.read
                                            ? styles.unread
                                            : ''
                                    }`}
                                    onClick={() =>
                                        markRead(
                                            item.id
                                        )
                                    }
                                >
                                    <div
                                        className={
                                            styles.notifIcon
                                        }
                                        style={{
                                            background:
                                                item.iconBg,
                                        }}
                                    >
                                        {item.icon}
                                    </div>

                                    <div>
                                        <h3>
                                            {
                                                item.title
                                            }
                                        </h3>

                                        <p>
                                            {item.desc}
                                        </p>

                                        <span>
                                            {
                                                item.time
                                            }
                                        </span>
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