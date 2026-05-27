// controllers/claimController.js
// ✅ Sudah ditambah trigger notifikasi admin

const mongoose = require("mongoose");
const Claim    = require("../models/Claim");
const Barang   = require("../models/Barang");
const cloudinary = require("../config/cloudinary");
const Chat     = require("../models/Chat");

// 🔔 Import helper notifikasi
const { createNotif } = require("./notifikasiController");

// POST /api/claim — Buat pengajuan claim baru
const createClaim = async (req, res) => {
  try {
    const { barangId, nama, nim, nomorTelepon, fotoKTM } = req.body;
    const userId = req.user.userId;

    if (!barangId || !nama || !nim || !nomorTelepon || !fotoKTM) {
      return res.status(400).json({ success: false, message: "Semua field wajib diisi." });
    }

    const barang = await Barang.findOne({ barangId });

    if (!barang) {
      return res.status(404).json({ success: false, message: "Barang tidak ditemukan." });
    }

    if (barang.status !== "tersedia") {
      return res.status(400).json({
        success: false,
        message: "Barang sudah tidak tersedia untuk diklaim.",
      });
    }

    const existingClaim = await Claim.findOne({ userId, barangId });
    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: "Kamu sudah pernah mengajukan claim untuk barang ini.",
      });
    }

    let fotoKtmUrl = null;
    if (fotoKTM) {
      const uploadResult = await cloudinary.uploader.upload(fotoKTM, {
        folder: "claims-ktm",
        resource_type: "image",
      });
      fotoKtmUrl = uploadResult.secure_url;
    }

    const claim = new Claim({
      userId,
      barangId,
      nama,
      nim,
      nomorTelepon,
      fotoKTM: fotoKtmUrl,
      status: "pending",
    });

    await claim.save();

    // ─────────────────────────────────────────
    // 🔔 TRIGGER NOTIFIKASI ADMIN
    // Kirim notif setiap ada klaim masuk
    // ─────────────────────────────────────────
    await createNotif({
      title: "Pengajuan Klaim Baru",
      desc: `${nama} (NIM: ${nim}) mengajukan klaim untuk barang "${barang.nama}". Menunggu verifikasi.`,
      category: "Lost & Found",
      icon: "📦",
      iconBg: "#fef3c7",
      refType: "claim",
      refId: claim.claimId,
      target: "admin",
    });

    res.status(201).json({
      success: true,
      message: "Pengajuan klaim berhasil dikirim. Menunggu verifikasi admin.",
      data: claim,
    });
  } catch (error) {
    console.error("createClaim error:", error);
    res.status(500).json({ success: false, message: "Gagal membuat pengajuan klaim." });
  }
};

// GET /api/claim — Ambil semua claim (untuk admin)
const getAllClaims = async (req, res) => {
  try {
    const claims = await Claim.find().sort({ tanggal: -1 }).lean();

    const populatedClaims = await Promise.all(claims.map(async (claim) => {
      const barang = await mongoose.model("Barang").findOne({ barangId: claim.barangId });
      const user   = await mongoose.model("Mahasiswa").findOne({ userId: claim.userId });
      return {
        ...claim,
        claimUserId: claim.userId,
        barangId: barang || null,
        userId: user || null,
      };
    }));

    res.status(200).json({ success: true, data: populatedClaims });
  } catch (error) {
    console.error("getAllClaims error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data klaim." });
  }
};

// PATCH /api/claim/:id/status — Update status claim (Approve/Reject)
const updateClaimStatus = async (req, res) => {
  try {
    const { status, catatan } = req.body;
    const claim = await Claim.findOne({ claimId: req.params.id });

    if (!claim) {
      return res.status(404).json({ success: false, message: "Pengajuan klaim tidak ditemukan." });
    }

    claim.status = status;
    if (catatan) claim.catatan = catatan;
    await claim.save();

    if (status === "disetujui") {
      await Barang.findOneAndUpdate({ barangId: claim.barangId }, { status: "dipinjam" });
    }

    if (status === "disetujui" || status === "ditolak") {
      await Chat.deleteMany({ konteksType: "claim", konteksId: claim.claimId });
    }

    // ─────────────────────────────────────────
    // 🔔 TRIGGER NOTIFIKASI ADMIN — status berubah
    // ─────────────────────────────────────────
    const isApproved = status === "disetujui";
    await createNotif({
      title: isApproved ? "Klaim Disetujui" : "Klaim Ditolak",
      desc: `Klaim oleh ${claim.nama ?? "mahasiswa"} telah ${status}.${catatan ? ` Catatan: ${catatan}` : ""}`,
      category: "Lost & Found",
      icon: isApproved ? "✅" : "❌",
      iconBg: isApproved ? "#dcfce7" : "#fee2e2",
      refType: "claim",
      refId: claim.claimId,
      target: "admin",
    });

    res.status(200).json({
      success: true,
      message: `Klaim berhasil ${status}.`,
      data: claim,
    });
  } catch (error) {
    console.error("updateClaimStatus error:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui status klaim." });
  }
};

// GET /api/claim/mine — Ambil semua claim milik user yang login
const getMyClaims = async (req, res) => {
  try {
    const userId = req.user.userId;
    const claims = await Claim.find({ userId }).sort({ tanggal: -1 }).lean();

    const populated = await Promise.all(
      claims.map(async (claim) => {
        const barang = await mongoose.model("Barang").findOne({ barangId: claim.barangId });
        return { ...claim, barangId: barang || null };
      })
    );

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error("getMyClaims error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil klaim." });
  }
};

module.exports = {
  createClaim,
  getAllClaims,
  getMyClaims,
  updateClaimStatus,
};