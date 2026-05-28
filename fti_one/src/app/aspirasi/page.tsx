"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./aspirasi-user.module.css";

interface UserData {
  userId: string;
  nama: string;
  email: string;
  nim: string;
  role: string;
}

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

interface UserJawaban {
  _id: string;
  pertanyaanId: {
    _id: string;
    teks: string;
  };
  sesiId: {
    _id: string;
    nama: string;
    bulan: number;
    tahun: number;
  };
  nim: string;
  nama: string;
  jawaban: string;
  createdAt: string;
}

// ─── API Base ───────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Main Component ─────────────────────────────────────────
export default function UserAspirasiPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"timeline" | "form" | "hasil" | "history">("timeline");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      // Redirect to login if not authenticated
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setLoading(false);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  if (loading) {
    return <div className={styles.loading}><span className={styles.spinner} />Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <p className={styles.pageLabel}>ASPIRASI MAHASISWA</p>

        <div className={styles.tabBar}>
          {[
            { key: "timeline", label: "TIMELINE & STATUS" },
            { key: "form", label: "ISI FORM" },
            { key: "hasil", label: "HASIL" },
            { key: "history", label: "HISTORY" },
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
          {activeTab === "history" && <HistoryTab user={user} />}
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
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/aspirasi/timeline`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: TimelineStep[]) =>
        setSteps(data.sort((a, b) => a.urutan - b.urutan))
      )
      .catch(() => setError("Gagal memuat timeline. Coba lagi nanti."))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) =>
    s === "done" ? "#4caf50" : s === "active" ? "#a855f7" : "#9ca3af";

  const statusLabel = (s: string) =>
    s === "done" ? "✅ Selesai" : s === "active" ? "🔄 Sedang Berjalan" : "⏳ Menunggu";

  if (loading) return <div className={styles.loading}><span className={styles.spinner} />Memuat timeline...</div>;

  if (error) return (
    <div className={styles.errorState}>
      <span className={styles.errorIcon}>⚠️</span>
      <p>{error}</p>
    </div>
  );

  if (steps.length === 0) return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>📋</span>
      <p>Belum ada data timeline.</p>
    </div>
  );

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
// TAB 2 — ISI FORM (fetch /sesi/aktif)
// ══════════════════════════════════════════════════════════
function IsiFormTab() {
  const [sesiAktif, setSesiAktif] = useState<SesiAktif | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const QS_PER_PAGE = 2;

  useEffect(() => {
    fetch(`${API}/api/aspirasi/sesi/aktif`)
      .then((r) => {
        if (r.status === 404) {
          setSesiAktif(null);
          return null;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data) setSesiAktif(data);
      })
      .catch(() => setError("Gagal memuat form aspirasi. Coba lagi nanti."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!sesiAktif) return;

    // ── Validasi: semua pertanyaan harus diisi ──
    const kosong = sesiAktif.pertanyaan.filter(
      (p) => !answers[p._id] || answers[p._id].trim().length === 0
    );

    if (kosong.length > 0) {
      setSubmitError(
        `Harap isi semua pertanyaan terlebih dahulu. (${kosong.length} belum diisi)`
      );
      // Lompat ke halaman yang berisi pertanyaan kosong pertama
      const indexKosong = sesiAktif.pertanyaan.findIndex(
        (p) => !answers[p._id] || answers[p._id].trim().length === 0
      );
      setCurrentPage(Math.floor(indexKosong / QS_PER_PAGE));
      return;
    }

    setSubmitting(true);
    setSubmitError("");


    try {
      const submissions = sesiAktif.pertanyaan.map((p) =>
        fetch(`${API}/api/aspirasi/jawaban`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pertanyaanId: p._id,
            sesiId: sesiAktif._id,
            jawaban: answers[p._id] || "",
            nim: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "{}").nim : "",
            nama: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "{}").nama : "",
            userId: localStorage.getItem("token")
              ? JSON.parse(atob(localStorage.getItem("token")!.split(".")[1])).userId
              : "",
          }),
        }).then((r) => {
          if (!r.ok) throw new Error(`Gagal submit pertanyaan ${p._id}`);
          return r.json();
        })
      );

      await Promise.all(submissions);
      setSubmitted(true);
    } catch {
      setSubmitError("Gagal mengirim aspirasi. Periksa koneksi dan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}><span className={styles.spinner} />Memuat form...</div>;

  if (error) return (
    <div className={styles.formCard}>
      <div className={styles.errorState}>
        <span className={styles.errorIcon}>⚠️</span>
        <p>{error}</p>
      </div>
    </div>
  );

  if (!sesiAktif) return (
    <div className={styles.formCard}>
      <div className={styles.emptyForm}>
        <span className={styles.emptyIcon}>📭</span>
        <p>Belum ada sesi aspirasi yang aktif saat ini.</p>
        <p className={styles.emptySubtitle}>Pantau terus untuk informasi sesi berikutnya.</p>
      </div>
    </div>
  );

  if (submitted) return (
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

  const total = sesiAktif.pertanyaan.length;
  const totalPages = Math.ceil(total / QS_PER_PAGE);
  const start = currentPage * QS_PER_PAGE;
  const end = Math.min(start + QS_PER_PAGE, total);
  const currentQs = sesiAktif.pertanyaan.slice(start, end);
  const isLast = currentPage === totalPages - 1;

  // progress bar fill
  const filledCount = Object.values(answers).filter((v) => v.trim().length > 0).length;
  const progress = total > 0 ? Math.round((filledCount / total) * 100) : 0;

  return (
    <div className={styles.formCard}>
      {/* Sesi info bar */}
      <div className={styles.sesiInfoBar}>
        <span className={styles.sesiActiveBadge}>AKTIF</span>
        <span className={styles.sesiInfoName}>📋 {sesiAktif.nama}</span>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBarWrap}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.progressLabel}>{filledCount}/{total} dijawab</span>
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
              style={
                submitError && (!answers[p._id] || answers[p._id].trim().length === 0)
                  ? { borderColor: "#ef4444" }
                  : {}
              }
              placeholder="Tulis jawaban Anda di sini..."
              rows={3}
              value={answers[p._id] || ""}
              onChange={(e) => {
                setAnswers((prev) => ({ ...prev, [p._id]: e.target.value }));
                if (submitError) setSubmitError(""); // hapus error kalau mulai diisi
              }}
            />
            <p className={styles.charCount}>{(answers[p._id] || "").length} karakter</p>
          </div>
        ))}
      </div>

      {/* Submit error */}
      {submitError && <p className={styles.errorMsg}>{submitError}</p>}

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
// TAB 3 — HASIL (read-only accordion)
// ══════════════════════════════════════════════════════════
function HasilTab() {
  const [sesiList, setSesiList] = useState<SesiWithHasil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSesi, setOpenSesi] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/aspirasi/sesi`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetch(`${API}/api/aspirasi/hasil`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
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
      .catch(() => setError("Gagal memuat hasil aspirasi. Coba lagi nanti."))
      .finally(() => setLoading(false));
  }, []);

  const toggleSesi = (id: string) =>
    setOpenSesi((prev) => (prev === id ? null : id));

  if (loading) return <div className={styles.loading}><span className={styles.spinner} />Memuat hasil...</div>;

  if (error) return (
    <div className={styles.errorState}>
      <span className={styles.errorIcon}>⚠️</span>
      <p>{error}</p>
    </div>
  );

  if (sesiList.length === 0) return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>📭</span>
      <p>Belum ada data sesi aspirasi.</p>
    </div>
  );

  return (
    <div className={styles.hasilWrapper}>
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

// ══════════════════════════════════════════════════════════
// TAB 4 — HISTORY (user's submitted answers)
// ══════════════════════════════════════════════════════════
interface HistoryTabProps {
  user: UserData | null;
}

function HistoryTab({ user }: HistoryTabProps) {
  const [jawaban, setJawaban] = useState<UserJawaban[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.nim) {
      setError("Data pengguna tidak ditemukan.");
      setLoading(false);
      return;
    }

    fetch(`${API}/api/aspirasi/jawaban?nim=${user.nim}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: UserJawaban[]) => {
        setJawaban(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      })
      .catch(() => setError("Gagal memuat history aspirasi. Coba lagi nanti."))
      .finally(() => setLoading(false));
  }, [user?.nim]);

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const groupBySesi = (data: UserJawaban[]) => {
    return data.reduce((acc: Record<string, UserJawaban[]>, item) => {
      const key = item.sesiId._id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  };

  if (loading) return <div className={styles.loading}><span className={styles.spinner} />Memuat history...</div>;

  if (error) return (
    <div className={styles.errorState}>
      <span className={styles.errorIcon}>⚠️</span>
      <p>{error}</p>
    </div>
  );

  if (jawaban.length === 0) return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>📝</span>
      <p>Anda belum mengirim aspirasi apapun.</p>
    </div>
  );

  const grouped = groupBySesi(jawaban);
  const sesiList = Object.entries(grouped).map(([sesiId, answers]) => ({
    sesiId,
    ...answers[0].sesiId,
    answers,
  }));

  return (
    <div className={styles.historyWrapper}>
      <h2 className={styles.sectionTitle}>History Aspirasi Anda</h2>

      {sesiList.map((sesi) => (
        <div key={sesi.sesiId} className={styles.historySesiCard}>
          <div className={styles.historySesiHeader}>
            <div className={styles.historySesiTitle}>
              <span>📋</span>
              <div className={styles.historySesiInfo}>
                <span className={styles.historySesiName}>{sesi.nama}</span>
              </div>
            </div>
            <span className={styles.historyCountBadge}>{sesi.answers.length} jawaban</span>
          </div>

          <div className={styles.historyAnswersList}>
            {sesi.answers.map((answer, idx) => (
              <div key={answer._id} className={styles.historyAnswerCard}>
                <div
                  className={styles.historyAnswerHeader}
                  onClick={() => toggleExpand(answer._id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.historyAnswerQuestion}>
                    <span className={styles.historyQNum}>{idx + 1}</span>
                    <span className={styles.historyQText}>{answer.pertanyaanId.teks}</span>
                  </div>
                  <div className={styles.historyAnswerMeta}>
                    <span className={styles.historySubmitDate}>
                      {new Date(answer.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })} {new Date(answer.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      className={styles.expandBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(answer._id);
                      }}
                    >
                      {expandedId === answer._id ? "▼" : "▶"}
                    </button>
                  </div>
                </div>

                {expandedId === answer._id && (
                  <div className={styles.historyAnswerBody}>
                    <p>{answer.jawaban}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
