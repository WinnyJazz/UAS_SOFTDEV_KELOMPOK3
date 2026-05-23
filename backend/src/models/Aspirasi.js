// models/Aspirasi.js  ← sudah ada, pastikan strukturnya seperti ini

const mongoose = require("mongoose");

/* ─── Sesi Aspirasi (folder per bulan) ─── */
const SesiSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true },       // "Aspirasi Januari 2026"
    bulan: { type: Number, required: true },       // 1–12
    tahun: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

/* ─── Pertanyaan (milik satu sesi) ───────── */
const PertanyaanSchema = new mongoose.Schema(
  {
    sesiId: { type: mongoose.Schema.Types.ObjectId, ref: "SesiAspirasi", required: true },
    teks: { type: String, required: true },
    urutan: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ─── Jawaban Mahasiswa ──────────────────── */
const JawabanSchema = new mongoose.Schema(
  {
    pertanyaanId: { type: mongoose.Schema.Types.ObjectId, ref: "Pertanyaan", required: true },
    sesiId: { type: mongoose.Schema.Types.ObjectId, ref: "SesiAspirasi", required: true },
    mahasiswaId: { type: mongoose.Schema.Types.ObjectId, ref: "Mahasiswa" },
    nim: { type: String },
    nama: { type: String },
    jawaban: { type: String, required: true },
  },
  { timestamps: true }
);

/* ─── Hasil Respons DPM (per sesi) ───────── */
const HasilResponsSchema = new mongoose.Schema(
  {
    sesiId: { type: mongoose.Schema.Types.ObjectId, ref: "SesiAspirasi", required: true },
    namaSesi: { type: String },
    namaAspirasi: { type: String, required: true },   // judul/topik aspirasi
    hasilRespons: { type: String, required: true },   // isi respons DPM
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

/* ─── Timeline Step ───────────────────────── */
const TimelineStepSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    deskripsi: { type: String },
    status: { type: String, enum: ["pending", "active", "done"], default: "pending" },
    tanggal: { type: String },   // ISO date string, bisa kosong
    urutan: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = {
  SesiAspirasi: mongoose.model("SesiAspirasi", SesiSchema),
  Pertanyaan: mongoose.model("Pertanyaan", PertanyaanSchema),
  Jawaban: mongoose.model("Jawaban", JawabanSchema),
  HasilRespons: mongoose.model("HasilRespons", HasilResponsSchema),
  TimelineStep: mongoose.model("TimelineStep", TimelineStepSchema),
};