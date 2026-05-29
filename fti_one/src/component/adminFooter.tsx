'use client';

import styles from "./adminFooter.module.css";

export default function AdminFooter() {
  return (
    <footer className={styles.footer}>
      <p>
        © 2025 <span>DPM FTI Untar</span> — Admin Dashboard
      </p>
    </footer>
  );
}
