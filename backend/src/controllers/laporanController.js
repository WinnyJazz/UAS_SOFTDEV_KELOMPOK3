const mongoose  = require("mongoose");
const Laporan   = require("../models/Laporan");
const cloudinary = require("../config/cloudinary");
const Chat      = require("../models/Chat");

// POST /api/laporan — User submit laporan barang hilang
const createLaporan = async (req, res) => {
  try {
    const { namaBarang, deskripsi, lokasi, tanggal, foto } = req.body;
    const userId = req.user.userId;

    if (!namaBarang || !lokasi) {
      return res.status(400).json({ success: false, message: "Nama barang dan lokasi wajib diisi." });
    }

    let fotoUrl = null;
    if (foto) {
      const uploadResult = await cloudinary.uploader.upload(foto, {
        folder: "laporan-hilang",
        resource_type: "image",
      });
      fotoUrl = uploadResult.secure_url;
    }

    const laporan = new Laporan({
      userId,
      namaBarang,
      deskripsi: deskripsi || "",
      lokasi,
      tanggal: tanggal ? new Date(tanggal) : new Date(),
      foto: fotoUrl,
      status: "pending",
    });

    await laporan.save();

    res.status(201).json({
      success: true,
      message: "Laporan berhasil dikirim. Tim DPM akan segera memprosesnya.",
      data: laporan,
    });
  } catch (error) {
    console.error("createLaporan error:", error);
    res.status(500).json({ success: false, message: "Gagal mengirim laporan." });
  }
};

// GET /api/laporan/mine — Ambil laporan milik user yang login
const getMyLaporan = async (req, res) => {
  try {
    const userId = req.user.userId;
    const laporan = await Laporan.find({ userId }).sort({ tanggal: -1 }).lean();
    res.status(200).json({ success: true, data: laporan });
  } catch (error) {
    console.error("getMyLaporan error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil laporan." });
  }
};

// GET /api/laporan — Ambil semua laporan (Admin)
const getAllLaporan = async (req, res) => {
  try {
    const laporan = await Laporan.find().sort({ tanggal: -1 }).lean();

    // Populate user info
    const populated = await Promise.all(
      laporan.map(async (item) => {
        const user = await mongoose.model("Mahasiswa").findOne({ userId: item.userId });
        return { ...item, user: user || null };
      })
    );

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error("getAllLaporan error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil laporan." });
  }
};

// PATCH /api/laporan/:id/status — Admin update status laporan
const updateLaporanStatus = async (req, res) => {
  try {
    const { status, pesanAdmin } = req.body;
    const laporan = await Laporan.findOne({ laporanId: req.params.id });

    if (!laporan) {
      return res.status(404).json({ success: false, message: "Laporan tidak ditemukan." });
    }

    laporan.status = status;
    if (pesanAdmin !== undefined) laporan.pesanAdmin = pesanAdmin;
    await laporan.save();

    // Auto-hapus chat bila sudah final
    if (status === "ditemukan") {
      await Chat.deleteMany({ konteksType: "laporan", konteksId: laporan.laporanId });
    }

    res.status(200).json({
      success: true,
      message: `Status laporan berhasil diperbarui menjadi ${status}.`,
      data: laporan,
    });
  } catch (error) {
    console.error("updateLaporanStatus error:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui status laporan." });
  }
};

module.exports = {
  createLaporan,
  getMyLaporan,
  getAllLaporan,
  updateLaporanStatus,
};
