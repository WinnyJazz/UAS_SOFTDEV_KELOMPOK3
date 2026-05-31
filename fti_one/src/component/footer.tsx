"use client";

import styles from "./footer.module.css";
import { FaInstagram, FaYoutube, FaTiktok } from "react-icons/fa";

export default function Footer() {
  return (
    <footer id="footer" className={styles.footer}>
      <div className={styles.inner}>

        {/* ── LEFT ── */}
        <div className={styles.left}>
          <div className={styles.logoRow}>
            <img
              src="/dpmlogo.png"
              alt="Logo DPM FTI Untar"
              className={styles.logoImg}
            />

            <div className={styles.orgName}>
              <span className={styles.orgTitle}>DPM FTI</span>
              <span className={styles.orgSub}>
                Dewan Perwakilan Mahasiswa
              </span>
            </div>
          </div>

          <p className={styles.orgDetail}>
            Fakultas Teknologi Industri · Universitas Tarumanagara
          </p>

          <span className={styles.period}>Periode 2025-2026</span>
        </div>

        {/* ── RIGHT ── */}
        <div className={styles.right}>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Alamat</span>
            <span className={styles.colon}>:</span>

            <span className={styles.infoValue}>
              Jl. Letjen S. Parman No.1, Tomang,
              <br />
              Grogol Petamburan, Jakarta Barat,
              <br />
              Daerah Khusus Ibukota Jakarta 11440.
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Sekretariat</span>
            <span className={styles.colon}>:</span>

            <span className={styles.infoValue}>
              Gedung R Lantai 7, Ruang Organisasi
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.colon}>:</span>

            <a
              href="mailto:dpmfti@untar.ac.id"
              className={styles.infoLink}
            >
              dpmfti@untar.ac.id
            </a>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Instagram</span>
            <span className={styles.colon}>:</span>

            <a
              href="https://www.instagram.com/dpmftiuntar/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.infoLink}
            >
              @dpmftiuntar
            </a>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>TikTok</span>
            <span className={styles.colon}>:</span>

            <a
              href="https://www.tiktok.com/@dpmftiuntar"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.infoLink}
            >
              @dpmfti.untar
            </a>
          </div>

          {/* ── SOCIAL ICONS ── */}
          <div className={styles.socials}>
            <a
              href="https://instagram.com/dpmftiuntar"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              title="Instagram"
            >
              <FaInstagram />
            </a>

            <a
              href="https://youtube.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              title="YouTube"
            >
              <FaYoutube />
            </a>

            <a
              href="https://tiktok.com/@dpmftiuntar"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              title="TikTok"
            >
              <FaTiktok />
            </a>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className={styles.bottom}>
        © 2026 <strong>DPM FTI Untar</strong>. All Rights Reserved.
      </div>
    </footer>
  );
}