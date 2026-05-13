'use client';

import { useState } from 'react';
import styles from './aboutus.module.css';

type Tab = 'who' | 'divisions' | 'team';

const misiList = [
  'Menampung dan menyuarakan aspirasi mahasiswa FTI Untar secara aktif dan berkelanjutan dengan mengutamakan nilai integritas dan keberpihakan terhadap kepentingan mahasiswa.',
  'Menjalin kolaborasi yang sinergis dengan pihak internal dan eksternal FTI Untar untuk menciptakan perubahan positif yang nyata bagi seluruh elemen kampus.',
  'Meningkatkan kualitas komunikasi serta keterbukaan informasi guna membangun hubungan yang kuat dan transparan antar mahasiswa dan lembaga.',
  'Mendorong budaya organisasi yang profesional dan progresif, dengan sistem kerja yang terstruktur, partisipatif, dan berorientasi pada kebermanfaatan.',
  'Membangun suasana internal DPM FTI yang harmonis dan solid, dengan menjunjung tinggi asas kekeluargaan dan semangat gotong royong antar anggota.',
];

export default function InformasiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('who');

  return (
    <div className={styles.pageWrapper}>

      {/* ── Tab Bar ── */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'who' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('who')}
        >
          Who are we?
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'divisions' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('divisions')}
        >
          Divisions
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'team' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('team')}
        >
          Our Team
        </button>
      </div>

      {/* ── Content Card ── */}
      <div className={styles.card}>

        {/* ══ WHO ARE WE ══ */}
        {activeTab === 'who' && (
          <div className={styles.section}>

            {/* Decorative dots */}
            <div className={styles.dotsTop} aria-hidden="true">
              <span /><span /><span />
            </div>

            {/* Title */}
            <h1 className={styles.mainTitle}>
              Dewan Perwakilan Fakultas<br />Teknologi Informasi
            </h1>

            {/* About block */}
            <div className={styles.aboutBlock}>
              <div className={styles.logoBox}>
                <img src="/Rectangle.png" alt="DPM FTI Logo" className={styles.logoImg} />
              </div>
              <p className={styles.aboutText}>
                Dewan Perwakilan Mahasiswa Fakultas Teknologi Informasi Universitas Tarumanagara
                (DPM FTI UNTAR) merupakan sebuah organisasi mahasiswa di tingkat fakultas yang
                berperan sebagai lembaga legislatif mahasiswa. DPM FTI UNTAR memiliki tugas utama
                yaitu menyusun Peraturan Daerah (Perda) Fakultas Teknologi Informasi, menyediakan
                layanan advokasi bagi mahasiswa, mewakili aspirasi mahasiswa, melakukan pengawasan
                melalui SOP terhadap lembaga eksekutif, serta memastikan bahwa setiap kebijakan
                yang diambil oleh lembaga eksekutif mahasiswa (BEM dan HMP) berjalan sesuai dengan
                kepentingan mahasiswa Fakultas Teknologi Informasi.
              </p>
            </div>

            {/* Divider */}
            <div className={styles.divider} aria-hidden="true" />

            {/* Visi & Misi */}
            <h2 className={styles.visiTitle}>VISI &amp; MISI</h2>

            <p className={styles.visiText}>
              Menjadikan DPM FTI sebagai lembaga yang berintegritas dan mengutamakan peran sebagai
              perwakilan mahasiswa dalam memperjuangkan aspirasi mahasiswa FTI Untar melalui
              kolaborasi aktif demi mewujudkan perubahan positif di lingkungan FTI Untar.
            </p>

            <ol className={styles.misiList}>
              {misiList.map((m, i) => (
                <li key={i} className={styles.misiItem}>
                  <span className={styles.misiNum}>{i + 1}.</span>
                  <span>{m}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ══ DIVISIONS ══ */}
        {activeTab === 'divisions' && (
          <div className={styles.section}>
            <div className={styles.dotsTop} aria-hidden="true">
              <span /><span /><span />
            </div>
            <h1 className={styles.mainTitle}>Divisions</h1>
            <p className={styles.comingSoon}>Konten divisions akan segera hadir.</p>
          </div>
        )}

        {/* ══ OUR TEAM ══ */}
        {activeTab === 'team' && (
          <div className={styles.section}>
            <div className={styles.dotsTop} aria-hidden="true">
              <span /><span /><span />
            </div>
            <h1 className={styles.mainTitle}>Our Team</h1>
            <p className={styles.comingSoon}>Konten our team akan segera hadir.</p>
          </div>
        )}

      </div>
    </div>
  );
}
