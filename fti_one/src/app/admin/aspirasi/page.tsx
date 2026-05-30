"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./aspirasi.module.css";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface UserData {
  userId: string;
  nama: string;
  email: string;
  nim: string;
  role: string;
}

interface Sesi {
  _id: string;
  nama: string;
  bulan: number;
  tahun: number;
  pertanyaan: Pertanyaan[];
  createdAt: string;
}

interface Pertanyaan {
  _id: string;
  teks: string;
  sesiId: string;
}

interface TimelineStep {
  _id: string;
  label: string;
  deskripsi: string;
  status: "done" | "active" | "pending";
  tanggal: string;
  urutan: number;
}

interface HasilRespons {
  _id: string;
  sesiId: string;
  namaSesi: string;
  namaAspirasi: string;
  hasilRespons: string;
  uploadedAt: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  variant?: "dark" | "light";
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "-- Pilih --",
  disabled = false,
  variant = "dark",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const wrapClass = [
    styles.customSelect,
    variant === "light" ? styles.customSelectLight : "",
    disabled ? styles.customSelectDisabled : "",
  ].filter(Boolean).join(" ");

  return (
    <div ref={ref} className={wrapClass}>
      <button
        type="button"
        className={styles.customSelectTrigger}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className={selected ? styles.customSelectValue : styles.customSelectPlaceholder}>
          {selected ? selected.label : placeholder}
        </span>
        <span className={`${styles.customSelectChevron} ${open ? styles.customSelectChevronOpen : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className={styles.customSelectDropdown}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.customSelectOption} ${opt.value === value ? styles.customSelectOptionActive : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAspirasiPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"timeline" | "form" | "hasil" | "response">("timeline");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) { router.push("/login"); return; }
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== "admin" && parsedUser.role !== "superadmin") { router.push("/dashboard"); return; }
      setUser(parsedUser);
      setLoading(false);
    } catch { router.push("/login"); }
  }, [router]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!user) return null;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <p className={styles.pageLabel}>ASPIRASI ADMIN</p>
        <div className={styles.tabBar}>
          {[
            { key: "timeline", label: "TIMELINE & STATUS" },
            { key: "form", label: "ISI FORM" },
            { key: "hasil", label: "HASIL" },
            { key: "response", label: "RESPONSE" },
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
          {activeTab === "response" && <ResponseTab />}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TAB 1 — TIMELINE & STATUS
// ══════════════════════════════════════════════════════════
function TimelineTab() {
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<TimelineStep>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStep, setNewStep] = useState<{ label: string; deskripsi: string; status: TimelineStep["status"]; tanggal: string }>({ label: "", deskripsi: "", status: "pending", tanggal: "" });

  useEffect(() => { fetchSteps(); }, []);

  const fetchSteps = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/aspirasi/timeline`);
      const data = await res.json();
      setSteps(data.sort((a: TimelineStep, b: TimelineStep) => a.urutan - b.urutan));
    } catch {
      setSteps([
        { _id: "1", label: "Pembukaan Aspirasi", deskripsi: "Form aspirasi dibuka untuk mahasiswa", status: "done", tanggal: "2026-01-01", urutan: 1 },
        { _id: "2", label: "Pengumpulan Data", deskripsi: "Rekap data aspirasi dari seluruh mahasiswa", status: "done", tanggal: "2026-01-15", urutan: 2 },
        { _id: "3", label: "Analisis & Rekap", deskripsi: "DPM menganalisis dan merekap seluruh aspirasi", status: "active", tanggal: "2026-02-01", urutan: 3 },
        { _id: "4", label: "Disampaikan ke Pihak Atas", deskripsi: "Hasil aspirasi disampaikan ke dekan/wakil dekan", status: "pending", tanggal: "", urutan: 4 },
        { _id: "5", label: "Tindak Lanjut", deskripsi: "Menunggu tindak lanjut dari pihak fakultas", status: "pending", tanggal: "", urutan: 5 },
      ]);
    } finally { setLoading(false); }
  };

  const saveEdit = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/aspirasi/timeline/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editData),
      });
    } catch { }
    setSteps(steps.map(s => s._id === id ? { ...s, ...editData } : s));
    setEditingId(null); setEditData({});
  };

  const addStep = async () => {
    const step: TimelineStep = { _id: Date.now().toString(), ...newStep, urutan: steps.length + 1 };
    try {
      const res = await fetch(`${API_BASE}/api/aspirasi/timeline`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newStep),
      });
      const created = await res.json();
      setSteps([...steps, created]);
    } catch { setSteps([...steps, step]); }
    setShowAddModal(false);
    setNewStep({ label: "", deskripsi: "", status: "pending", tanggal: "" });
  };

  const deleteStep = async (id: string) => {
    if (!confirm("Hapus langkah ini?")) return;
    try { await fetch(`${API_BASE}/api/aspirasi/timeline/${id}`, { method: "DELETE" }); } catch { }
    setSteps(steps.filter(s => s._id !== id));
  };

  const statusColor = (s: string) =>
    s === "done" ? "#4caf50" : s === "active" ? "#a855f7" : "#9ca3af";

  const statusLabel = (s: string) =>
    s === "done" ? "✅ Selesai" : s === "active" ? "🔄 Sedang Berjalan" : "⏳ Menunggu";

  const STATUS_OPTIONS = [
    { value: "pending", label: "⏳ Menunggu" },
    { value: "active", label: "🔄 Sedang Berjalan" },
    { value: "done", label: "✅ Selesai" },
  ];

  if (loading) return <div className={styles.loading}>Memuat timeline...</div>;

  return (
    <div className={styles.timelineWrapper}>
      <div className={styles.timelineHeader}>
        <h2 className={styles.sectionTitle}>Timeline Progress DPM</h2>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>+ Tambah Tahap</button>
      </div>

      <div className={styles.timelineTrack}>
        {steps.map((step, i) => (
          <div key={step._id} className={styles.timelineItem}>
            <div className={styles.timelineLine}>
              <div className={styles.timelineDot} style={{ background: statusColor(step.status) }} />
              {i < steps.length - 1 && <div className={styles.timelineConnector} />}
            </div>
            <div className={styles.timelineCard}>
              {editingId === step._id ? (
                <div className={styles.editForm}>
                  <input className={styles.editInput} value={editData.label ?? step.label}
                    onChange={e => setEditData({ ...editData, label: e.target.value })} placeholder="Nama tahap" />
                  <textarea className={styles.editTextarea} value={editData.deskripsi ?? step.deskripsi}
                    onChange={e => setEditData({ ...editData, deskripsi: e.target.value })} placeholder="Deskripsi" />
                  <CustomSelect
                    variant="light"
                    value={editData.status ?? step.status}
                    onChange={v => setEditData({ ...editData, status: v as TimelineStep["status"] })}
                    options={STATUS_OPTIONS}
                  />
                  <input type="date" className={styles.editInput} value={editData.tanggal ?? step.tanggal}
                    onChange={e => setEditData({ ...editData, tanggal: e.target.value })} />
                  <div className={styles.editActions}>
                    <button className={styles.saveBtn} onClick={() => saveEdit(step._id)}>Simpan</button>
                    <button className={styles.cancelBtn} onClick={() => { setEditingId(null); setEditData({}); }}>Batal</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.timelineCardHeader}>
                    <span className={styles.timelineStep}>Tahap {step.urutan}</span>
                    <div className={styles.cardActions}>
                      <button className={styles.editIconBtn} onClick={() => { setEditingId(step._id); setEditData(step); }}>✏️</button>
                      <button className={styles.deleteIconBtn} onClick={() => deleteStep(step._id)}>🗑️</button>
                    </div>
                  </div>
                  <h3 className={styles.timelineLabel}>{step.label}</h3>
                  <p className={styles.timelineDesc}>{step.deskripsi}</p>
                  <div className={styles.timelineMeta}>
                    <span className={styles.statusBadge} style={{ background: statusColor(step.status) + "22", color: statusColor(step.status) }}>
                      {statusLabel(step.status)}
                    </span>
                    {step.tanggal && (
                      <span className={styles.tanggalBadge}>
                        📅 {new Date(step.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Tambah Tahap Timeline</h3>
            <input className={styles.editInput} placeholder="Nama Tahap" value={newStep.label}
              onChange={e => setNewStep({ ...newStep, label: e.target.value })} />
            <textarea className={styles.editTextarea} placeholder="Deskripsi tahap..." value={newStep.deskripsi}
              onChange={e => setNewStep({ ...newStep, deskripsi: e.target.value })} />
            <CustomSelect
              variant="light"
              value={newStep.status}
              onChange={v => setNewStep({ ...newStep, status: v as TimelineStep["status"] })}
              options={STATUS_OPTIONS}
            />
            <input type="date" className={styles.editInput} value={newStep.tanggal}
              onChange={e => setNewStep({ ...newStep, tanggal: e.target.value })} />
            <div className={styles.editActions}>
              <button className={styles.saveBtn} onClick={addStep}>Simpan</button>
              <button className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TAB 2 — ISI FORM
// ══════════════════════════════════════════════════════════
function IsiFormTab() {
  const [sesiList, setSesiList] = useState<Sesi[]>([]);
  const [selectedSesi, setSelectedSesi] = useState<Sesi | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSesi, setShowAddSesi] = useState(false);
  const [showAddPertanyaan, setShowAddPertanyaan] = useState(false);
  const [newSesi, setNewSesi] = useState({ nama: "", bulan: 1, tahun: new Date().getFullYear() });
  const [newPertanyaan, setNewPertanyaan] = useState("");
  const [editPertanyaanId, setEditPertanyaanId] = useState<string | null>(null);
  const [editPertanyaanTeks, setEditPertanyaanTeks] = useState("");

  const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const BULAN_OPTIONS = BULAN.map((b, i) => ({ value: String(i + 1), label: b }));

  useEffect(() => { fetchSesi(); }, []);

  const fetchSesi = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/aspirasi/sesi`);
      const data = await res.json();
      setSesiList(data);
    } catch {
      setSesiList([
        { _id: "s1", nama: "Aspirasi Januari 2026", bulan: 1, tahun: 2026, pertanyaan: [
          { _id: "p1", teks: "Apa kendala yang Anda alami selama perkuliahan?", sesiId: "s1" },
          { _id: "p2", teks: "Apa saran Anda untuk meningkatkan kualitas pembelajaran di fakultas?", sesiId: "s1" },
        ], createdAt: "2026-01-01" },
        { _id: "s2", nama: "Aspirasi Februari 2026", bulan: 2, tahun: 2026, pertanyaan: [], createdAt: "2026-02-01" },
        { _id: "s3", nama: "Aspirasi Maret 2026", bulan: 3, tahun: 2026, pertanyaan: [], createdAt: "2026-03-01" },
        { _id: "s4", nama: "Aspirasi April 2026", bulan: 4, tahun: 2026, pertanyaan: [], createdAt: "2026-04-01" },
      ]);
    } finally { setLoading(false); }
  };

  const addSesi = async () => {
    const nama = `Aspirasi ${BULAN[newSesi.bulan - 1]} ${newSesi.tahun}`;
    const sesi: Sesi = { _id: Date.now().toString(), nama, bulan: newSesi.bulan, tahun: newSesi.tahun, pertanyaan: [], createdAt: new Date().toISOString() };
    try {
      const res = await fetch(`${API_BASE}/api/aspirasi/sesi`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newSesi, nama }),
      });
      const created = await res.json();
      setSesiList([...sesiList, created]);
    } catch { setSesiList([...sesiList, sesi]); }
    setShowAddSesi(false);
  };

  const deleteSesi = async (id: string) => {
    if (!confirm("Hapus sesi ini beserta semua pertanyaannya?")) return;
    try { await fetch(`${API_BASE}/api/aspirasi/sesi/${id}`, { method: "DELETE" }); } catch { }
    setSesiList(sesiList.filter(s => s._id !== id));
    if (selectedSesi?._id === id) setSelectedSesi(null);
  };

  const addPertanyaan = async () => {
    if (!selectedSesi || !newPertanyaan.trim()) return;
    const p: Pertanyaan = { _id: Date.now().toString(), teks: newPertanyaan, sesiId: selectedSesi._id };
    try {
      const res = await fetch(`${API_BASE}/api/aspirasi/sesi/${selectedSesi._id}/pertanyaan`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teks: newPertanyaan }),
      });
      const created = await res.json();
      const updated = { ...selectedSesi, pertanyaan: [...selectedSesi.pertanyaan, created] };
      setSelectedSesi(updated);
      setSesiList(sesiList.map(s => s._id === selectedSesi._id ? updated : s));
    } catch {
      const updated = { ...selectedSesi, pertanyaan: [...selectedSesi.pertanyaan, p] };
      setSelectedSesi(updated);
      setSesiList(sesiList.map(s => s._id === selectedSesi._id ? updated : s));
    }
    setNewPertanyaan(""); setShowAddPertanyaan(false);
  };

  const deletePertanyaan = async (pid: string) => {
    if (!selectedSesi) return;
    try { await fetch(`${API_BASE}/api/aspirasi/pertanyaan/${pid}`, { method: "DELETE" }); } catch { }
    const updated = { ...selectedSesi, pertanyaan: selectedSesi.pertanyaan.filter(p => p._id !== pid) };
    setSelectedSesi(updated);
    setSesiList(sesiList.map(s => s._id === selectedSesi._id ? updated : s));
  };

  const saveEditPertanyaan = async () => {
    if (!selectedSesi || !editPertanyaanId) return;
    try {
      await fetch(`${API_BASE}/api/aspirasi/pertanyaan/${editPertanyaanId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teks: editPertanyaanTeks }),
      });
    } catch { }
    const updated = {
      ...selectedSesi,
      pertanyaan: selectedSesi.pertanyaan.map(p => p._id === editPertanyaanId ? { ...p, teks: editPertanyaanTeks } : p),
    };
    setSelectedSesi(updated);
    setSesiList(sesiList.map(s => s._id === selectedSesi._id ? updated : s));
    setEditPertanyaanId(null);
  };

  if (loading) return <div className={styles.loading}>Memuat sesi...</div>;

  return (
    <div className={styles.formWrapper}>
      <div className={styles.sesiPanel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Sesi Aspirasi</h3>
          <button className={styles.addBtn} onClick={() => setShowAddSesi(true)}>+ Sesi</button>
        </div>
        <div className={styles.sesiList}>
          {sesiList.map(sesi => (
            <div
              key={sesi._id}
              className={`${styles.sesiCard} ${selectedSesi?._id === sesi._id ? styles.sesiCardActive : ""}`}
              onClick={() => setSelectedSesi(sesi)}
            >
              <div className={styles.sesiCardContent}>
                <span className={styles.sesiIcon}>📋</span>
                <div>
                  <p className={styles.sesiName}>{sesi.nama}</p>
                  <p className={styles.sesiMeta}>{sesi.pertanyaan.length} pertanyaan</p>
                </div>
              </div>
              <button className={styles.deleteIconBtn} onClick={e => { e.stopPropagation(); deleteSesi(sesi._id); }}>🗑️</button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.pertanyaanPanel}>
        {!selectedSesi ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📂</span>
            <p>Pilih sesi di kiri untuk melihat & mengelola pertanyaan</p>
          </div>
        ) : (
          <>
            <div className={styles.panelHeader}>
              <div>
                <h3 className={styles.panelTitle}>{selectedSesi.nama}</h3>
                <p className={styles.panelSubtitle}>{selectedSesi.pertanyaan.length} pertanyaan terdaftar</p>
              </div>
              <button className={styles.addBtn} onClick={() => setShowAddPertanyaan(true)}>+ Pertanyaan</button>
            </div>
            <div className={styles.pertanyaanList}>
              {selectedSesi.pertanyaan.length === 0 && (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>❓</span>
                  <p>Belum ada pertanyaan. Tambahkan pertanyaan baru.</p>
                </div>
              )}
              {selectedSesi.pertanyaan.map((p, i) => (
                <div key={p._id} className={styles.pertanyaanCard}>
                  {editPertanyaanId === p._id ? (
                    <div className={styles.editInline}>
                      <textarea className={styles.editTextarea} value={editPertanyaanTeks}
                        onChange={e => setEditPertanyaanTeks(e.target.value)} />
                      <div className={styles.editActions}>
                        <button className={styles.saveBtn} onClick={saveEditPertanyaan}>Simpan</button>
                        <button className={styles.cancelBtn} onClick={() => setEditPertanyaanId(null)}>Batal</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.pertanyaanBody}>
                        <span className={styles.pertanyaanNum}>{i + 1}.</span>
                        <p className={styles.pertanyaanTeks}>{p.teks}</p>
                      </div>
                      <div className={styles.cardActions}>
                        <button className={styles.editIconBtn} onClick={() => { setEditPertanyaanId(p._id); setEditPertanyaanTeks(p.teks); }}>✏️</button>
                        <button className={styles.deleteIconBtn} onClick={() => deletePertanyaan(p._id)}>🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showAddSesi && (
        <div className={styles.modalOverlay} onClick={() => setShowAddSesi(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Tambah Sesi Baru</h3>
            <label className={styles.modalLabel}>Bulan</label>
            <CustomSelect
              variant="light"
              value={String(newSesi.bulan)}
              onChange={v => setNewSesi({ ...newSesi, bulan: parseInt(v) })}
              options={BULAN_OPTIONS}
            />
            <label className={styles.modalLabel}>Tahun</label>
            <input type="number" className={styles.editInput} value={newSesi.tahun}
              onChange={e => setNewSesi({ ...newSesi, tahun: parseInt(e.target.value) })} />
            <div className={styles.editActions}>
              <button className={styles.saveBtn} onClick={addSesi}>Buat Sesi</button>
              <button className={styles.cancelBtn} onClick={() => setShowAddSesi(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {showAddPertanyaan && (
        <div className={styles.modalOverlay} onClick={() => setShowAddPertanyaan(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Tambah Pertanyaan</h3>
            <p className={styles.modalSubtitle}>Sesi: {selectedSesi?.nama}</p>
            <textarea className={styles.editTextarea} placeholder="Tulis pertanyaan..." value={newPertanyaan}
              onChange={e => setNewPertanyaan(e.target.value)} rows={4} />
            <div className={styles.editActions}>
              <button className={styles.saveBtn} onClick={addPertanyaan}>Tambah</button>
              <button className={styles.cancelBtn} onClick={() => setShowAddPertanyaan(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TAB 3 — HASIL
// ══════════════════════════════════════════════════════════
function HasilTab() {
  const [sesiList, setSesiList] = useState<Sesi[]>([]);
  const [hasilList, setHasilList] = useState<HasilRespons[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSesi, setSelectedSesi] = useState<Sesi | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ sesiId: "", namaAspirasi: "", hasilRespons: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"terbaru" | "terlama">("terbaru");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [sRes, hRes] = await Promise.all([
        fetch(`${API_BASE}/api/aspirasi/sesi`),
        fetch(`${API_BASE}/api/aspirasi/hasil`),
      ]);
      setSesiList(await sRes.json());
      setHasilList(await hRes.json());
    } catch {
      setSesiList([
        { _id: "s1", nama: "Aspirasi Januari 2026", bulan: 1, tahun: 2026, pertanyaan: [], createdAt: "" },
        { _id: "s2", nama: "Aspirasi Februari 2026", bulan: 2, tahun: 2026, pertanyaan: [], createdAt: "" },
        { _id: "s3", nama: "Aspirasi Maret 2026", bulan: 3, tahun: 2026, pertanyaan: [], createdAt: "" },
        { _id: "s4", nama: "Aspirasi April 2026", bulan: 4, tahun: 2026, pertanyaan: [], createdAt: "" },
      ]);
      setHasilList([
        { _id: "h1", sesiId: "s1", namaSesi: "Aspirasi Januari 2026", namaAspirasi: "Kendala terkait manajemen media sosial FTI Untar dan LINTAR", hasilRespons: "Meskipun media sosial FTI Untar dan Lintar sudah dikelola dengan baik, keterbatasan SDM tetap menjadi kendala utama.", uploadedAt: "2026-05-10" },
        { _id: "h2", sesiId: "s1", namaSesi: "Aspirasi Januari 2026", namaAspirasi: "Kendala mahasiswa terkait kegiatan kemahasiswaan", hasilRespons: "Fakultas telah menyelenggarakan berbagai seminar dan webinar terkait hardskill.", uploadedAt: "2026-05-10" },
      ]);
    } finally { setLoading(false); }
  };

  const submitHasil = async () => {
    const sesi = sesiList.find(s => s._id === form.sesiId);
    const payload = { ...form, namaSesi: sesi?.nama || "" };
    if (editId) {
      try { await fetch(`${API_BASE}/api/aspirasi/hasil/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); } catch { }
      setHasilList(hasilList.map(h => h._id === editId ? { ...h, ...payload } : h));
      setEditId(null);
    } else {
      const newH: HasilRespons = { _id: Date.now().toString(), ...payload, uploadedAt: new Date().toISOString() };
      try {
        const res = await fetch(`${API_BASE}/api/aspirasi/hasil`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        setHasilList([...hasilList, await res.json()]);
      } catch { setHasilList([...hasilList, newH]); }
    }
    setShowAddModal(false);
    setForm({ sesiId: "", namaAspirasi: "", hasilRespons: "" });
  };

  const deleteHasil = async (id: string) => {
    if (!confirm("Hapus hasil ini?")) return;
    try { await fetch(`${API_BASE}/api/aspirasi/hasil/${id}`, { method: "DELETE" }); } catch { }
    setHasilList(hasilList.filter(h => h._id !== id));
  };

  const hasilFiltered = hasilList
    .filter(h => (!selectedSesi || h.sesiId === selectedSesi._id) && h.namaAspirasi.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => filterMode === "terbaru"
      ? new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      : new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
    );

  const SESI_OPTIONS = [
    { value: "", label: "-- Pilih Sesi --" },
    ...sesiList.map(s => ({ value: s._id, label: s.nama })),
  ];

  if (loading) return <div className={styles.loading}>Memuat hasil...</div>;

  return (
    <div className={styles.hasilWrapper}>
      <div className={styles.formWrapper}>
        <div className={styles.sesiPanel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Sesi Aspirasi</h3>
          </div>
          <div className={styles.sesiList}>
            <div
              className={`${styles.sesiCard} ${!selectedSesi ? styles.sesiCardActive : ""}`}
              onClick={() => setSelectedSesi(null)}
            >
              <div className={styles.sesiCardContent}>
                <span className={styles.sesiIcon}>📂</span>
                <div>
                  <p className={styles.sesiName}>Semua Sesi</p>
                  <p className={styles.sesiMeta}>{hasilList.length} hasil</p>
                </div>
              </div>
            </div>
            {sesiList.map(sesi => {
              const count = hasilList.filter(h => h.sesiId === sesi._id).length;
              return (
                <div
                  key={sesi._id}
                  className={`${styles.sesiCard} ${selectedSesi?._id === sesi._id ? styles.sesiCardActive : ""}`}
                  onClick={() => setSelectedSesi(sesi)}
                >
                  <div className={styles.sesiCardContent}>
                    <span className={styles.sesiIcon}>📋</span>
                    <div>
                      <p className={styles.sesiName}>{sesi.nama}</p>
                      <p className={styles.sesiMeta}>{count} hasil</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.pertanyaanPanel}>
          <div className={styles.hasilPanelTopBar}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input className={styles.searchInput} placeholder="Cari hasil..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className={styles.filterWrapper}>
              <button className={styles.filterToggleBtn} onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
                {filterMode === "terbaru" ? "Terbaru ▾" : "Terlama ▾"}
              </button>
              {showFilterDropdown && (
                <div className={styles.filterDropdown}>
                  <button className={`${styles.filterOption} ${filterMode === "terbaru" ? styles.filterOptionActive : ""}`}
                    onClick={() => { setFilterMode("terbaru"); setShowFilterDropdown(false); }}>
                    Dari yang terkini sampai terlama
                  </button>
                  <button className={`${styles.filterOption} ${filterMode === "terlama" ? styles.filterOptionActive : ""}`}
                    onClick={() => { setFilterMode("terlama"); setShowFilterDropdown(false); }}>
                    Dari yang terlama
                  </button>
                </div>
              )}
            </div>
            <button className={styles.addBtn} onClick={() => {
              setForm({ sesiId: selectedSesi?._id || "", namaAspirasi: "", hasilRespons: "" });
              setShowAddModal(true);
            }}>+ Tambah</button>
          </div>

          <div className={styles.hasilList}>
            {hasilFiltered.length === 0 && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📭</span>
                <p>{selectedSesi ? `Belum ada hasil untuk ${selectedSesi.nama}` : "Belum ada hasil aspirasi"}</p>
              </div>
            )}
            {hasilFiltered.map(h => (
              <div key={h._id} className={styles.hasilCard}>
                <div className={styles.hasilCardContent}>
                  <h3 className={styles.hasilTitle}>{h.namaAspirasi}</h3>
                  <p className={styles.hasilDate}>
                    {new Date(h.uploadedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className={styles.hasilBody}>{h.hasilRespons}</p>
                  <span className={styles.hasilSesiBadge}>📋 {h.namaSesi}</span>
                </div>
                <div className={styles.hasilActions}>
                  <button className={styles.editIconBtn} onClick={() => {
                    setEditId(h._id);
                    setForm({ sesiId: h.sesiId, namaAspirasi: h.namaAspirasi, hasilRespons: h.hasilRespons });
                    setShowAddModal(true);
                  }}>✏️</button>
                  <button className={styles.deleteIconBtn} onClick={() => deleteHasil(h._id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className={styles.fab} onClick={() => {
        setForm({ sesiId: selectedSesi?._id || "", namaAspirasi: "", hasilRespons: "" });
        setShowAddModal(true);
      }}>+</button>

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowAddModal(false); setEditId(null); }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{editId ? "Edit Hasil" : "Tambah Hasil Aspirasi"}</h3>
            <label className={styles.modalLabel}>Sesi</label>
            <CustomSelect
              variant="light"
              value={form.sesiId}
              onChange={v => setForm({ ...form, sesiId: v })}
              options={SESI_OPTIONS}
              placeholder="-- Pilih Sesi --"
            />
            <label className={styles.modalLabel}>Nama Aspirasi</label>
            <textarea className={styles.editTextarea} placeholder="Judul/nama aspirasi..." value={form.namaAspirasi}
              onChange={e => setForm({ ...form, namaAspirasi: e.target.value })} rows={2} />
            <label className={styles.modalLabel}>Hasil Respons</label>
            <textarea className={styles.editTextarea} placeholder="Tulis hasil/respons aspirasi..." value={form.hasilRespons}
              onChange={e => setForm({ ...form, hasilRespons: e.target.value })} rows={5} />
            <div className={styles.editActions}>
              <button className={styles.saveBtn} onClick={submitHasil}>Upload</button>
              <button className={styles.cancelBtn} onClick={() => { setShowAddModal(false); setEditId(null); }}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TAB 4 — RESPONSE
// ══════════════════════════════════════════════════════════
interface Jawaban {
  _id: string;
  sesiId: { _id: string; nama: string; bulan: number; tahun: number } | string;
  pertanyaanId: { _id: string; teks: string } | string;
  jawaban: string;
  nim?: string;
  nama?: string;
  createdAt: string;
}

function ResponseTab() {
  const [sesiList, setSesiList] = useState<Sesi[]>([]);
  const [jawabanList, setJawabanList] = useState<Jawaban[]>([]);
  const [selectedSesi, setSelectedSesi] = useState<Sesi | null>(null);
  const [selectedPertanyaanId, setSelectedPertanyaanId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sesiData, jawabanData] = await Promise.all([
        fetch(`${API_BASE}/api/aspirasi/sesi`).then(r => r.json()),
        fetch(`${API_BASE}/api/aspirasi/jawaban`).then(r => r.json()),
      ]);
      setSesiList(sesiData);
      setJawabanList(jawabanData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSesiChange = (sesiId: string) => {
    setSelectedSesi(sesiList.find(s => s._id === sesiId) || null);
    setSelectedPertanyaanId("all");
  };

  const jawabanFiltered = jawabanList.filter(j => {
    if (!selectedSesi) return false;
    const jSesiId = j.sesiId && typeof j.sesiId === "object" ? j.sesiId._id : j.sesiId;
    if (jSesiId !== selectedSesi._id) return false;
    if (selectedPertanyaanId === "all") return true;
    const pid = j.pertanyaanId && typeof j.pertanyaanId === "object" ? j.pertanyaanId._id : j.pertanyaanId;
    return pid === selectedPertanyaanId;
  });

  const pertanyaanTerpilih = selectedSesi?.pertanyaan.find(p => p._id === selectedPertanyaanId);

  const SESI_OPTIONS = [
    { value: "", label: "-- Pilih Sesi --" },
    ...sesiList.map(s => ({ value: s._id, label: s.nama })),
  ];

  const PERTANYAAN_OPTIONS = [
    { value: "all", label: "Semua Pertanyaan" },
    ...(selectedSesi?.pertanyaan.map((p, i) => ({
      value: p._id,
      label: `${i + 1}. ${p.teks.length > 60 ? p.teks.slice(0, 60) + "..." : p.teks}`,
    })) || []),
  ];

  if (loading) return <div className={styles.loading}>Memuat response...</div>;

  return (
    <div className={styles.responseWrapper}>
      <div className={styles.responseFilterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>SESI</label>
          <CustomSelect
            variant="dark"
            value={selectedSesi?._id || ""}
            onChange={handleSesiChange}
            options={SESI_OPTIONS}
            placeholder="-- Pilih Sesi --"
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>PERTANYAAN</label>
          <CustomSelect
            variant="dark"
            value={selectedPertanyaanId}
            onChange={setSelectedPertanyaanId}
            options={PERTANYAAN_OPTIONS}
            disabled={!selectedSesi}
            placeholder="Semua Pertanyaan"
          />
        </div>

        {selectedSesi && (
          <div className={styles.responseCounter}>
            <span className={styles.responseCountNum}>{jawabanFiltered.length}</span>
            <span className={styles.responseCountLabel}>jawaban</span>
          </div>
        )}

        <button className={styles.refreshBtn} onClick={fetchData} disabled={loading} title="Refresh data jawaban">
          {loading ? "⟳..." : "⟳"} Refresh
        </button>
      </div>

      {selectedSesi && selectedPertanyaanId !== "all" && pertanyaanTerpilih && (
        <div className={styles.pertanyaanHeading}>
          <span className={styles.pertanyaanHeadingQ}>❓</span>
          <p>{pertanyaanTerpilih.teks}</p>
        </div>
      )}

      {!selectedSesi && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📋</span>
          <p>Pilih sesi untuk melihat jawaban mahasiswa.</p>
        </div>
      )}

      {selectedSesi && jawabanFiltered.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📭</span>
          <p>Belum ada jawaban masuk{selectedPertanyaanId !== "all" ? " untuk pertanyaan ini" : " untuk sesi ini"}.</p>
        </div>
      )}

      <div className={styles.jawabanGrid}>
        {jawabanFiltered.map(j => {
          const pteks = j.pertanyaanId && typeof j.pertanyaanId === "object" ? j.pertanyaanId.teks : "";
          return (
            <div key={j._id} className={styles.jawabanCard}>
              <div className={styles.jawabanCardHeader}>
                <div className={styles.jawabanAvatar}>{(j.nama || "A")[0].toUpperCase()}</div>
                <div>
                  <p className={styles.jawabanNama}>{j.nama || "Anonim"}</p>
                  {j.nim && <p className={styles.jawabanNim}>{j.nim}</p>}
                </div>
                <span className={styles.jawabanDate}>
                  {new Date(j.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              {selectedPertanyaanId === "all" && pteks && (
                <p className={styles.jawabanPertanyaan}>❓ {pteks}</p>
              )}
              <p className={styles.jawabanIsi}>{j.jawaban || <em style={{ color: "#9ca3af" }}>Tidak ada jawaban</em>}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}