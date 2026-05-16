"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";

const features = [
  {
    id: "lost-found",
    label: "LOST & FOUND",
    icon: "/Rectangle (3).png",
    href: "/lost-found",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quis erat et quam iaculis faucibus at sit amet nibh. Vestibulum dignissim lectus",
  },
  {
    id: "aspirasi",
    label: "ASPIRASI",
    icon: "/Rectangle (5).png",
    href: "/aspirasi",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quis erat et quam iaculis faucibus at sit amet nibh. Vestibulum dignissim lectus",
  },
  {
    id: "about-us",
    label: "ABOUT US",
    icon: "/Rectangle (2).png",
    href: "/aboutus",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quis erat et quam iaculis faucibus at sit amet nibh. Vestibulum dignissim lectus",
  },
  {
    id: "information",
    label: "INFORMATION",
    icon: "/Rectangle (4).png",
    href: "/information",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quis erat et quam iaculis faucibus at sit amet nibh. Vestibulum dignissim lectus",
  },
];

/*
  Strategi animasi baru:
  - Render 5 slot: far-left, left, center, right, far-right
  - Saat navigate, semua slot geser bersama via CSS transform translateX
  - Center shrink → side scale, side scale → center grow
  - Pakai `animating` state agar transition berjalan dulu baru index di-update
*/

const SLOT_OFFSET_PX = 316; // jarak antar slot (center ke side)

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sliding, setSliding]         = useState(0);      // -1 geser kiri, +1 geser kanan, 0 idle
  const [locked, setLocked]           = useState(false);  // cegah spam klik
  const [hoveredSide, setHoveredSide] = useState<"left" | "right" | null>(null);
  const featureRef = useRef<HTMLElement>(null);
  const len = features.length;

  const getIdx = (offset: number) => (activeIndex + offset + len * 10) % len;

  const navigate = (dir: "left" | "right") => {
    if (locked) return;
    setLocked(true);
    // Mulai slide: geser semua card ke arah yg benar
    setSliding(dir === "right" ? 1 : -1);
  };

  // Setelah transition selesai, update index & reset
  useEffect(() => {
    if (sliding === 0) return;
    const t = setTimeout(() => {
      setActiveIndex((i) =>
        sliding === 1 ? (i + 1) % len : (i - 1 + len) % len
      );
      setSliding(0);
      // sedikit delay sebelum unlock agar transisi reset tak keliatan
      setTimeout(() => setLocked(false), 60);
    }, 420); // harus sama dengan durasi transition CSS
    return () => clearTimeout(t);
  }, [sliding]);

  const scrollToFeatures = () => {
    featureRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /*
    Slot yang dirender: index -2, -1, 0, +1, +2 dari activeIndex
    sliding  1 = geser kanan → translateX(-OFFSET)
    sliding -1 = geser kiri  → translateX(+OFFSET)
  */
  const translateX = sliding === 0 ? 0 : sliding * -SLOT_OFFSET_PX;

  const slots = [-2, -1, 0, 1, 2];

  return (
    <div className={styles.page}>

      {/* ══ HERO ══ */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.title}>
            <span className={styles.titleWhite}>WELCOME TO</span>
            <span className={styles.titlePink}>SISFOR DPM FTI UNTAR</span>
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

                /*
                  Tentukan ukuran slot berdasarkan offset saat ini + slide yg sedang terjadi.
                  Saat slide berlangsung, slot "bergerak" sehingga offset efektif berubah.
                  offsetAfter = offset - sliding  (karena setelah animasi index akan update)
                  Kita interpolate size dari offsetNow → offsetAfter.

                  Trik: kita langsung apply style target, CSS transition handle smooth-nya
                  pada width/height/opacity via kartu masing2.
                */
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
