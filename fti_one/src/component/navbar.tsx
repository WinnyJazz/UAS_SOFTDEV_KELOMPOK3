"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import styles from "./navbar.module.css";

interface NotifPreview {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  category: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [navLinks, setNavLinks] = useState([
    { label: "Home", href: "/homepage" },
    { label: "About Us", href: "/aboutus" },
    { label: "Aspirasi", href: "/aspirasi" },
    { label: "Info", href: "/info" },
    { label: "Lost & Found", href: "/lost-found" },
  ]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Notif state
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifPreview, setNotifPreview] = useState<NotifPreview[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchNotifPreview = async (token: string) => {
    try {
      console.log("🔔 fetchNotifPreview dipanggil");
      const res = await fetch(
        "http://localhost:5000/api/dashboard/notifikasi?read=Belum+Dibaca",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("🔔 status:", res.status);
      const data = await res.json();
      console.log("🔔 data:", data);
      setUnreadCount(data.unreadCount ?? 0);
      setNotifPreview((data.data ?? []).slice(0, 4));
    } catch (err) {
      console.error("🔔 fetchNotifPreview error:", err);
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch("http://localhost:5000/api/dashboard/notifikasi/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(0);
      setNotifPreview((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silently fail
    }
  };

  const markOneRead = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(
        `http://localhost:5000/api/dashboard/notifikasi/${id}/read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifPreview((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    const loadUserData = () => {
  const stored = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  
  console.log("👤 stored:", stored);
  console.log("👤 token:", token ? "ada" : "tidak ada");
  
  if (stored) {
    const user = JSON.parse(stored);
      console.log("👤 user.role:", user.role);
      
      const adminRole = user.role === "admin" || user.role === "superadmin";
      console.log("👤 isAdmin:", adminRole);
      
      setProfilePhoto(user.profilePhoto || null);
      setIsAdmin(adminRole);

      if (adminRole) {
        setNavLinks([
          { label: "Home", href: "/dashboard" },
          { label: "About Us", href: "/aboutus" },
          { label: "Aspirasi", href: "/admin/aspirasi" },
          { label: "Info", href: "/admin/info" },
          { label: "Lost & Found", href: "/admin/lost-found" },
        ]);
        if (token) fetchNotifPreview(token);
      }
    } else {
      setProfilePhoto(null);
      setIsAdmin(false);
      setUnreadCount(0);
    }
  };

    const handleLogout = () => {
      setProfilePhoto(null);
      setIsAdmin(false);
      setUnreadCount(0);
      setNavLinks([
        { label: "Home", href: "/" },
        { label: "About Us", href: "/aboutus" },
        { label: "Aspirasi", href: "/aspirasi" },
        { label: "Info", href: "/info" },
        { label: "Lost & Found", href: "/lost-found" },
      ]);
    };

    const handleLogin = () => loadUserData();

    loadUserData();

    window.addEventListener("storage", loadUserData);
    window.addEventListener("profileUpdated", loadUserData as EventListener);
    window.addEventListener("userLoggedIn", handleLogin as EventListener);
    window.addEventListener("userLoggedOut", handleLogout as EventListener);
    window.addEventListener("focus", loadUserData);

    // Poll unread count every 60s for admins
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      const stored = localStorage.getItem("user");
      if (token && stored) {
        const user = JSON.parse(stored);
        if (user.role === "admin" || user.role === "superadmin") {
          fetchNotifPreview(token);
        }
      }
    }, 60000);

    return () => {
      window.removeEventListener("storage", loadUserData);
      window.removeEventListener(
        "profileUpdated",
        loadUserData as EventListener
      );
      window.removeEventListener(
        "userLoggedIn",
        handleLogin as EventListener
      );
      window.removeEventListener(
        "userLoggedOut",
        handleLogout as EventListener
      );
      window.removeEventListener("focus", loadUserData);
      clearInterval(interval);
    };
  }, []);

  return (
    <nav className={styles.navbar}>
      {/* Logo */}
      <Link href="/aboutus" className={styles.logoLink}>
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

      {/* Right side: bell (admin only) + profile */}
      <div className={styles.navRight}>
        {/* ── Bell Icon (admin/superadmin only) ── */}
        {isAdmin && (
          <div className={styles.notifWrap} ref={notifRef}>
            <button
              className={styles.bellBtn}
              onClick={() => setShowNotifDropdown((v) => !v)}
              aria-label="Notifikasi"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="20"
                height="20"
              >
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              {unreadCount > 0 && (
                <span className={styles.bellBadge}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showNotifDropdown && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifDropHeader}>
                  <span className={styles.notifDropTitle}>
                    Notifikasi
                    {unreadCount > 0 && (
                      <span className={styles.notifDropBadge}>
                        {unreadCount} baru
                      </span>
                    )}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      className={styles.markAllBtn}
                      onClick={markAllRead}
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>

                <div className={styles.notifDropList}>
                  {notifPreview.length === 0 ? (
                    <div className={styles.notifDropEmpty}>
                      🎉 Semua sudah dibaca
                    </div>
                  ) : (
                    notifPreview.map((n) => (
                      <div
                        key={n.id}
                        className={`${styles.notifDropItem} ${
                          !n.read ? styles.notifDropUnread : ""
                        }`}
                        onClick={() => {
                          markOneRead(n.id);
                          setShowNotifDropdown(false);
                          router.push("/admin/notifikasi");
                        }}
                      >
                        <div
                          className={styles.notifDropIcon}
                          style={{ background: n.iconBg }}
                        >
                          {n.icon}
                        </div>
                        <div className={styles.notifDropBody}>
                          <div className={styles.notifDropItemTitle}>
                            {n.title}
                          </div>
                          <div className={styles.notifDropItemDesc}>
                            {n.desc}
                          </div>
                          <div className={styles.notifDropItemTime}>
                            {n.time}
                          </div>
                        </div>
                        {!n.read && (
                          <div className={styles.notifDropDot} />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <Link
                  href="/admin/notifikasi"
                  className={styles.notifDropFooter}
                  onClick={() => setShowNotifDropdown(false)}
                >
                  Lihat semua notifikasi →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Profile */}
        <Link
          href="/profile"
          className={styles.profileLink}
          aria-label="Profile"
        >
          <div className={styles.profileAvatar}>
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className={styles.profileAvatarImage}
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="22"
                height="22"
              >
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            )}
          </div>
        </Link>
      </div>
    </nav>
  );
}