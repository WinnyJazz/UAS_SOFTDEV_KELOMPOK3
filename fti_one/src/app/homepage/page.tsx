"use client";

import { useEffect, useState } from "react";
import styles from "./homepage.module.css";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface BarangInfo {
  barangId: string;
  nama: string;
  lokasi: string;
  foto: string | null;
}

interface Claim {
  claimId: string;
  barangId: BarangInfo;
  nama: string;
  nim: string;
  status: "pending" | "disetujui" | "ditolak";
  namaBarang: string;
  lokasiBarang: string;
  createdAt: string;
}

interface Jawaban {
  _id: string;
  sesiId: { _id: string; nama: string; bulan: number; tahun: number };
  pertanyaanId: { _id: string; teks: string };
  teks: string;
  jawaban: string;
  createdAt: string;
}

interface AsirasiSesi {
  sesiId: string;
  nama: string;
  jumlahJawaban: number;
  tanggal: string;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchJSON<T>(url: string, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function groupBySesi(jawabanList: Jawaban[]): AsirasiSesi[] {
  const map = new Map<string, AsirasiSesi>();
  for (const j of jawabanList) {
    const sesi = j.sesiId;
    if (!sesi) continue;
    const key = sesi._id;
    if (!map.has(key)) {
      map.set(key, {
        sesiId: key,
        nama: sesi.nama,
        jumlahJawaban: 0,
        tanggal: j.createdAt,
      });
    }
    map.get(key)!.jumlahJawaban += 1;
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
  );
}

/* ─────────────────────────────────────────────
   BADGE
───────────────────────────────────────────── */
function Badge({ status }: { status: string }) {
  const classMap: Record<string, string> = {
    pending:   `${styles.badge} ${styles["badge--pending"]}`,
    disetujui: `${styles.badge} ${styles["badge--disetujui"]}`,
    ditolak:   `${styles.badge} ${styles["badge--ditolak"]}`,
    selesai:   `${styles.badge} ${styles["badge--selesai"]}`,
  };
  const label: Record<string, string> = {
    pending: "Pending", disetujui: "Disetujui", ditolak: "Ditolak", selesai: "Selesai",
  };
  return (
    <span className={classMap[status] ?? `${styles.badge} ${styles["badge--pending"]}`}>
      {label[status] ?? status}
    </span>
  );
}

/* ─────────────────────────────────────────────
   SKELETON ROW
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className={styles["item-card"]} aria-hidden="true">
      <div className={styles.skeleton} style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className={styles.skeleton} style={{ height: 14, width: "60%", borderRadius: 6 }} />
        <div className={styles.skeleton} style={{ height: 12, width: "40%", borderRadius: 6 }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODAL DETAIL ASPIRASI
───────────────────────────────────────────── */
interface ModalProps {
  sesi: AsirasiSesi;
  jawabanAll: Jawaban[];
  onClose: () => void;
}

function DetailAsirasiModal({ sesi, jawabanAll, onClose }: ModalProps) {
  const detail = jawabanAll.filter((j) => j.sesiId?._id === sesi.sesiId);

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["modal-box"]} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <div>
            <p className={styles["modal-label"]}>Detail Aspirasi</p>
            <h2 className={styles["modal-title"]}>{sesi.nama}</h2>
          </div>
          <button className={styles["modal-close"]} onClick={onClose} aria-label="Tutup">✕</button>
        </div>

        <div className={styles["modal-body"]}>
          {detail.length === 0 ? (
            <p className={styles["modal-empty"]}>Tidak ada jawaban ditemukan.</p>
          ) : (
            detail.map((j, i) => (
              <div key={j._id} className={styles["modal-qa"]}>
                <p className={styles["modal-q"]}>
                  <span className={styles["modal-qnum"]}>{i + 1}</span>
                  {j.pertanyaanId?.teks ?? "Pertanyaan tidak tersedia"}
                </p>
                <p className={styles["modal-a"]}>{j.jawaban || j.teks || "—"}</p>
              </div>
            ))
          )}
        </div>

        <div className={styles["modal-footer"]}>
          <span className={styles["modal-meta"]}>{detail.length} jawaban • {formatDate(sesi.tanggal)}</span>
          <button className={styles["modal-close-btn"]} onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function HomePage() {
  const [tab, setTab] = useState<"aspirasi" | "klaim">("aspirasi");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sesiList, setSesiList] = useState<AsirasiSesi[]>([]);
  const [jawabanAll, setJawabanAll] = useState<Jawaban[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSesi, setSelectedSesi] = useState<AsirasiSesi | null>(null);

  const token =
    typeof window !== "undefined" ? (localStorage.getItem("token") ?? "") : "";

  const userId = (() => {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId ?? payload._id ?? payload.id ?? null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const jawabanUrl = userId
          ? `/api/aspirasi/jawaban?userId=${userId}`
          : "/api/aspirasi/jawaban";

        const [claimData, jawabanData] = await Promise.all([
          fetchJSON<Claim[]>("/api/claim/mine", token),
          fetchJSON<Jawaban[]>(jawabanUrl, token),
        ]);
        setClaims(claimData);
        setJawabanAll(jawabanData);
        setSesiList(groupBySesi(jawabanData));
      } catch {
        setError("Gagal memuat data. Coba refresh halaman.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, userId]);

  const claimDisetujui = claims.filter((c) => c.status === "disetujui").length;
  const claimPending   = claims.filter((c) => c.status === "pending").length;
  const nama = claims[0]?.nama ?? "Mahasiswa";

  return (
    <main className={styles.homepage}>

      {/* ── Modal ── */}
      {selectedSesi && (
        <DetailAsirasiModal
          sesi={selectedSesi}
          jawabanAll={jawabanAll}
          onClose={() => setSelectedSesi(null)}
        />
      )}

      <div className={styles.inner}>

        {/* ── Greeting ── */}
        <div className={styles["homepage__greeting"]}>
          <h1 className={styles["homepage__greeting-hello"]}>Selamat datang, {nama} 👋</h1>
          <p className={styles["homepage__greeting-sub"]}>
            Berikut ringkasan aktivitas kamu di portal mahasiswa.
          </p>
        </div>

        {/* ── Stats ── */}
        <div className={styles["homepage__stats"]}>
          <div className={styles["stat-card"]}>
            <p className={styles["stat-card__label"]}>Total aspirasi</p>
            <p className={styles["stat-card__value"]}>
              {sesiList.reduce((a, s) => a + s.jumlahJawaban, 0)}
            </p>
            <p className={styles["stat-card__sub"]}>{sesiList.length} sesi diikuti</p>
          </div>
          <div className={styles["stat-card"]}>
            <p className={styles["stat-card__label"]}>Klaim diajukan</p>
            <p className={styles["stat-card__value"]}>{claims.length}</p>
            <p className={styles["stat-card__sub"]}>{claimDisetujui} disetujui</p>
          </div>
          <div className={styles["stat-card"]}>
            <p className={styles["stat-card__label"]}>Klaim pending</p>
            <p className={styles["stat-card__value"]}>{claimPending}</p>
            <p className={styles["stat-card__sub"]}>Menunggu konfirmasi</p>
          </div>
        </div>

        {/* ── Card container ── */}
        <div className={styles.card}>

          {error && <p className={styles["error-notice"]}>{error}</p>}

          {/* ── Tabs ── */}
          <div className={styles["homepage__tabs"]} role="tablist">
            <button
              role="tab"
              aria-selected={tab === "aspirasi"}
              className={`${styles["tab-btn"]}${tab === "aspirasi" ? ` ${styles["tab-btn--active"]}` : ""}`}
              onClick={() => setTab("aspirasi")}
            >
              Riwayat aspirasi
            </button>
            <button
              role="tab"
              aria-selected={tab === "klaim"}
              className={`${styles["tab-btn"]}${tab === "klaim" ? ` ${styles["tab-btn--active"]}` : ""}`}
              onClick={() => setTab("klaim")}
            >
              Riwayat klaim
            </button>
          </div>

          {/* ── Panel: Aspirasi ── */}
          {tab === "aspirasi" && (
            <div role="tabpanel">
              {loading ? (
                <><SkeletonCard /><SkeletonCard /></>
              ) : sesiList.length === 0 ? (
                <div className={styles["empty-state"]}>
                  <span className={styles["empty-state__icon"]}>📋</span>
                  Belum ada aspirasi yang dikirim.
                </div>
              ) : (
                sesiList.map((s) => (
                  <div
                    key={s.sesiId}
                    className={`${styles["item-card"]} ${styles["item-card--clickable"]}`}
                    onClick={() => setSelectedSesi(s)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedSesi(s)}
                  >
                    <div
                      className={`${styles["item-card__icon"]} ${styles["item-card__icon--aspirasi"]}`}
                      aria-hidden="true"
                    >
                      📋
                    </div>
                    <div className={styles["item-card__body"]}>
                      <p className={styles["item-card__title"]}>{s.nama}</p>
                      <p className={styles["item-card__sub"]}>{s.jumlahJawaban} jawaban dikirim</p>
                    </div>
                    <div className={styles["item-card__right"]}>
                      <Badge status="selesai" />
                      <span className={styles["item-card__date"]}>{formatDate(s.tanggal)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Panel: Klaim ── */}
          {tab === "klaim" && (
            <div role="tabpanel">
              {loading ? (
                <><SkeletonCard /><SkeletonCard /></>
              ) : claims.length === 0 ? (
                <div className={styles["empty-state"]}>
                  <span className={styles["empty-state__icon"]}>📦</span>
                  Belum ada klaim yang diajukan.
                </div>
              ) : (
                <>
                  {claims.map((c) => {
                    const barang = typeof c.barangId === "object" ? c.barangId : null;
                    const namaBarang = barang?.nama ?? c.namaBarang;
                    const lokasi = barang?.lokasi ?? c.lokasiBarang;
                    const foto = barang?.foto ?? null;
                    return (
                      <div key={c.claimId} className={styles["item-card"]}>
                        <div className={`${styles["item-card__icon"]} ${styles["item-card__icon--claim"]}`}>
                          {foto ? (
                            <img
                              src={foto}
                              alt={namaBarang}
                              className={styles["item-card__foto"]}
                            />
                          ) : (
                            <span aria-hidden="true">📦</span>
                          )}
                        </div>
                        <div className={styles["item-card__body"]}>
                          <p className={styles["item-card__title"]}>{namaBarang}</p>
                          <p className={styles["item-card__sub"]}>{lokasi} • NIM: {c.nim}</p>
                        </div>
                        <div className={styles["item-card__right"]}>
                          <Badge status={c.status} />
                          <span className={styles["item-card__date"]}>{formatDate(c.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className={styles["info-box"]}>
                    ℹ️ Klaim yang disetujui harap diambil ke sekretariat dalam setelah konfirmasi.
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}