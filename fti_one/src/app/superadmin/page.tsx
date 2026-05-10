'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './superadmin.module.css';

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

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!storedUser || !token) { router.push('/login'); return; }
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'superadmin') { router.push('/dashboard'); return; }
        setUser(parsedUser);
        fetchUsers(token);
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
            setError('Terjadi kesalahan saat mengambil data');
        } finally {
            setLoading(false);
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

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/'); };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (!user) return null;

    const mahasiswaBiasa = mahasiswas.filter(m => m.role === 'mahasiswa');
    const adminDowngradeable = admins.filter(a => a.role === 'admin');
    const superAdmins = admins.filter(a => a.role === 'superadmin');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Super Admin Dashboard</h1>
                <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
            </div>

            <div className={styles.welcomeSection}>
                <h2>Welcome, {user.nama}!</h2>
                {/* <p>Role: Super Admin </p> */}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {/* ── Tabel Mahasiswa Biasa ── */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    Daftar Mahasiswa ({mahasiswaBiasa.length})
                </div>

                {selectedUsers.length > 0 && (
                    <div className={styles.actionBar}>
                        <span>{selectedUsers.length} mahasiswa dipilih</span>
                        <button
                            onClick={handleChangeRole}
                            disabled={changingRole}
                            className={styles.buttonPrimary}
                        >
                            {changingRole ? 'Memproses...' : '📈 Jadikan Admin'}
                        </button>
                    </div>
                )}

                <div className={styles.card}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.tableHeader} style={{ width: 40 }}>
                                    <input type="checkbox" className={styles.checkbox}
                                        checked={selectedUsers.length === mahasiswaBiasa.length && mahasiswaBiasa.length > 0}
                                        onChange={e => setSelectedUsers(e.target.checked ? mahasiswaBiasa.map(m => m.userId) : [])}
                                    />
                                </th>
                                <th className={styles.tableHeader}>Nama</th>
                                <th className={styles.tableHeader}>Email</th>
                                <th className={styles.tableHeader}>NIM</th>
                                <th className={styles.tableHeader}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mahasiswaBiasa.length > 0 ? mahasiswaBiasa.map(mhs => (
                                <tr key={mhs.userId} className={styles.tableRow}
                                    style={{ background: selectedUsers.includes(mhs.userId) ? 'rgba(99,102,241,0.08)' : '' }}>
                                    <td className={styles.tableCell}>
                                        <input type="checkbox" className={styles.checkbox}
                                            checked={selectedUsers.includes(mhs.userId)}
                                            onChange={() => handleUserSelect(mhs.userId)} />
                                    </td>
                                    <td className={styles.tableCell}>{mhs.nama}</td>
                                    <td className={styles.tableCell}>{mhs.email}</td>
                                    <td className={styles.tableCell}>{mhs.nim}</td>
                                    <td className={styles.tableCell}>
                                        {mhs.isVerified
                                            ? <span className={styles.badgeVerified}>✅ Terverifikasi</span>
                                            : <span className={styles.badgeUnverified}>❌ Belum Verifikasi</span>}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className={styles.tableCell} style={{ textAlign: 'center' }}>
                                    Tidak ada mahasiswa
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Tabel Admin (bisa di-downgrade) ── */}
{/* ── Tabel Admin (bisa di-downgrade) ── */}
<div className={styles.section}>
    <div className={styles.sectionTitle}>
        Daftar Admin ({adminDowngradeable.length})
    </div>

    {selectedAdmins.length > 0 && (
        <div className={styles.actionBar}>
            <span>{selectedAdmins.length} admin dipilih</span>
            <button
                onClick={handleDowngradeAdmin}
                disabled={downgradingAdmin}
                className={styles.buttonDanger}
            >
                {downgradingAdmin ? 'Memproses...' : '📉 Turunkan ke Mahasiswa'}
            </button>
        </div>
    )}

    <div className={styles.card}>
        <table className={styles.table}>
            <thead>
                <tr>
                    <th className={styles.tableHeader} style={{ width: 40 }}>
                        <input type="checkbox" className={styles.checkbox}
                            checked={selectedAdmins.length === adminDowngradeable.length && adminDowngradeable.length > 0}
                            onChange={e => setSelectedAdmins(e.target.checked ? adminDowngradeable.map(a => a.adminId) : [])}
                        />
                    </th>
                    <th className={styles.tableHeader}>Nama</th>
                    <th className={styles.tableHeader}>Email</th>
                    <th className={styles.tableHeader}>NIM</th>
                    <th className={styles.tableHeader}>Role</th>
                </tr>
            </thead>
            <tbody>
                {adminDowngradeable.length > 0 ? adminDowngradeable.map(adm => (
                    <tr key={adm.adminId} className={styles.tableRow}
                        style={{ background: selectedAdmins.includes(adm.adminId) ? 'rgba(239,68,68,0.08)' : '' }}>
                        <td className={styles.tableCell}>
                            <input type="checkbox" className={styles.checkbox}
                                checked={selectedAdmins.includes(adm.adminId)}
                                onChange={() => handleAdminSelect(adm.adminId)} />
                        </td>
                        <td className={styles.tableCell}>{adm.nama}</td>
                        <td className={styles.tableCell}>{adm.email}</td>
                        <td className={styles.tableCell}>{adm.nim ?? '-'}</td>
                        <td className={styles.tableCell}>
                            <span className={`${styles.statusBadge} ${styles.statusAdmin}`}>{adm.role}</span>
                        </td>
                    </tr>
                )) : (
                    <tr><td colSpan={5} className={styles.tableCell} style={{ textAlign: 'center' }}>
                        Tidak ada admin
                    </td></tr>
                )}
            </tbody>
        </table>
    </div>
</div>

            {/* ── Super Admin (read-only) ── */}
            {superAdmins.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Super Admin ({superAdmins.length})</div>
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
                                {superAdmins.map(adm => (
                                    <tr key={adm.adminId} className={styles.tableRow}>
                                        <td className={styles.tableCell}>{adm.nama}</td>
                                        <td className={styles.tableCell}>{adm.email}</td>
                                        <td className={styles.tableCell}>
                                            <span className={`${styles.statusBadge} ${styles.statusSuperAdmin}`}>{adm.role}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}