'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './verify.module.css';

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token tidak ditemukan');
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/auth/verify-email?token=${token}`
        );

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email berhasil diverifikasi!');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verifikasi gagal');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Error: Tidak bisa terhubung ke server');
        console.error('Verification error:', error);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <h2>Memverifikasi email kamu...</h2>
            <p>Mohon tunggu sebentar</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={styles.successIcon}>✓</div>
            <h2>Email Terverifikasi!</h2>
            <p>{message}</p>
            <p className={styles.redirect}>Redirecting ke login dalam 3 detik...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={styles.errorIcon}>✗</div>
            <h2>Verifikasi Gagal</h2>
            <p>{message}</p>
            <div className={styles.actions}>
              <a href="/login" className={styles.button}>
                Kembali ke Login
              </a>
              <a href="/register" className={styles.buttonSecondary}>
                Daftar Ulang
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
