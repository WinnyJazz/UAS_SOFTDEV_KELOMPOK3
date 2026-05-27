"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./notifikasi.module.css";

type NotifCategory = "Semua" | "Lost & Found" | "Aspirasi" | "User" | "Sistem";
type NotifReadFilter = "Semua" | "Belum Dibaca" | "Sudah Dibaca";

interface NotifItem {
  id: string;
  _id: string;
  icon: string;
  iconBg: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  category: NotifCategory;
}

const CATEGORY_OPTIONS: NotifCategory[] = [
  "Semua",
  "Lost & Found",
  "Aspirasi",
  "User",
  "Sistem",
];
const READ_OPTIONS: NotifReadFilter[] = [
  "Semua",
  "Belum Dibaca",
  "Sudah Dibaca",
];

export default function AdminNotifikasiPage() {
  const router = useRouter();

  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const [readFilter, setReadFilter] = useState<NotifReadFilter>("Semua");
  const [catFilter, setCatFilter] = useState<NotifCategory>("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Auth check
  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!stored || !token) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== "admin" && user.role !== "superadmin") {
      router.push("/dashboard");
    }
  }, [router]);

  const fetchNotifs = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (readFilter !== "Semua") params.set("read", readFilter);
      if (catFilter !== "Semua") params.set("category", catFilter);

      const res = await fetch(
        `http://localhost:5000/api/dashboard/notifikasi?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Gagal mengambil notifikasi");

      const data = await res.json();
      setNotifs(data.data ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      setError("Tidak dapat terhubung ke server. Menampilkan data kosong.");
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, [readFilter, catFilter]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const markOneRead = async (notif: NotifItem) => {
    if (notif.read) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(
        `http://localhost:5000/api/dashboard/notifikasi/${notif._id}/read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchNotifs();

      window.dispatchEvent(new CustomEvent("notifRead"));
    } catch {}
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(
        "http://localhost:5000/api/dashboard/notifikasi/read-all",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchNotifs();

      window.dispatchEvent(new CustomEvent("notifRead"));
    } catch {}
  };

  // Client-side search filter
  const filtered = notifs.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q)
    );
  });

  const categoryCount = (cat: NotifCategory) => {
    if (cat === "Semua") return notifs.length;
    return notifs.filter((n) => n.category === cat).length;
  };

  return (
    <div className={styles.page}>
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={styles.backBtn}
            onClick={() => router.back()}
          >
            ← Kembali
          </button>
          <div>
            <h1 className={styles.pageTitle}>🔔 Notifikasi</h1>
            <p className={styles.pageSubtitle}>
              Pantau semua aktivitas sistem secara real-time
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>
              {unreadCount} belum dibaca
            </span>
          )}
          <button
            className={styles.markAllBtn}
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            ✓ Tandai semua dibaca
          </button>
          <button className={styles.refreshBtn} onClick={fetchNotifs}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div className={styles.statsStrip}>
        <div className={styles.statChip}>
          <span className={styles.statChipNum}>{notifs.length}</span>
          <span className={styles.statChipLabel}>Total</span>
        </div>
        <div className={`${styles.statChip} ${styles.statChipUnread}`}>
          <span className={styles.statChipNum}>{unreadCount}</span>
          <span className={styles.statChipLabel}>Belum Dibaca</span>
        </div>
        <div className={`${styles.statChip} ${styles.statChipRead}`}>
          <span className={styles.statChipNum}>
            {notifs.filter((n) => n.read).length}
          </span>
          <span className={styles.statChipLabel}>Sudah Dibaca</span>
        </div>
        <div className={`${styles.statChip} ${styles.statChipLF}`}>
          <span className={styles.statChipNum}>
            {notifs.filter((n) => n.category === "Lost & Found").length}
          </span>
          <span className={styles.statChipLabel}>Lost &amp; Found</span>
        </div>
        <div className={`${styles.statChip} ${styles.statChipAsp}`}>
          <span className={styles.statChipNum}>
            {notifs.filter((n) => n.category === "Aspirasi").length}
          </span>
          <span className={styles.statChipLabel}>Aspirasi</span>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className={styles.filtersCard}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Cari notifikasi..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className={styles.searchClear}
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.filterRow}>
          {/* Read filter */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status:</span>
            <div className={styles.tabGroup}>
              {READ_OPTIONS.map((f) => (
                <button
                  key={f}
                  className={`${styles.tabBtn} ${
                    readFilter === f ? styles.tabBtnActive : ""
                  }`}
                  onClick={() => setReadFilter(f)}
                >
                  {f}
                  {f === "Belum Dibaca" && unreadCount > 0 && (
                    <span className={styles.tabBadge}>{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Kategori:</span>
            <div className={styles.tabGroup}>
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.tabBtn} ${
                    catFilter === cat ? styles.tabBtnActive : ""
                  }`}
                  onClick={() => setCatFilter(cat)}
                >
                  {cat}
                  <span className={styles.tabCount}>{categoryCount(cat)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── LIST ── */}
      <div className={styles.listCard}>
        {error && (
          <div className={styles.errorBanner}>{error}</div>
        )}

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Memuat notifikasi...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔔</div>
            <div className={styles.emptyTitle}>Tidak ada notifikasi</div>
            <div className={styles.emptyDesc}>
              {searchQuery
                ? `Tidak ditemukan notifikasi untuk "${searchQuery}"`
                : "Belum ada aktivitas yang perlu diperhatikan"}
            </div>
          </div>
        ) : (
          <div className={styles.notifList}>
            {filtered.map((n, idx) => (
              <div
                key={n._id}
                className={`${styles.notifItem} ${
                  !n.read ? styles.notifUnread : ""
                }`}
                onClick={() => markOneRead(n)}
              >
                {/* Unread line */}
                {!n.read && <div className={styles.unreadLine} />}

                {/* Icon */}
                <div
                  className={styles.notifIcon}
                  style={{ background: n.iconBg }}
                >
                  {n.icon}
                </div>

                {/* Body */}
                <div className={styles.notifBody}>
                  <div className={styles.notifTop}>
                    <span className={styles.notifTitle}>{n.title}</span>
                    <span
                      className={`${styles.catTag} ${
                        styles[
                          "cat" +
                            n.category.replace(/[^a-zA-Z]/g, "")
                        ] ?? ""
                      }`}
                    >
                      {n.category}
                    </span>
                  </div>
                  <div className={styles.notifDesc}>{n.desc}</div>
                  <div className={styles.notifMeta}>
                    <span className={styles.notifTime}>{n.time}</span>
                    {!n.read && (
                      <span className={styles.notifNewTag}>Baru</span>
                    )}
                  </div>
                </div>

                {/* Dot */}
                {!n.read && <div className={styles.dotUnread} />}
              </div>
            ))}
          </div>
        )}

        {/* Result count */}
        {!loading && filtered.length > 0 && (
          <div className={styles.resultCount}>
            Menampilkan {filtered.length} dari {notifs.length} notifikasi
          </div>
        )}
      </div>
    </div>
  );
}