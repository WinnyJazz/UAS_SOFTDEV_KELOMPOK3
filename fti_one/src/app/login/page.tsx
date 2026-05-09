'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

interface LoginResponse {
  message: string;
  token?: string;
  data?: {
    userId: string;
    nama: string;
    email: string;
    nim: string;
    role: string;
  };
}

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: LoginResponse = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage('Login berhasil! Redirecting...');

        // Simpan token
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.data));
        }

        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Login gagal. Cek email/NIM dan password.');
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('Error: Tidak bisa terhubung ke server.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Login</h1>

        {message && (
          <div className={`${styles.message} ${isSuccess ? styles.success : styles.error}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email atau NIM</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Masukkan email atau NIM"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Masukkan password"
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Sedang Login...' : 'Login'}
          </button>
        </form>

        <p className={styles.footer}>
          Belum punya akun? <a href="/register">Daftar di sini</a>
        </p>
      </div>
    </div>
  );
}
