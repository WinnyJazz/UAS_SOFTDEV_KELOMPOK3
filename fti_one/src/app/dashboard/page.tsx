'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

interface User {
  userId: string;
  nama: string;
  email: string;
  nim: string;
  role: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);

    // Redirect admin dan superadmin ke halaman khusus
    if (parsedUser.role === 'admin' || parsedUser.role === 'superadmin') {
      router.push('/superadmin');
      return;
    }
    if (parsedUser.role === 'mahasiswa') {
      router.push('/homepage');
      return;
    }
    setUser(parsedUser);
    setLoading(false);
  }, [router]);

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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <div className={styles.card}>
        <h2>Welcome, {user.nama}! 👋</h2>

        <div className={styles.userInfo}>
          <div className={styles.infoGroup}>
            <label>User ID:</label>
            <p>{user.userId}</p>
          </div>

          <div className={styles.infoGroup}>
            <label>Nama:</label>
            <p>{user.nama}</p>
          </div>

          <div className={styles.infoGroup}>
            <label>Email:</label>
            <p>{user.email}</p>
          </div>

          <div className={styles.infoGroup}>
            <label>NIM:</label>
            <p>{user.nim}</p>
          </div>

          <div className={styles.infoGroup}>
            <label>Role:</label>
            <p>{user.role}</p>
          </div>
        </div>

        <div className={styles.success}>
          ✅ Registrasi dan Login berhasil!
        </div>
      </div>
    </div>
  );
}
