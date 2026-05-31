"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./notifikasi.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Category = "Semua" | "Lost & Found" | "Aspirasi" | "User" | "Sistem";
type ReadFilter = "Semua" | "Belum Dibaca" | "Sudah Dibaca";

interface NotifItem {
  _id: string;
  title: string;
  desc: string;
  category: Category;
  icon: string;
  iconBg: string;
  read: boolean;
  time?: string;
}

export default function NotifikasiPage() {
  const router = useRouter();

  const [data, setData] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState<Category>("Semua");
  const [readFilter, setReadFilter] = useState<ReadFilter>("Semua");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token || !user) router.push("/login");
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/notifikasi`, {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const markAsRead = async (id: string) => {
    const token = localStorage.getItem("token");
    await fetch(`${API_BASE}/api/notifikasi/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    fetchData();
  };

  // ✅ Fungsi delete notifikasi
  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");

    console.log("🗑️ DELETE id:", id); // ← cek id yang dikirim

    const res = await fetch(`${API_BASE}/api/dashboard/notifikasi/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    console.log("🗑️ DELETE response:", json); // ← cek response backend

    fetchData();
  };

  const filtered = useMemo(() => {
    return data.filter((n) => {
      const matchCategory =
        category === "Semua" || n.category === category;

      const matchRead =
        readFilter === "Semua"
          ? true
          : readFilter === "Belum Dibaca"
            ? !n.read
            : n.read;

      const matchSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.desc.toLowerCase().includes(search.toLowerCase());

      return matchCategory && matchRead && matchSearch;
    });
  }, [data, category, readFilter, search]);

  // ✅ countCategory sekarang ikut readFilter yang aktif
  const countCategory = (cat: Category) => {
    const base = data.filter((n) => {
      const matchRead =
        readFilter === "Semua"
          ? true
          : readFilter === "Belum Dibaca"
            ? !n.read
            : n.read;
      return matchRead;
    });

    return cat === "Semua"
      ? base.length
      : base.filter((d) => d.category === cat).length;
  };

  const countRead = (type: ReadFilter) => {
    if (type === "Semua") return data.length;
    if (type === "Belum Dibaca") return data.filter((d) => !d.read).length;
    return data.filter((d) => d.read).length;
  };

  const tagClass: Record<string, string> = {
    "Lost & Found": styles.tagLostFound,
    "Aspirasi": styles.tagAspirasi,
    "User": styles.tagUser,
    "Sistem": styles.tagSistem,
  };
  return (


    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>🔔 Notifikasi</h1>
          <p>Aktivitas sistem terbaru untuk admin</p>
        </div>
        <button onClick={fetchData} className={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      {/* SEARCH */}
      <input
        className={styles.search}
        placeholder="Cari notifikasi..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* READ FILTER */}
      <div className={styles.filterRow}>
        {(["Semua", "Belum Dibaca", "Sudah Dibaca"] as ReadFilter[]).map(
          (f) => (
            <button
              key={f}
              onClick={() => setReadFilter(f)}
              className={`${styles.chip} ${readFilter === f ? styles.activeChip : ""
                }`}
            >
              {f}
              <span>{countRead(f)}</span>
            </button>
          )
        )}
      </div>

      {/* CATEGORY FILTER */}
      <div className={styles.filterRow}>
        {(
          ["Semua", "Lost & Found", "Aspirasi", "User", "Sistem"] as Category[]
        ).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`${styles.chip} ${category === cat ? styles.activeChip : ""
              }`}
          >
            {cat}
            {/* ✅ angka category sekarang ikut readFilter */}
            <span>{countCategory(cat)}</span>
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className={styles.container}>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>Tidak ada notifikasi</div>
        ) : (
          filtered.map((n) => (
            <div
              key={n._id}
              className={`${styles.card} ${!n.read ? styles.unread : ""}`}
              onClick={() => markAsRead(n._id)}
            >
              <div
                className={styles.icon}
                style={{ background: n.iconBg }}
              >
                {n.icon}
              </div>

              <div className={styles.content}>
                <div className={styles.top}>
                  <h3>{n.title}</h3>
                  <span className={`${styles.tag} ${tagClass[n.category] ?? ""}`}>
                    {n.category}
                  </span>
                </div>
                <p>{n.desc}</p>
                {n.time && (
                  <span className={styles.time}>{n.time}</span>
                )}
              </div>

              {/* ✅ Tombol delete */}
              <button
                className={styles.deleteBtn}
                onClick={(e) => deleteNotif(n._id, e)}
                title="Hapus notifikasi"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}