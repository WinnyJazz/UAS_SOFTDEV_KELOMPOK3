"use client";
import { useState, useEffect } from "react";
import styles from "./aspirasi-user.module.css";

// ─── Types ─────────────────────────────────────────────────
interface TimelineStep {
  _id: string;
  label: string;
  deskripsi: string;
  status: "done" | "active" | "pending";
  tanggal: string;
  urutan: number;
}

interface Pertanyaan {
  _id: string;
  teks: string;
  sesiId: string;
  urutan: number;
}

interface SesiAktif {
  _id: string;
  nama: string;
  bulan: number;
  tahun: number;
  pertanyaan: Pertanyaan[];
}

interface HasilRespons {
  _id: string;
  sesiId: string;
  namaSesi: string;
  namaAspirasi: string;
  hasilRespons: string;
  createdAt: string;
}

interface SesiWithHasil {
  _id: string;
  nama: string;
  bulan: number;
  tahun: number;
  hasil: HasilRespons[];
}

// ─── API Base ───────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Dummy fallbacks ────────────────────────────────────────
const DUMMY_TIMELINE: TimelineStep[] = [
  { _id: "1", label: "Pembukaan Aspirasi", deskripsi: "Form aspirasi dibuka untuk mahasiswa", status: "done", tanggal: "2026-01-01", urutan: 1 },
  { _id: "2", label: "Pengumpulan Data", deskripsi: "Rekap data aspirasi dari seluruh mahasiswa", status: "done", tanggal: "2026-02-15", urutan: 2 },
  { _id: "3", label: "Analisis & Rekap", deskripsi: "DPM menganalisis dan merekap seluruh aspirasi", status: "active", tanggal: "2026-05-01", urutan: 3 },
  { _id: "4", label: "Disampaikan ke Pihak Atas", deskripsi: "Hasil aspirasi disampaikan ke dekan/wakil dekan", status: "pending", tanggal: "", urutan: 4 },
  { _id: "5", label: "Tindak Lanjut", deskripsi: "Menunggu tindak lanjut dari pihak fakultas", status: "pending", tanggal: "", urutan: 5 },
];

const DUMMY_SESI_AKTIF: SesiAktif = {
  _id: "s1",
  nama: "Aspirasi Mei 2026",
  bulan: 5,
  tahun: 2026,
  pertanyaan: [
    { _id: "p1", teks: "Apa kendala yang Anda alami selama perkuliahan?", sesiId: "s1", urutan: 1 },
    { _id: "p2", teks: "Apa saran Anda untuk meningkatkan kualitas pembelajaran di fakultas?", sesiId: "s1", urutan: 2 },
    { _id: "p3", teks: "Apakah Anda merasa fasilitas kampus sudah memadai? Jelaskan.", sesiId: "s1", urutan: 3 },
    { _id: "p4", teks: "Bagaimana kondisi fasilitas di kampus?", sesiId: "s1", urutan: 4 },
    { _id: "p5", teks: "Adakah aspirasi lain yang ingin Anda sampaikan kepada DPM?", sesiId: "s1", urutan: 5 },
  ],
};

const DUMMY_SESI_HASIL: SesiWithHasil[] = [
  {
    _id: "s_jan", nama: "Aspirasi Januari 2026", bulan: 1, tahun: 2026,
    hasil: [
      { _id: "h1", sesiId: "s_jan", namaSesi: "Aspirasi Januari 2026", namaAspirasi: "Kendala terkait manajemen media sosial FTI Untar dan LINTAR", hasilRespons: "Meskipun media sosial FTI Untar dan Lintar sudah dikelola dengan baik, keterbatasan SDM tetap menjadi kendala utama dalam menghasilkan konten yang konsisten.", createdAt: "2026-05-10" },
      { _id: "h2", sesiId: "s_jan", namaSesi: "Aspirasi Januari 2026", namaAspirasi: "Kendala mahasiswa terkait kegiatan kemahasiswaan", hasilRespons: "Fakultas telah menyelenggarakan berbagai seminar dan webinar terkait hardskill untuk mendukung pengembangan kompetensi mahasiswa.", createdAt: "2026-05-10" },
    ],
  },
  { _id: "s_feb", nama: "Aspirasi Februari 2026", bulan: 2, tahun: 2026, hasil: [] },
  { _id: "s_mar", nama: "Aspirasi Maret 2026", bulan: 3, tahun: 2026, hasil: [] },
  { _id: "s_apr", nama: "Aspirasi April 2026", bulan: 4, tahun: 2026, hasil: [] },
];

