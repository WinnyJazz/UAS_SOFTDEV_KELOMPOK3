import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>UAS Kelompok 3</h1>
        <p>Sistem Manajemen Aspirasi Mahasiswa</p>

        <div className={styles.ctas}>
          <Link href="/register" className={styles.primary}>
            Daftar Akun
          </Link>
          <Link href="/login" className={styles.secondary}>
            Login
          </Link>
        </div>
      </main>
    </div>
  );
}
