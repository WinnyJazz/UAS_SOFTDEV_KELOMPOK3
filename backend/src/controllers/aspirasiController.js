// controllers/aspirasController.js

const {
  SesiAspirasi,
  Pertanyaan,
  Jawaban,
  HasilRespons,
  TimelineStep,
} = require("../models/Aspirasi");

/* ══════════════════════════════════════════
   TIMELINE
══════════════════════════════════════════ */

// GET /api/aspirasi/timeline
exports.getTimeline = async (req, res) => {
  try {
    const steps = await TimelineStep.find().sort({ urutan: 1 });
    res.json(steps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/aspirasi/timeline
exports.createTimelineStep = async (req, res) => {
  try {
    const count = await TimelineStep.countDocuments();
    const step = new TimelineStep({ ...req.body, urutan: count + 1 });
    await step.save();
    res.status(201).json(step);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/aspirasi/timeline/:id
exports.updateTimelineStep = async (req, res) => {
  try {
    const step = await TimelineStep.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!step) return res.status(404).json({ message: "Tidak ditemukan" });
    res.json(step);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/aspirasi/timeline/:id
exports.deleteTimelineStep = async (req, res) => {
  try {
    await TimelineStep.findByIdAndDelete(req.params.id);
    res.json({ message: "Tahap dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getSesiAktif = async (req, res) => {
  try {
    const now = new Date();
    const bulanSekarang = now.getMonth() + 1; // getMonth() 0-based
    const tahunSekarang = now.getFullYear();
 
    // Cari sesi yang cocok dengan bulan & tahun saat ini
    let sesi = await SesiAspirasi.findOne({
      bulan: bulanSekarang,
      tahun: tahunSekarang,
    });
 
    // Fallback: sesi paling baru jika tidak ada yang cocok
    if (!sesi) {
      sesi = await SesiAspirasi.findOne().sort({ tahun: -1, bulan: -1 });
    }
 
    if (!sesi) {
      return res.status(404).json({ message: "Tidak ada sesi aspirasi aktif" });
    }
 
    // Sertakan pertanyaan milik sesi ini
    const pertanyaan = await Pertanyaan.find({ sesiId: sesi._id }).sort({ urutan: 1 });
 
    res.json({ ...sesi.toObject(), pertanyaan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ══════════════════════════════════════════
   SESI
══════════════════════════════════════════ */

// GET /api/aspirasi/sesi  — returns sesi + pertanyaan each
exports.getAllSesi = async (req, res) => {
  try {
    const sesiList = await SesiAspirasi.find().sort({ tahun: 1, bulan: 1 });
    const result = await Promise.all(
      sesiList.map(async (sesi) => {
        const pertanyaan = await Pertanyaan.find({ sesiId: sesi._id }).sort({ urutan: 1 });
        return { ...sesi.toObject(), pertanyaan };
      })
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/aspirasi/sesi
exports.createSesi = async (req, res) => {
  try {
    const { nama, bulan, tahun } = req.body;
    const sesi = new SesiAspirasi({ nama, bulan, tahun });
    await sesi.save();
    res.status(201).json({ ...sesi.toObject(), pertanyaan: [] });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/aspirasi/sesi/:id
exports.deleteSesi = async (req, res) => {
  try {
    const { id } = req.params;
    await SesiAspirasi.findByIdAndDelete(id);
    await Pertanyaan.deleteMany({ sesiId: id });
    await HasilRespons.deleteMany({ sesiId: id });
    res.json({ message: "Sesi dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════
   PERTANYAAN
══════════════════════════════════════════ */

// POST /api/aspirasi/sesi/:sesiId/pertanyaan
exports.addPertanyaan = async (req, res) => {
  try {
    const { sesiId } = req.params;
    const count = await Pertanyaan.countDocuments({ sesiId });
    const p = new Pertanyaan({ sesiId, teks: req.body.teks, urutan: count + 1 });
    await p.save();
    res.status(201).json(p);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/aspirasi/pertanyaan/:id
exports.updatePertanyaan = async (req, res) => {
  try {
    const p = await Pertanyaan.findByIdAndUpdate(req.params.id, { teks: req.body.teks }, { new: true });
    if (!p) return res.status(404).json({ message: "Tidak ditemukan" });
    res.json(p);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/aspirasi/pertanyaan/:id
exports.deletePertanyaan = async (req, res) => {
  try {
    await Pertanyaan.findByIdAndDelete(req.params.id);
    res.json({ message: "Pertanyaan dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════
   JAWABAN MAHASISWA
══════════════════════════════════════════ */

// GET /api/aspirasi/jawaban?sesiId=xxx&pertanyaanId=yyy
exports.getJawaban = async (req, res) => {
  try {
    const filter = {};
    if (req.query.sesiId) filter.sesiId = req.query.sesiId;
    if (req.query.pertanyaanId) filter.pertanyaanId = req.query.pertanyaanId;
    const jawaban = await Jawaban.find(filter).populate("pertanyaanId", "teks");
    res.json(jawaban);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/aspirasi/jawaban  (mahasiswa submit)
exports.submitJawaban = async (req, res) => {
  try {
    const jawaban = new Jawaban(req.body);
    await jawaban.save();
    res.status(201).json(jawaban);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════
   HASIL RESPONS DPM
══════════════════════════════════════════ */

// GET /api/aspirasi/hasil?sesiId=xxx
exports.getAllHasil = async (req, res) => {
  try {
    const filter = {};
    if (req.query.sesiId) filter.sesiId = req.query.sesiId;
    const hasil = await HasilRespons.find(filter).sort({ createdAt: -1 });
    res.json(hasil);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/aspirasi/hasil
exports.createHasil = async (req, res) => {
  try {
    const hasil = new HasilRespons(req.body);
    await hasil.save();
    res.status(201).json(hasil);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/aspirasi/hasil/:id
exports.updateHasil = async (req, res) => {
  try {
    const hasil = await HasilRespons.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hasil) return res.status(404).json({ message: "Tidak ditemukan" });
    res.json(hasil);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/aspirasi/hasil/:id
exports.deleteHasil = async (req, res) => {
  try {
    await HasilRespons.findByIdAndDelete(req.params.id);
    res.json({ message: "Hasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};