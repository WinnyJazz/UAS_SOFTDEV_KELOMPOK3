'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

interface User {
    userId: string;
    nama: string;
    email: string;
    nim?: string;
    role: string;
    isVerified?: boolean;
}

interface AdminUser {
    adminId: string;
    nama: string;
    email: string;
    role: string;
}

export default function AdminDashboard() {
    const router = useRouter();

    useEffect(() => {
        router.push('/superadmin');
    }, [router]);

    return null;
}