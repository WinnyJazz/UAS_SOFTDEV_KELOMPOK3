'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface UserData {
    userId: string;
    nama: string;
    nickname?: string | null;
    email: string;
    nim: string;
    role: string;
    profilePhoto?: string | null;
}

export default function Profile() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    const [isEditing, setIsEditing] = useState(false);
    const [editedNickname, setEditedNickname] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const [photoChanged, setPhotoChanged] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setEditedNickname(parsedUser.nickname || parsedUser.nama || '');
            if (parsedUser.profilePhoto) {
                setPhotoPreview(parsedUser.profilePhoto);
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        const logoutEvent = new CustomEvent('userLoggedOut');
        window.dispatchEvent(logoutEvent);

        router.push('/login');
    };

    const handleEditProfile = () => {
        setIsEditing(true);
        setPhotoChanged(false);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            setPhotoChanged(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        if (!editedNickname.trim()) {
            setMessage('Nickname tidak boleh kosong');
            setMessageType('error');
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const token = localStorage.getItem('token');

            const payload: any = {
                nickname: editedNickname.trim(),
            };

            if (photoChanged && photoPreview) {
                payload.profilePhoto = photoPreview;
            }

            const response = await fetch(`${API_BASE}/api/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                const updatedUser: UserData = {
                    ...user,
                    nickname: data.data.nickname,
                    profilePhoto: data.data.profilePhoto,
                };

                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));

                const profileUpdateEvent = new CustomEvent('profileUpdated', {
                    detail: { profilePhoto: data.data.profilePhoto }
                });
                window.dispatchEvent(profileUpdateEvent);

                setMessage('Profil berhasil diperbarui!');
                setMessageType('success');
                setIsEditing(false);
                setPhotoChanged(false);
            } else {
                setMessage(data.message || 'Gagal menyimpan profil');
                setMessageType('error');
            }
        } catch (error) {
            setMessage('Gagal menyimpan profil. Pastikan backend berjalan.');
            setMessageType('error');
            console.error('Error saving profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedNickname(user?.nickname || user?.nama || '');
        setPhotoFile(null);
        setPhotoChanged(false);
        if (user?.profilePhoto) {
            setPhotoPreview(user.profilePhoto);
        } else {
            setPhotoPreview('');
        }
    };

    const displayName = user?.nickname || user?.nama || 'Pengguna';

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingCard}>Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.container}>
                <div className={styles.errorCard}>User data tidak ditemukan</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.inner}>
                <div className={styles.card}>
                    <h1>Profil Saya</h1>

                    {message && (
                        <div className={`${styles.message} ${messageType === 'success' ? styles.messageSuccess : styles.messageError}`}>
                            {message}
                        </div>
                    )}

                    <div className={styles.profileContent}>
                        {/* Avatar Section */}
                        <div className={styles.avatarSection}>
                            <div className={styles.avatarCircle}>
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Profile" className={styles.avatarImage} />
                                ) : (
                                    <svg
                                        className={styles.avatarIcon}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                )}
                            </div>
                            <p className={styles.nimDisplay}>NIM: {user.nim}</p>
                        </div>

                        {/* Info Section */}
                        <div className={styles.infoSection}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Nickname</span>
                                <span className={styles.infoValue}>{displayName}</span>
                            </div>

                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Email</span>
                                <span className={styles.infoValue}>{user.email}</span>
                            </div>

                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Role</span>
                                <span className={styles.infoValue}>
                                    {user.role === 'admin' ? 'Admin' : 'Mahasiswa'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actions}>
                        <button className={styles.editBtn} onClick={handleEditProfile}>
                            Edit Profil
                        </button>
                        <button className={styles.logoutBtn} onClick={handleLogout}>
                            Logout
                        </button>
                    </div>

                    {/* Edit Modal */}
                    {isEditing && (
                        <div className={styles.modalOverlay}>
                            <div className={styles.modal}>
                                <h2>Edit Profil</h2>

                                {/* Photo Upload */}
                                <div className={styles.photoUploadSection}>
                                    <div className={styles.photoPreview}>
                                        {photoPreview ? (
                                            <img src={photoPreview} alt="Preview" />
                                        ) : (
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        id="photoInput"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className={styles.photoInput}
                                    />
                                    <label htmlFor="photoInput" className={styles.photoLabel}>
                                        Ubah Foto
                                    </label>
                                </div>

                                {/* Nickname Input */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="nickname">Nickname (Nama Panggilan)</label>
                                    <input
                                        type="text"
                                        id="nickname"
                                        value={editedNickname}
                                        onChange={(e) => setEditedNickname(e.target.value)}
                                        placeholder="Masukkan nickname kamu"
                                        className={styles.inputField}
                                    />
                                    <small style={{ color: '#999', marginTop: '5px', display: 'block' }}>
                                        Nama yang akan ditampilkan di profil (opsional, jika kosong akan menampilkan nama asli)
                                    </small>
                                </div>

                                {/* Modal Actions */}
                                <div className={styles.modalActions}>
                                    <button
                                        className={styles.saveBtn}
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                    <button
                                        className={styles.cancelBtn}
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
