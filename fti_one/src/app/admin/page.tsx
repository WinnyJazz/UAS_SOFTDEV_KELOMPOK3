'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

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
    role: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [mahasiswas, setMahasiswas] = useState<User[]>([]);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!storedUser || !token) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'admin' && parsedUser.role !== 'superadmin') {
            router.push('/dashboard');
            return;
        }

        setUser(parsedUser);
        fetchUsers(token);
    }, [router]);

    const fetchUsers = async (token: string) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setMahasiswas(data.data.mahasiswas);
                setAdmins(data.data.admins);
            } else {
                setError('Gagal mengambil data user');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat mengambil data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (!user) {
        return null;
    }

    // Pisahkan mahasiswa biasa dan yang jadi admin
    const mahasiswaBiasa = mahasiswas.filter(m => m.role === 'mahasiswa');
    const mahasiswaAdmin = mahasiswas.filter(m => m.role === 'admin');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Admin Dashboard</h1>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                    Logout
                </button>
            </div>

            <div className={styles.welcomeSection}>
                <h2>Welcome, {user.nama}! 👋</h2>
                <p>Role: {user.role === 'admin' ? '👤 Admin' : '👑 Super Admin'}</p>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    Daftar Mahasiswa ({mahasiswaBiasa.length})
                </div>
                <div className={styles.card}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.tableHeader}>Nama</th>
                                <th className={styles.tableHeader}>Email</th>
                                <th className={styles.tableHeader}>NIM</th>
                                <th className={styles.tableHeader}>Role</th>
                                <th className={styles.tableHeader}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mahasiswaBiasa.length > 0 ? (
                                mahasiswaBiasa.map((mhs) => (
                                    <tr key={mhs.userId} className={styles.tableRow}>
                                        <td className={styles.tableCell}>{mhs.nama}</td>
                                        <td className={styles.tableCell}>{mhs.email}</td>
                                        <td className={styles.tableCell}>{mhs.nim}</td>
                                        <td className={styles.tableCell}>
                                            <span className={`${styles.statusBadge} ${styles.statusMahasiswa}`}>
                                                {mhs.role}
                                            </span>
                                        </td>
                                        <td className={styles.tableCell}>
                                            {mhs.isVerified ? (
                                                <span className={styles.badgeVerified}>✅ Terverifikasi</span>
                                            ) : (
                                                <span className={styles.badgeUnverified}>❌ Belum Verifikasi</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className={styles.tableCell} style={{ textAlign: 'center' }}>
                                        Tidak ada mahasiswa biasa
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {mahasiswaAdmin.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        Admin ({mahasiswaAdmin.length})
                    </div>
                    <div className={styles.card}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.tableHeader}>Nama</th>
                                    <th className={styles.tableHeader}>Email</th>
                                    <th className={styles.tableHeader}>NIM</th>
                                    <th className={styles.tableHeader}>Role</th>
                                    <th className={styles.tableHeader}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mahasiswaAdmin.map((mhs) => (
                                    <tr key={mhs.userId} className={styles.tableRow}>
                                        <td className={styles.tableCell}>{mhs.nama}</td>
                                        <td className={styles.tableCell}>{mhs.email}</td>
                                        <td className={styles.tableCell}>{mhs.nim}</td>
                                        <td className={styles.tableCell}>
                                            <span className={`${styles.statusBadge} ${styles.statusAdmin}`}>
                                                {mhs.role}
                                            </span>
                                        </td>
                                        <td className={styles.tableCell}>
                                            {mhs.isVerified ? (
                                                <span className={styles.badgeVerified}>✅ Terverifikasi</span>
                                            ) : (
                                                <span className={styles.badgeUnverified}>❌ Belum Verifikasi</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    Daftar Admin ({admins.length})
                </div>
                <div className={styles.card}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.tableHeader}>Nama</th>
                                <th className={styles.tableHeader}>Email</th>
                                <th className={styles.tableHeader}>Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map((adm) => (
                                <tr key={adm.adminId} className={styles.tableRow}>
                                    <td className={styles.tableCell}>{adm.nama}</td>
                                    <td className={styles.tableCell}>{adm.email}</td>
                                    <td className={styles.tableCell}>
                                        <span
                                            className={`${styles.statusBadge} ${adm.role === 'superadmin' ? styles.statusSuperAdmin : styles.statusAdmin
                                                }`}
                                        >
                                            {adm.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}