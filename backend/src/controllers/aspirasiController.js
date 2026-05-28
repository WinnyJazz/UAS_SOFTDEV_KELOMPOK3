// controllers/aspirasController.js
// ✅ Sudah ditambah trigger notifikasi admin

const {
  SesiAspirasi,
  Pertanyaan,
  Jawaban,
  HasilRespons,
  TimelineStep,
} = require("../models/Aspirasi");

// 🔔 Import helper notifikasi
const { createNotif } = require("../utils/notifHelper");

/* ══════════════════════════════════════════
   TIMELINE
══════════════════════════════════════════ */

exports.getTimeline = async (req, res) => {
  try {
    const steps = await TimelineStep.find().sort({ urutan: 1 });
    res.json(steps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

exports.updateTimelineStep = async (req, res) => {
  try {
    const step = await TimelineStep.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!step) return res.status(404).json({ message: "Tidak ditemukan" });
    res.json(step);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTimelineStep = async (req, res) => {
  try {
    await TimelineStep.findByIdAndDelete(req.params.id);
    res.json({ message: "Tahap dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════
   SESI AKTIF
══════════════════════════════════════════ */

exports.getSesiAktif = async (req, res) => {
  try {
    const now = new Date();
    const bulanSekarang = now.getMonth() + 1;
    const tahunSekarang = now.getFullYear();

    let sesi = await SesiAspirasi.findOne({
      bulan: bulanSekarang,
      tahun: tahunSekarang,
    });

    if (!sesi) {
      sesi = await SesiAspirasi.findOne().sort({ tahun: -1, bulan: -1 });
    }

    if (!sesi) {
      return res.status(404).json({ message: "Tidak ada sesi aspirasi aktif" });
    }

    const pertanyaan = await Pertanyaan.find({ sesiId: sesi._id }).sort({ urutan: 1 });
    res.json({ ...sesi.toObject(), pertanyaan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════
   SESI
══════════════════════════════════════════ */

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

exports.updatePertanyaan = async (req, res) => {
  try {
    const p = await Pertanyaan.findByIdAndUpdate(
      req.params.id,
      { teks: req.body.teks },
      { new: true }
    );
    if (!p) return res.status(404).json({ message: "Tidak ditemukan" });
    res.json(p);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

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

exports.getJawaban = async (req, res) => {
  try {
    const filter = {};
    if (req.query.sesiId) filter.sesiId = req.query.sesiId;
    if (req.query.pertanyaanId) filter.pertanyaanId = req.query.pertanyaanId;
    if (req.query.nim) filter.nim = req.query.nim;
    if (req.query.mahasiswaId) filter.mahasiswaId = req.query.mahasiswaId;
    if (req.query.userId) filter.userId = req.query.userId;
    const jawaban = await Jawaban.find(filter)
      .populate("pertanyaanId", "teks")
      .populate("sesiId", "nama bulan tahun")
      .sort({ createdAt: -1 });
    res.json(jawaban);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// controllers/aspirasController.js

exports.submitSesiAspirasi = async (req, res) => {
  try {
    console.log("🔥 [submitSesiAspirasi] dipanggil");
    console.log("🔥 [submitSesiAspirasi] body:", req.body);
    const { sesiId, userId, jawabanList } = req.body;

    if (!jawabanList || jawabanList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Jawaban kosong",
      });
    }

    const saved = await Promise.all(
      jawabanList.map((j) =>
        Jawaban.create({
          sesiId,
          pertanyaanId: j.pertanyaanId,
          teks: j.teks,
          userId,
        })
      )
    );

    const sesi = await SesiAspirasi.findById(sesiId);

    // 🔔 NOTIF FIXED
    const notif = await createNotif({
      title: "Aspirasi Sesi Selesai",
      desc: `Mahasiswa menyelesaikan sesi "${sesi?.nama || "Aspirasi"
        }" (${saved.length} jawaban)`,
      category: "Aspirasi",
      icon: "📋",
      iconBg: "#dbeafe",
      refType: "sesi-aspirasi",
      refId: sesiId,
      target: "admin",
    });

    console.log("📩 notif result:", notif);

    return res.status(201).json({
      success: true,
      message: "Aspirasi berhasil dikirim",
      data: saved,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.submitJawaban = async (req, res) => {
  try {
    const { pertanyaanId, sesiId, jawaban, nim, nama } = req.body;
    const newJawaban = new Jawaban(req.body);
    await newJawaban.save();
    
    // 🔔 TRIGGER NOTIFIKASI KE ADMIN
    const sesi = await SesiAspirasi.findById(sesiId);
    const pertanyaan = await Pertanyaan.findById(pertanyaanId);
    
    await createNotif({
      title: "Jawaban Aspirasi Masuk",
      desc: `Mahasiswa ${nama} (NIM: ${nim}) menjawab pertanyaan di sesi "${sesi?.nama || "Aspirasi"}"`,
      category: "Aspirasi",
      icon: "📋",
      iconBg: "#dbeafe",
      refType: "jawaban",
      refId: newJawaban._id.toString(),
      target: "admin",
    });
    
    res.status(201).json(newJawaban);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ══════════════════════════════════════════
   HASIL RESPONS DPM
══════════════════════════════════════════ */

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

exports.createHasil = async (req, res) => {
  try {
    const hasil = new HasilRespons(req.body);
    await hasil.save();
    
    // 🔔 TRIGGER NOTIFIKASI KE ADMIN
    const sesi = await SesiAspirasi.findById(hasil.sesiId);
    await createNotif({
      title: "Aspirasi Baru Masuk",
      desc: `Sesi: ${sesi?.nama || "Aspirasi"} — Jawaban baru dari mahasiswa`,
      category: "Aspirasi",
      icon: "📋",
      iconBg: "#dbeafe",
      refType: "aspirasi",
      refId: hasil._id.toString(),
      target: "admin",
    });
    
    res.status(201).json(hasil);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateHasil = async (req, res) => {
  try {
    const hasil = await HasilRespons.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hasil) return res.status(404).json({ message: "Tidak ditemukan" });
    res.json(hasil);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteHasil = async (req, res) => {
  try {
    await HasilRespons.findByIdAndDelete(req.params.id);
    res.json({ message: "Hasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};