'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './reset-password.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function ResetPasswordInner() {
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

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage('Password dan konfirmasi password tidak sama.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('${API_BASE}/api/auth/reset-password', {
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
                                Token tidak valid atau sudah expired.
                            </div>
                        </>
                    ) : (
                        <>
                            <form onSubmit={handleSubmit}>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="Password Baru"
                                />

                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Konfirmasi Password"
                                />

                                <button disabled={loading}>
                                    {loading ? 'Loading...' : 'Reset Password'}
                                </button>
                            </form>

                            {message && (
                                <p className={isSuccess ? styles.success : styles.error}>
                                    {message}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordInner />
        </Suspense>
    );
}