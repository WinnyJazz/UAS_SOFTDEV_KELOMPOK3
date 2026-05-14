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
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data: LoginResponse = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage('Login berhasil! Redirecting...');
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.data));

          // Dispatch custom event untuk update navbar dengan profile photo
          const loginEvent = new CustomEvent('userLoggedIn', {
            detail: { user: data.data }
          });
          window.dispatchEvent(loginEvent);
        }
        const role = data.data?.role;
        setTimeout(() => {
          if (role === 'superadmin') {
            router.push('/superadmin');
          } else if (role === 'admin') {
            router.push('/admin/lost-found');
          } else {
            router.push('/dashboard');
          }
        }, 1500);
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Login gagal. Cek email dan password.');
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
      <div className={styles.inner}>

        <svg
          className={styles.orbitalSvg}
          viewBox="0 0 580 340"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            {/* Orbit 1 — terluar */}
            <path
              id="orb1"
              d="M 549.15,112.88
                 A 275,110 -18 1,1 549.14,112.87"
              fill="none"
            />
            {/* Orbit 2 */}
            <path
              id="orb2"
              d="M 512.32,123.45
                 A 240,90 -18 1,1 512.31,123.44"
              fill="none"
            />
            {/* Orbit 3 */}
            <path
              id="orb3"
              d="M 476.05,132.80
                 A 205,75 -18 1,1 476.04,132.79"
              fill="none"
            />
            {/* Orbit 4 */}
            <path
              id="orb4"
              d="M 439.50,141.60
                 A 168,58 -18 1,1 439.49,141.59"
              fill="none"
            />
            {/* Orbit 5 */}
            <path
              id="orb5"
              d="M 402.70,149.90
                 A 132,44 -18 1,1 402.69,149.89"
              fill="none"
            />
            {/* Orbit 6 — terdalam */}
            <path
              id="orb6"
              d="M 365.80,157.70
                 A 96,32 -18 1,1 365.79,157.69"
              fill="none"
            />
          </defs>

          {/* ── Garis orbit yang terlihat — pakai <use> dari path yang sama ── */}
          <use href="#orb1" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5"/>
          <use href="#orb2" stroke="rgba(255,255,255,0.30)" strokeWidth="1"/>
          <use href="#orb3" stroke="rgba(255,255,255,0.40)" strokeWidth="1.2"/>
          <use href="#orb4" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
          <use href="#orb5" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
          <use href="#orb6" stroke="rgba(255,255,255,0.20)" strokeWidth="0.7"/>

          {/* ── Orbit 1 — 4 titik ── */}
          <circle r="7" fill="white" opacity="0.95">
            <animateMotion dur="12s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb1"/>
            </animateMotion>
          </circle>
          <circle r="4" fill="white" opacity="0.65">
            <animateMotion dur="12s" begin="-3s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb1"/>
            </animateMotion>
          </circle>
          <circle r="5" fill="white" opacity="0.80">
            <animateMotion dur="12s" begin="-6s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb1"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="white" opacity="0.50">
            <animateMotion dur="12s" begin="-9s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb1"/>
            </animateMotion>
          </circle>

          {/* ── Orbit 2 — 4 titik ── */}
          <circle r="5" fill="white" opacity="0.85">
            <animateMotion dur="18s" begin="-6s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb2"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="white" opacity="0.55">
            <animateMotion dur="18s" begin="-12s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb2"/>
            </animateMotion>
          </circle>
          <circle r="4" fill="white" opacity="0.70">
            <animateMotion dur="18s" begin="-2s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb2"/>
            </animateMotion>
          </circle>
          <circle r="2.5" fill="rgba(200,220,255,0.9)" opacity="0.60">
            <animateMotion dur="18s" begin="-15s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb2"/>
            </animateMotion>
          </circle>

          {/* ── Orbit 3 — 3 titik ── */}
          <circle r="6" fill="white" opacity="0.90">
            <animateMotion dur="9s" begin="-1s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb3"/>
            </animateMotion>
          </circle>
          <circle r="3.5" fill="white" opacity="0.60">
            <animateMotion dur="9s" begin="-4s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb3"/>
            </animateMotion>
          </circle>
          <circle r="2.5" fill="rgba(180,210,255,0.9)" opacity="0.75">
            <animateMotion dur="9s" begin="-7s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb3"/>
            </animateMotion>
          </circle>

          {/* ── Orbit 4 — 3 titik ── */}
          <circle r="5" fill="white" opacity="0.80">
            <animateMotion dur="7s" begin="-2s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb4"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="rgba(220,235,255,0.95)" opacity="0.70">
            <animateMotion dur="7s" begin="-4.5s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb4"/>
            </animateMotion>
          </circle>
          <circle r="2" fill="white" opacity="0.45">
            <animateMotion dur="7s" begin="-6s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb4"/>
            </animateMotion>
          </circle>

          {/* ── Orbit 5 — 2 titik ── */}
          <circle r="4.5" fill="white" opacity="0.85">
            <animateMotion dur="5s" begin="-1s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb5"/>
            </animateMotion>
          </circle>
          <circle r="2.5" fill="rgba(200,220,255,0.9)" opacity="0.65">
            <animateMotion dur="5s" begin="-3.5s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb5"/>
            </animateMotion>
          </circle>

          {/* ── Orbit 6 — 2 titik ── */}
          <circle r="3.5" fill="white" opacity="0.90">
            <animateMotion dur="3.5s" begin="0s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb6"/>
            </animateMotion>
          </circle>
          <circle r="2" fill="rgba(220,240,255,0.95)" opacity="0.75">
            <animateMotion dur="3.5s" begin="-2s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orb6"/>
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

        {/* ── Right: login card ── */}
        <div className={styles.card}>
          <h1>LOG IN</h1>

          {message && (
            <div className={`${styles.message} ${isSuccess ? styles.success : styles.error}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="text"
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
                placeholder="Password"
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Sedang Login...' : 'LOG IN'}
            </button>
          </form>

          <p className={styles.footer}>
            Belum punya akun? <a href="/register">Daftar di sini</a>
          </p>

          <p className={styles.forgotPassword}>
            <a href="/forgot-password">Lupa Password?</a>
          </p>
        </div>

      </div>
    </div>
  );
}