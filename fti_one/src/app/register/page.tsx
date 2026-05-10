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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      <div className={styles.inner}>

        {/* ── Orbital rings SVG ── */}
        <svg
          className={styles.orbitalSvg}
          viewBox="0 0 580 340"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <path id="regOuterOrbit" d="M 565,170 A 275,110 0 1,1 564.99,170.01" fill="none" />
            <path id="regInnerOrbit" d="M 525,175 A 240,90 0 1,1 524.99,175.01" fill="none" />
          </defs>

          <ellipse cx="290" cy="170" rx="275" ry="110"
            fill="none" stroke="rgba(255,255,255,0.50)" strokeWidth="1.5"
            transform="rotate(-18, 290, 170)" />
          <ellipse cx="285" cy="175" rx="240" ry="90"
            fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1"
            transform="rotate(-18, 285, 175)" />

          <circle r="7" fill="white" opacity="0.95">
            <animateMotion dur="12s" repeatCount="indefinite" rotate="auto">
              <mpath href="#regOuterOrbit" />
            </animateMotion>
          </circle>
          <circle r="4" fill="white" opacity="0.7">
            <animateMotion dur="12s" begin="-3s" repeatCount="indefinite" rotate="auto">
              <mpath href="#regOuterOrbit" />
            </animateMotion>
          </circle>
          <circle r="5" fill="white" opacity="0.85">
            <animateMotion dur="18s" begin="-6s" repeatCount="indefinite" rotate="auto">
              <mpath href="#regInnerOrbit" />
            </animateMotion>
          </circle>
          <circle r="3" fill="white" opacity="0.55">
            <animateMotion dur="18s" begin="-12s" repeatCount="indefinite" rotate="auto">
              <mpath href="#regInnerOrbit" />
            </animateMotion>
          </circle>
        </svg>

        {/* ── Left: logo ── */}
        <div className={styles.leftCol}>
          <div
            className={styles.logoWrap}
            style={{ backgroundImage: "url('/Rectangle.png')" }}
            role="img"
            aria-label="DPM FTI Universitas Tarumanagara"
          />
        </div>

        {/* ── Right: register card ── */}
        <div className={styles.card}>
          <h1>DAFTAR</h1>

          {message && (
            <div className={`${styles.message} ${isSuccess ? styles.success : styles.error}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="nama">Nama Lengkap</label>
              <input
                type="text"
                id="nama"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                required
                placeholder="Masukkan Nama Lengkap"
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
                placeholder="Masukkan Email"
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
                placeholder="Masukkan Password"
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Sedang Daftar...' : 'DAFTAR'}
            </button>
          </form>

          <p className={styles.footer}>
            Sudah punya akun? <a href="/login">Login di sini</a>
          </p>
        </div>

      </div>
    </div>
  );
}