"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./notifikasi.module.css";

type Category = "Semua" | "Info" | "Lost & Found" | "Aspirasi" | "Sistem";

type ReadFilter = "Semua" | "Belum Dibaca" | "Sudah Dibaca";

interface NotifItem {
  _id: string;
  title: string;
  desc: string;
  category: Exclude<Category, "Semua">;
  icon: string;
  iconBg: string;
  read: boolean;
  createdAt?: string;
  time?: string;
}

export default function NotifikasiUserPage() {
  const router = useRouter();

  const [data, setData] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState<Category>("Semua");
  const [readFilter, setReadFilter] = useState<ReadFilter>("Semua");
  const [search, setSearch] = useState("");

  // CEK LOGIN
  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");

    if (!token || !stored) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(stored);

      // kalau admin masuk ke page user
      if (user.role === "admin" || user.role === "superadmin") {
        router.push("/admin/notifikasi");
      }
    } catch (err) {
      console.error(err);
      router.push("/login");
    }
  }, [router]);

  // FETCH DATA
  const fetchData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      console.log("📡 [fetchData] token:", token ? "✅ ada" : "❌ tidak ada");

      const res = await fetch("http://localhost:5000/api/notifikasi/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("📡 [fetchData] response status:", res.status);
      console.log("📡 [fetchData] content-type:", res.headers.get("content-type"));
      

      const json = await res.json();
      console.log("📡 [fetchData] response json:", json);
      console.log("📡 [fetchData] data array:", json.data);

      const formatted: NotifItem[] = (json.data || []).map((item: any) => ({
        ...item,
        time: item.createdAt
          ? new Date(item.createdAt).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "",
      }));

      console.log("📡 [fetchData] formatted data:", formatted);
      setData(formatted);
    } catch (err) {
      console.error("❌ Fetch notif error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // MARK AS READ
  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      await fetch(`http://localhost:5000/api/notifikasi/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE NOTIF
  const deleteNotif = async (
    id: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();

    try {
      const token = localStorage.getItem("token");

      await fetch(`http://localhost:5000/api/notifikasi/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // FILTER DATA
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

  // COUNT CATEGORY
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

  // COUNT READ
  const countRead = (type: ReadFilter) => {
    if (type === "Semua") return data.length;

    if (type === "Belum Dibaca") {
      return data.filter((d) => !d.read).length;
    }

    return data.filter((d) => d.read).length;
  };

  // TAG STYLE
  const tagClass: Record<string, string> = {
    Info: styles.tagInfo,
    "Lost & Found": styles.tagLostFound,
    Aspirasi: styles.tagAspirasi,
    Sistem: styles.tagSistem,
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>🔔 Notifikasi</h1>
          <p>Aktivitas terbaru untuk kamu</p>
        </div>

        <button
          onClick={fetchData}
          className={styles.refreshBtn}
        >
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

      {/* FILTER READ */}
      <div className={styles.filterRow}>
        {(
          ["Semua", "Belum Dibaca", "Sudah Dibaca"] as ReadFilter[]
        ).map((f) => (
          <button
            key={f}
            onClick={() => setReadFilter(f)}
            className={`${styles.chip} ${
              readFilter === f ? styles.activeChip : ""
            }`}
          >
            {f}
            <span>{countRead(f)}</span>
          </button>
        ))}
      </div>

      {/* FILTER CATEGORY */}
      <div className={styles.filterRow}>
        {(
          ["Semua", "Info", "Lost & Found", "Aspirasi", "Sistem"] as Category[]
        ).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`${styles.chip} ${
              category === cat ? styles.activeChip : ""
            }`}
          >
            {cat}
            <span>{countCategory(cat)}</span>
          </button>
        ))}
      </div>

      {/* LIST NOTIF */}
      <div className={styles.container}>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            Tidak ada notifikasi
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n._id}
              className={`${styles.card} ${
                !n.read ? styles.unread : ""
              }`}
              onClick={() => markAsRead(n._id)}
            >
              {/* ICON */}
              <div
                className={styles.icon}
                style={{ background: n.iconBg }}
              >
                {n.icon}
              </div>

              {/* CONTENT */}
              <div className={styles.content}>
                <div className={styles.top}>
                  <h3>{n.title}</h3>

                  <span
                    className={`${styles.tag} ${
                      tagClass[n.category] ?? ""
                    }`}
                  >
                    {n.category}
                  </span>
                </div>

                <p>{n.desc}</p>

                {n.time && (
                  <span className={styles.time}>
                    {n.time}
                  </span>
                )}
              </div>

              {/* DELETE */}
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