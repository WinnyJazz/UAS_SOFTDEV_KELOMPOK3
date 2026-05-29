"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const features = [
  {
    id: "lost-found",
    label: "LOST & FOUND",
    icon: "/Rectangle (3).png",
    href: "/lost-found",
    description:
      "Pernah kehilangan barang di kampus? Tenang, fitur ini membantu mahasiswa mencari dan menemukan kembali barang yang hilang maupun ditemukan di area kampus.",
  },
  {
    id: "aspirasi",
    label: "ASPIRASI",
    icon: "/Rectangle (5).png",
    href: "/aspirasi",
    description:
      "Fitur aspirasi hadir sebagai ruang bagi mahasiswa FTI untuk menyampaikan saran, kritik, maupun masukan secara mudah dan terbuka demi mendukung perkembangan lingkungan kampus yang lebih baik.",
  },
  {
    id: "about-us",
    label: "ABOUT US",
    icon: "/Rectangle (2).png",
    href: "/aboutus",
    description:
      "Kami hadir sebagai wadah komunikasi dan pelayanan mahasiswa FTI untuk membantu penyampaian informasi, aspirasi, serta berbagai kebutuhan mahasiswa demi menciptakan lingkungan kampus yang lebih aktif, responsif, dan kolaboratif.",
  },
  {
    id: "information",
    label: "INFORMASI",
    icon: "/Rectangle (4).png",
    href: "/info",
    description:
      "Tempat untuk mendapatkan info terbaru seputar kegiatan kampus, pengumuman penting, event mahasiswa, hingga berbagai informasi akademik dan non-akademik.",
  },
];

const SLOT_OFFSET_PX = 316;

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sliding, setSliding]         = useState(0);
  const [locked, setLocked]           = useState(false);
  const [hoveredSide, setHoveredSide] = useState<"left" | "right" | null>(null);
  const featureRef    = useRef<HTMLElement>(null);
  const slideTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const len = features.length;
  const router = useRouter();

  // Reset locked saat halaman kembali ke fokus (back navigation)
  useEffect(() => {
    const handleFocus = () => {
      if (slideTimer.current) clearTimeout(slideTimer.current);
      if (lockTimer.current)  clearTimeout(lockTimer.current);
      setSliding(0);
      setLocked(false);
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") handleFocus();
    });
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Bersihkan semua timer saat unmount — cegah locked nyangkut setelah back navigation
  useEffect(() => {
    return () => {
      if (slideTimer.current) clearTimeout(slideTimer.current);
      if (lockTimer.current)  clearTimeout(lockTimer.current);
    };
  }, []);

  // Reset state animasi saat component mount ulang (back navigation di App Router)
  useEffect(() => {
    setSliding(0);
    setLocked(false);
  }, []);

  const getIdx = (offset: number) => (activeIndex + offset + len * 10) % len;

  const navigate = (dir: "left" | "right") => {
    if (locked) return;
    setLocked(true);
    setSliding(dir === "right" ? 1 : -1);
  };

  useEffect(() => {
    if (sliding === 0) return;
    slideTimer.current = setTimeout(() => {
      setActiveIndex((i) =>
        sliding === 1 ? (i + 1) % len : (i - 1 + len) % len
      );
      setSliding(0);
      lockTimer.current = setTimeout(() => setLocked(false), 60);
    }, 420);
    return () => {
      if (slideTimer.current) clearTimeout(slideTimer.current);
    };
  }, [sliding]);

  const scrollToFeatures = () => {
    featureRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  const translateX = sliding === 0 ? 0 : sliding * -SLOT_OFFSET_PX;

  const slots = [-2, -1, 0, 1, 2];

  return (
    <div className={styles.page}>

      {/* ══ HERO ══ */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.title}>
            <span className={styles.titleWhite}>WELCOME TO</span>
            <span className={styles.titlePink}>DPM FTI UNTAR</span>
          </h1>
          <button className={styles.exploreBtn} onClick={scrollToFeatures}>
            EXPLORE
          </button>
        </div>

        <div className={styles.mascotWrapper}>
          <Image
            src="/Mascot.png"
            alt="Mascot"
            width={520}
            height={620}
            className={styles.mascot}
            priority
          />
          <Image
            src="/Orbit.png"
            alt="Orbit"
            width={780}
            height={500}
            className={styles.orbit}
          />
        </div>
      </section>

      {/* ══ FEATURE CAROUSEL ══ */}
      <section className={styles.featureSection} ref={featureRef}>
        <div className={styles.carousel}>

          {/* Arrow left */}
          <button
            className={styles.arrowBtn}
            onClick={() => navigate("left")}
            aria-label="Previous"
          >
            ‹
          </button>

          {/* Track — overflow hidden untuk clip kartu yg keluar */}
          <div className={styles.track}>
            <div
              className={styles.trackInner}
              style={{
                transform: `translateX(${translateX}px)`,
                transition: sliding !== 0
                  ? "transform 0.42s cubic-bezier(0.4, 0.0, 0.2, 1)"
                  : "none",
              }}
            >
              {slots.map((offset) => {
                const feat = features[getIdx(offset)];

                const effectiveOffset = sliding !== 0 ? offset - sliding : offset;
                const isCenter        = effectiveOffset === 0;
                const isVisible       = Math.abs(effectiveOffset) <= 1;
                const isFar           = Math.abs(effectiveOffset) >= 2;

                // Hover hanya untuk side card yg benar-benar di posisi ±1
                const sideDir = effectiveOffset === -1 ? "left" : effectiveOffset === 1 ? "right" : null;
                const isHovered = sideDir !== null && hoveredSide === sideDir && sliding === 0;

                return (
                  <div
                    key={feat.id + offset}
                    className={styles.slot}
                    style={{
                      opacity: isFar ? 0 : isCenter ? 1 : 0.92,
                      pointerEvents: isCenter || isVisible ? "auto" : "none",
                    }}
                  >
                  {isCenter ? (
                    <Link
                      href={feat.href}
                      className={styles.cardCenterWrapper}
                      tabIndex={0}
                    >
                      <div className={`${styles.card} ${styles.cardCenter} ${sliding === 0 ? styles.cardCenterHoverable : ""}`}>
                        <div className={styles.cardIconLarge}>
                          <Image
                            src={feat.icon}
                            alt={feat.label}
                            width={190}
                            height={190}
                            className={`${styles.iconImg} ${sliding === 0 ? styles.iconPop : ""}`}
                          />
                        </div>
                      </div>
                      <div className={styles.cardCenterText}>
                        <p className={styles.cardLabel}>{feat.label}</p>
                        <p className={styles.cardDesc}>{feat.description}</p>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href={feat.href}
                      className={`${styles.card} ${styles.cardSide} ${isHovered ? styles.cardSideHover : ""}`}
                      onMouseEnter={() => sideDir && setHoveredSide(sideDir)}
                      onMouseLeave={() => setHoveredSide(null)}
                      tabIndex={isVisible ? 0 : -1}
                    >
                      <div className={styles.cardIcon}>
                        <Image
                          src={feat.icon}
                          alt={feat.label}
                          width={120}
                          height={120}
                          className={`${styles.iconImg} ${isHovered ? styles.iconWiggle : ""}`}
                        />
                      </div>
                      <p className={styles.cardLabelSide}>{feat.label}</p>
                    </Link>
                  )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Arrow right */}
          <button
            className={styles.arrowBtn}
            onClick={() => navigate("right")}
            aria-label="Next"
          >
            ›
          </button>

        </div>
      </section>

    </div>
  );
}