// ─── Main Component ─────────────────────────────────────────
export default function UserAspirasiPage() {
  const [activeTab, setActiveTab] = useState<"timeline" | "form" | "hasil">("timeline");

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <p className={styles.pageLabel}>ASPIRASI USER</p>

        <div className={styles.tabBar}>
          {[
            { key: "timeline", label: "TIMELINE & STATUS" },
            { key: "form", label: "ISI FORM" },
            { key: "hasil", label: "HASIL" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {activeTab === "timeline" && <TimelineTab />}
          {activeTab === "form" && <IsiFormTab />}
          {activeTab === "hasil" && <HasilTab />}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TAB 1 — TIMELINE (read-only)
// ══════════════════════════════════════════════════════════
function TimelineTab() {
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/aspirasi/timeline`)
      .then((r) => r.json())
      .then((data) => setSteps(data.sort((a: TimelineStep, b: TimelineStep) => a.urutan - b.urutan)))
      .catch(() => setSteps(DUMMY_TIMELINE))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) =>
    s === "done" ? "#4caf50" : s === "active" ? "#a855f7" : "#9ca3af";

  const statusLabel = (s: string) =>
    s === "done" ? "✅ Selesai" : s === "active" ? "🔄 Sedang Berjalan" : "⏳ Menunggu";

  if (loading) return <div className={styles.loading}>Memuat timeline...</div>;

  return (
    <div className={styles.timelineWrapper}>
      <h2 className={styles.sectionTitle}>Timeline Progress DPM</h2>

      <div className={styles.timelineTrack}>
        {steps.map((step, i) => (
          <div key={step._id} className={styles.timelineItem}>
            <div className={styles.timelineLine}>
              <div
                className={styles.timelineDot}
                style={{ background: statusColor(step.status) }}
              />
              {i < steps.length - 1 && <div className={styles.timelineConnector} />}
            </div>
            <div className={styles.timelineCard}>
              <div className={styles.timelineCardHeader}>
                <span className={styles.timelineStep}>Tahap {step.urutan}</span>
              </div>
              <h3 className={styles.timelineLabel}>{step.label}</h3>
              <p className={styles.timelineDesc}>{step.deskripsi}</p>
              <div className={styles.timelineMeta}>
                <span
                  className={styles.statusBadge}
                  style={{
                    background: statusColor(step.status) + "22",
                    color: statusColor(step.status),
                  }}
                >
                  {statusLabel(step.status)}
                </span>
                {step.tanggal && (
                  <span className={styles.tanggalBadge}>
                    📅{" "}
                    {new Date(step.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TAB 2 — ISI FORM (sesi aktif = bulan & tahun sekarang)
// ══════════════════════════════════════════════════════════
function IsiFormTab() {
  const [sesiAktif, setSesiAktif] = useState<SesiAktif | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const QS_PER_PAGE = 2;

  useEffect(() => {
    // Ambil semua sesi, cari yang bulan & tahun sesuai sekarang
    fetch(`${API}/api/aspirasi/sesi`)
      .then((r) => r.json())
      .then((data: SesiAktif[]) => {
        const now = new Date();
        const bulan = now.getMonth() + 1;
        const tahun = now.getFullYear();
        // Cari sesi dengan bulan & tahun yang sama; fallback ke sesi terakhir
        const aktif =
          data.find((s) => s.bulan === bulan && s.tahun === tahun) ||
          data[data.length - 1] ||
          null;
        setSesiAktif(aktif);
      })
      .catch(() => setSesiAktif(DUMMY_SESI_AKTIF))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!sesiAktif) return;
    setSubmitting(true);
    setError("");

    // Submit satu jawaban per pertanyaan
    try {
      const submissions = sesiAktif.pertanyaan.map((p) =>
        fetch(`${API}/api/aspirasi/jawaban`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pertanyaanId: p._id,
            sesiId: sesiAktif._id,
            jawaban: answers[p._id] || "",
            // nim & nama bisa diambil dari auth/context jika tersedia
          }),
        })
      );
      await Promise.all(submissions);
      setSubmitted(true);
    } catch {
      setError("Gagal mengirim aspirasi. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Memuat form...</div>;

  if (!sesiAktif) {
    return (
      <div className={styles.formCard}>
        <div className={styles.emptyForm}>
          <span className={styles.emptyIcon}>📭</span>
          <p>Belum ada sesi aspirasi yang aktif saat ini.</p>
          <p className={styles.emptySubtitle}>Pantau terus untuk informasi sesi berikutnya.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.formCard}>
        <div className={styles.successState}>
          <div className={styles.successIcon}>✅</div>
          <h3 className={styles.successTitle}>Aspirasi Terkirim!</h3>
          <p className={styles.successSub}>
            Terima kasih telah menyampaikan aspirasi Anda untuk{" "}
            <strong>{sesiAktif.nama}</strong>.<br />
            DPM akan menindaklanjuti dengan sebaik mungkin.
          </p>
        </div>
      </div>
    );
  }

  const total = sesiAktif.pertanyaan.length;
  const totalPages = Math.ceil(total / QS_PER_PAGE);
  const start = currentPage * QS_PER_PAGE;
  const end = Math.min(start + QS_PER_PAGE, total);
  const currentQs = sesiAktif.pertanyaan.slice(start, end);
  const isLast = currentPage === totalPages - 1;

  return (
    <div className={styles.formCard}>
      {/* Sesi info bar */}
      <div className={styles.sesiInfoBar}>
        <span className={styles.sesiActiveBadge}>AKTIF</span>
        <span className={styles.sesiInfoName}>📋 {sesiAktif.nama}</span>
      </div>

      {/* Pertanyaan */}
      <div className={styles.questionList}>
        {currentQs.map((p, i) => (
          <div key={p._id} className={styles.questionBlock}>
            <div className={styles.qLabel}>
              <span className={styles.qNum}>{start + i + 1}</span>
              <span>{p.teks}</span>
            </div>
            <textarea
              className={styles.qTextarea}
              placeholder="Tulis jawaban Anda di sini..."
              rows={3}
              value={answers[p._id] || ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [p._id]: e.target.value }))
              }
            />
            <p className={styles.charCount}>{(answers[p._id] || "").length} karakter</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {/* Navigation */}
      <div className={styles.formNav}>
        <button
          className={styles.navCircle}
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 0}
        >
          ‹
        </button>
        <span className={styles.pageIndicator}>
          {currentPage + 1} / {totalPages}
        </span>
        <button
          className={styles.navCircle}
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={isLast}
        >
          ›
        </button>
      </div>

      {isLast && (
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Mengirim..." : "Kirim Aspirasi"}
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TAB 3 — HASIL (read-only, per sesi accordion)
// ══════════════════════════════════════════════════════════
function HasilTab() {
  const [sesiList, setSesiList] = useState<SesiWithHasil[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSesi, setOpenSesi] = useState<string | null>(null);

  useEffect(() => {
    // Fetch semua sesi, lalu fetch hasil per sesi
    Promise.all([
      fetch(`${API}/api/aspirasi/sesi`).then((r) => r.json()),
      fetch(`${API}/api/aspirasi/hasil`).then((r) => r.json()),
    ])
      .then(([sesiData, hasilData]: [SesiAktif[], HasilRespons[]]) => {
        const merged: SesiWithHasil[] = sesiData.map((sesi) => ({
          _id: sesi._id,
          nama: sesi.nama,
          bulan: sesi.bulan,
          tahun: sesi.tahun,
          hasil: hasilData.filter((h) => h.sesiId === sesi._id),
        }));
        setSesiList(merged);
      })
      .catch(() => setSesiList(DUMMY_SESI_HASIL))
      .finally(() => setLoading(false));
  }, []);

  const toggleSesi = (id: string) =>
    setOpenSesi((prev) => (prev === id ? null : id));

  if (loading) return <div className={styles.loading}>Memuat hasil...</div>;

  return (
    <div className={styles.hasilWrapper}>
      {sesiList.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📭</span>
          <p>Belum ada hasil aspirasi.</p>
        </div>
      )}

      {sesiList.map((sesi) => (
        <div key={sesi._id} className={styles.responseSesiCard}>
          <div className={styles.responseSesiHeader}>
            <div className={styles.responseSesiTitle}>
              <span>📋</span>
              <span className={styles.responseSesiName}>{sesi.nama}</span>
              {sesi.hasil.length > 0 && (
                <span className={styles.hasilCountBadge}>{sesi.hasil.length}</span>
              )}
            </div>
            <button
              className={styles.seeDetailsBtn}
              onClick={() => toggleSesi(sesi._id)}
            >
              {openSesi === sesi._id ? "TUTUP" : "LIHAT DETAIL"}
            </button>
          </div>

          {openSesi === sesi._id && (
            <div className={styles.responseDetails}>
              {sesi.hasil.length === 0 ? (
                <p className={styles.emptyDetail}>
                  Belum ada hasil aspirasi untuk sesi ini.
                </p>
              ) : (
                sesi.hasil.map((h) => (
                  <div key={h._id} className={styles.responseDetailCard}>
                    <h4 className={styles.detailTitle}>{h.namaAspirasi}</h4>
                    <p className={styles.detailDate}>
                      {new Date(h.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className={styles.detailBody}>{h.hasilRespons}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
