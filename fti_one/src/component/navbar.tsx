"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();
  const [navLinks, setNavLinks] = useState([
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Aspirasi", href: "/aspirasi" },
    { label: "Info", href: "/info" },
    { label: "Lost & Found", href: "/lost-found" },
  ]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      if (user.role === "admin" || user.role === "superadmin") {
        setNavLinks([
          { label: "Home", href: "/" },
          { label: "About Us", href: "/about" },
          { label: "Aspirasi", href: "/aspirasi" },
          { label: "Info", href: "/info" },
          { label: "Lost & Found", href: "/admin/lost-found" },
          { label: "Claims", href: "/admin/claims" },
        ]);
      }
    }
  }, []);

  return (
    <nav className={styles.navbar}>
      {/* Logo kiri */}
      <Link href="/about" className={styles.logoLink}>
        <div className={styles.logoCircle}>
          <span className={styles.logoText}>DPM</span>
          <span className={styles.logoSub}>FTI</span>
        </div>
      </Link>

      {/* Nav Links */}
      <ul className={styles.navLinks}>
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`${styles.navItem} ${
                pathname === link.href ? styles.active : ""
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Profile Icon */}
      <Link href="/profile" className={styles.profileLink} aria-label="Profile">
        <div className={styles.profileAvatar}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="22"
            height="22"
          >
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
      </Link>
    </nav>
  );
}
