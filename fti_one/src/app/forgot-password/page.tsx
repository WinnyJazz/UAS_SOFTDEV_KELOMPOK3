'use client';

import { useState } from 'react';
import styles from './forgot-password.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsSuccess(false);

        try {
            const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                setMessage(data.message || 'Link reset password sudah dikirim ke email kamu.');
                setEmail('');
            } else {
                setIsSuccess(false);
                setMessage(data.message || 'Gagal mengirim link reset password.');
            }
        } catch (error) {
            setIsSuccess(false);
            setMessage('Error: Tidak bisa terhubung ke server.');
            console.error('Forgot password error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.inner}>
                <div className={styles.card}>
                    <h1>Reset Password</h1>
                    <p className={styles.subtitle}>
                        Masukkan email kamu untuk menerima link reset password
                    </p>

                    {message && (
                        <div className={`${styles.message} ${isSuccess ? styles.success : styles.error}`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Masukkan Email Kamu"
                            />
                        </div>

                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? 'Sedang Mengirim...' : 'Kirim Link Reset Password'}
                        </button>
                    </form>

                    <p className={styles.footer}>
                        Ingat password kamu? <a href="/login">Login di sini</a> atau <a href="/register">Daftar</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
