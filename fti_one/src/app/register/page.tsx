'use client';

import { useState } from 'react';
import styles from './register.module.css';

interface RegistrationResponse {
  message: string;
  data?: {
    userId: string;
    nama: string;
    email: string;
    nim: string;
    isVerified: boolean;
  };
}

export default function Register() {
  const [formData, setFormData] = useState({
    nama: '',
    nim: '',
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
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: RegistrationResponse = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.message || 'Registrasi berhasil! Cek email kamu.');
        setFormData({ nama: '', nim: '', email: '', password: '' });
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Registrasi gagal. Coba lagi.');
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('Error: Tidak bisa terhubung ke server. Pastikan backend berjalan di port 5000.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Daftar Akun</h1>

        {message && (
          <div className={`${styles.message} ${isSuccess ? styles.success : styles.error}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="nama">Nama Lengkap</label>
            <input
              type="text"
              id="nama"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="nim">NIM</label>
            <input
              type="text"
              id="nim"
              name="nim"
              value={formData.nim}
              onChange={handleChange}
              required
              placeholder="Masukkan NIM"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Masukkan email"
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
            {loading ? 'Sedang Daftar...' : 'Daftar'}
          </button>
        </form>

        <p className={styles.footer}>
          Sudah punya akun? <a href="/login">Login di sini</a>
        </p>
      </div>
    </div>
  );
}
