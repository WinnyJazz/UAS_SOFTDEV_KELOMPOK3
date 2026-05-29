// controllers/claimController.js

const mongoose = require("mongoose");
const Claim = require("../models/Claim");
const Barang = require("../models/Barang");
const cloudinary = require("../config/cloudinary");
const Mahasiswa = require("../models/Mahasiswa");
const { createNotif } = require("../utils/notifHelper");

/* ═════════════════════════════════════════════
   CREATE CLAIM
═════════════════════════════════════════════ */
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
      return res.status(400).json({ success: false, message: "Barang sudah tidak tersedia untuk diklaim." });
    }

    const existingClaim = await Claim.findOne({ userId, barangId });
    if (existingClaim) {
      return res.status(400).json({ success: false, message: "Kamu sudah pernah mengajukan klaim untuk barang ini." });
    }

    let fotoKtmUrl = null;
    if (fotoKTM) {
      const uploadResult = await cloudinary.uploader.upload(fotoKTM, {
        folder: "claims-ktm",
        resource_type: "image",
      });
      fotoKtmUrl = uploadResult.secure_url;
    }

    const claim = await Claim.create({
      userId,
      barangId,
      nama,
      nim,
      nomorTelepon,
      fotoKTM: fotoKtmUrl,
      status: "pending",
      namaBarang: barang.nama,
      lokasiBarang: barang.lokasi,
    });

    // Notif untuk admin (non-blocking)
    createNotif({
      title: "📦 Pengajuan Klaim Baru",
      desc: `${nama} (NIM: ${nim}) mengajukan klaim untuk "${barang.nama}".`,
      category: "Lost & Found",
      icon: "📦",
      iconBg: "#fef3c7",
      refType: "Claim",
      refId: claim._id.toString(),
      target: "admin",
    }).catch((err) => {
      console.error("❌ Notif creation failed:", err);
    });

    return res.status(201).json({ success: true, message: "Pengajuan klaim berhasil dikirim.", data: claim });
  } catch (error) {
    console.error("❌ createClaim error:", error);
    console.error("   Stack:", error.stack);
    return res.status(500).json({ success: false, message: "Gagal membuat pengajuan klaim." });
  }
};

/* ═════════════════════════════════════════════
   GET ALL CLAIMS (ADMIN)
═════════════════════════════════════════════ */
const getAllClaims = async (req, res) => {
  try {
    const claims = await Claim.find().sort({ createdAt: -1 }).lean();

    if (claims.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const barangIds = [...new Set(claims.map((c) => c.barangId))];
    const barangList = await Barang.find({ barangId: { $in: barangIds } }).lean();
    const barangMap = Object.fromEntries(barangList.map((b) => [b.barangId, b]));

    const enriched = claims.map((claim) => {
      const barang = barangMap[claim.barangId];
      return {
        ...claim,
        barangId: barang
          ? { barangId: barang.barangId, nama: barang.nama, lokasi: barang.lokasi, foto: barang.foto ?? null }
          : { barangId: claim.barangId, nama: claim.namaBarang ?? "—", lokasi: claim.lokasiBarang ?? "—", foto: null },
        userId: null,
      };
    });

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error("getAllClaims error:", error);
    return res.status(500).json({ success: false, message: "Gagal mengambil data klaim." });
  }
};

/* ═════════════════════════════════════════════
   UPDATE STATUS CLAIM (APPROVE / REJECT)
═════════════════════════════════════════════ */
const updateClaimStatus = async (req, res) => {
  try {
    const { status, catatan } = req.body;

    const claim = await Claim.findOne({ claimId: req.params.id });
    if (!claim) {
      return res.status(404).json({ success: false, message: "Klaim tidak ditemukan." });
    }

    console.log("🎯 claim.userId:", claim.userId);
    console.log("🎯 type:", typeof claim.userId);
    
    const barang = await Barang.findOne({ barangId: claim.barangId }).lean();
    const namaBarang = barang?.nama || claim.namaBarang || claim.barangId;

    claim.status = status;
    if (catatan) claim.catatan = catatan;
    await claim.save();

    if (status === "disetujui") {
      await Barang.findOneAndUpdate({ barangId: claim.barangId }, { status: "dipinjam" });
    }

    const isApproved = status === "disetujui";

    // Debug — hapus setelah konfirmasi notif berfungsi
    console.log("🎯 Sending notif to userId:", String(claim.userId));

    // Notif untuk ADMIN
    createNotif({
      title: isApproved ? "✅ Klaim Disetujui" : "❌ Klaim Ditolak",
      desc: `Klaim untuk "${namaBarang}" telah ${status}${catatan ? ` - ${catatan}` : ""}`,
      category: "Lost & Found",
      icon: isApproved ? "✅" : "❌",
      iconBg: isApproved ? "#dcfce7" : "#fee2e2",
      refType: "Claim",
      refId: claim._id.toString(),
      target: "admin",
    }).catch((err) => console.error("❌ Notif admin failed:", err));

    // Notif untuk USER yang mengajukan klaim
    createNotif({
      title: isApproved ? "✅ Klaim Anda Disetujui!" : "❌ Klaim Anda Ditolak",
      desc: isApproved
        ? `Klaim untuk "${namaBarang}" disetujui. Silakan ambil barang di lokasi yang ditentukan.`
        : `Klaim untuk "${namaBarang}" ditolak${catatan ? `: ${catatan}` : "."}`,
      category: "Lost & Found",
      icon: isApproved ? "✅" : "❌",
      iconBg: isApproved ? "#dcfce7" : "#fee2e2",
      refType: "Claim",
      refId: claim._id.toString(),
      target: String(claim.userId), // harus sama persis dengan userId di JWT payload
    }).catch((err) => console.error("❌ Notif user failed:", err));

    return res.json({ success: true, message: `Klaim berhasil ${status}`, data: claim });
  } catch (error) {
    console.error("❌ updateClaimStatus error:", error);
    console.error("   Stack:", error.stack);
    return res.status(500).json({ success: false, message: "Gagal update status klaim." });
  }
};

/* ═════════════════════════════════════════════
   GET MY CLAIMS (USER)
═════════════════════════════════════════════ */
const getMyClaims = async (req, res) => {
  try {
    const userId = req.user.userId;
    const claims = await Claim.find({ userId }).sort({ createdAt: -1 }).lean();

    if (claims.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const barangIds = [...new Set(claims.map((c) => c.barangId))];
    const barangList = await Barang.find({ barangId: { $in: barangIds } }).lean();
    const barangMap = Object.fromEntries(barangList.map((b) => [b.barangId, b]));

    const enriched = claims.map((claim) => {
      const barang = barangMap[claim.barangId];
      return {
        ...claim,
        barangId: barang
          ? { barangId: barang.barangId, nama: barang.nama, lokasi: barang.lokasi, foto: barang.foto ?? null }
          : { barangId: claim.barangId, nama: claim.namaBarang ?? "Barang tidak diketahui", lokasi: claim.lokasiBarang ?? "-", foto: null },
      };
    });

    return res.json({ success: true, data: enriched });
  } catch (error) {
    console.error("getMyClaims error:", error);
    return res.status(500).json({ success: false, message: "Gagal mengambil klaim user." });
  }
};

/* ═════════════════════════════════════════════
   EXPORT
═════════════════════════════════════════════ */
module.exports = {
  createClaim,
  getAllClaims,
  getMyClaims,
  updateClaimStatus,
};