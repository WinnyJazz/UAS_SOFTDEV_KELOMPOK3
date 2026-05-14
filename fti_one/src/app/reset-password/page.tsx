'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './reset-password.module.css';

export default function ResetPassword() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(true);

    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            setMessage('Token tidak ditemukan atau invalid.');
        }
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsSuccess(false);

        // Validasi password dan confirm password
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage('Password dan konfirmasi password tidak sama.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    newPassword: formData.newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                setMessage(data.message || 'Password berhasil direset!');
                setFormData({ newPassword: '', confirmPassword: '' });
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setIsSuccess(false);
                setMessage(data.message || 'Reset password gagal.');
            }
        } catch (error) {
            setIsSuccess(false);
            setMessage('Error: Tidak bisa terhubung ke server.');
            console.error('Reset password error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.inner}>
                <div className={styles.card}>
                    <h1>Reset Password</h1>

                    {!tokenValid ? (
                        <>
                            <div className={`${styles.message} ${styles.error}`}>
                                Token tidak valid atau sudah expired. Silakan minta link reset password baru.
                            </div>
                            <p className={styles.footer}>
                                <a href="/forgot-password">Minta link reset password baru</a>
                            </p>
                        </>
                    ) : (
                        <>
                            <p className={styles.subtitle}>
                                Masukkan password baru kamu
                            </p>

                            {message && (
                                <div className={`${styles.message} ${isSuccess ? styles.success : styles.error}`}>
                                    {message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="newPassword">Password Baru</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        required
                                        placeholder="Masukkan Password Baru"
                                    />
                                    <small style={{ color: '#999', marginTop: '5px', display: 'block' }}>
                                        Minimal 8 karakter, dengan huruf besar, huruf kecil, angka, dan simbol
                                    </small>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="confirmPassword">Konfirmasi Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        placeholder="Konfirmasi Password Baru"
                                    />
                                </div>

                                <button type="submit" disabled={loading} className={styles.submitBtn}>
                                    {loading ? 'Sedang Reset...' : 'Reset Password'}
                                </button>
                            </form>

                            <p className={styles.footer}>
                                <a href="/login">Kembali ke login</a>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
