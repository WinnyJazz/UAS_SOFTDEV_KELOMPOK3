// controllers/claimController.js
// ✅ Clean version + Notifikasi terstruktur

const mongoose = require("mongoose");
const Claim = require("../models/Claim");
const Barang = require("../models/Barang");
const cloudinary = require("../config/cloudinary");

// 🔔 Notifikasi helper
const { createNotif } = require("../utils/notifHelper");

/* ═════════════════════════════════════════════
   CREATE CLAIM (USER SUBMIT KLAIM)
═════════════════════════════════════════════ */
const createClaim = async (req, res) => {
  try {
    const { barangId, nama, nim, nomorTelepon, fotoKTM } = req.body;
    const userId = req.user.userId;

    if (!barangId || !nama || !nim || !nomorTelepon || !fotoKTM) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi.",
      });
    }

    // cari barang
    const barang = await Barang.findOne({ barangId });

    if (!barang) {
      return res.status(404).json({
        success: false,
        message: "Barang tidak ditemukan.",
      });
    }

    if (barang.status !== "tersedia") {
      return res.status(400).json({
        success: false,
        message: "Barang sudah tidak tersedia untuk diklaim.",
      });
    }

    // cek duplikasi claim
    const existingClaim = await Claim.findOne({ userId, barangId });
    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: "Kamu sudah pernah mengajukan klaim untuk barang ini.",
      });
    }

    // upload KTM
    let fotoKtmUrl = null;
    if (fotoKTM) {
      const uploadResult = await cloudinary.uploader.upload(fotoKTM, {
        folder: "claims-ktm",
        resource_type: "image",
      });
      fotoKtmUrl = uploadResult.secure_url;
    }

    // create claim
    const claim = await Claim.create({
      userId,
      barangId,
      nama,
      nim,
      nomorTelepon,
      fotoKTM: fotoKtmUrl,
      status: "pending",
    });

    /* ─────────────────────────────────────────
       🔔 NOTIF: CLAIM MASUK (INI YANG PENTING)
    ───────────────────────────────────────── */
      await createNotif({
        title: "Pengajuan Klaim Baru",
        desc: `${nama} (NIM: ${nim}) mengajukan klaim untuk barang "${barang.nama}".`,
        category: "Lost & Found", // 🔥 HARUS PERSIS SAMA DENGAN ENUM
        icon: "📦",
        iconBg: "#fef3c7",
        refType: "claim",
        refId: claim.claimId,
        target: "admin",
      });

    return res.status(201).json({
      success: true,
      message: "Pengajuan klaim berhasil dikirim.",
      data: claim,
    });
  } catch (error) {
    console.error("createClaim error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal membuat pengajuan klaim.",
    });
  }
};

/* ═════════════════════════════════════════════
   GET ALL CLAIMS (ADMIN)
═════════════════════════════════════════════ */
const getAllClaims = async (req, res) => {
  try {
    const claims = await Claim.find()
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      claims.map(async (claim) => {
        const barang = await Barang.findOne({ barangId: claim.barangId });
        const user = await mongoose.model("Mahasiswa").findOne({
          userId: claim.userId,
        });

        return {
          ...claim,
          barang,
          user,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error("getAllClaims error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data klaim.",
    });
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
      return res.status(404).json({
        success: false,
        message: "Klaim tidak ditemukan.",
      });
    }

    claim.status = status;
    if (catatan) claim.catatan = catatan;
    await claim.save();

    if (status === "disetujui") {
      await Barang.findOneAndUpdate(
        { barangId: claim.barangId },
        { status: "dipinjam" }
      );
    }

    const isApproved = status === "disetujui";

    await createNotif({
      title: isApproved ? "Klaim Disetujui" : "Klaim Ditolak",
      desc: `Klaim barang "${claim.barangId}" telah ${status}${
        catatan ? ` - ${catatan}` : ""
      }`,
      category: "Lost & Found",
      icon: isApproved ? "✅" : "❌",
      iconBg: isApproved ? "#dcfce7" : "#fee2e2",
      refType: "claim",
      refId: claim.claimId, // ✅ konsisten pakai claimId
      target: "admin",
    });

    return res.json({
      success: true,
      message: `Klaim berhasil ${status}`,
      data: claim,
    });
  } catch (error) {
    console.error("updateClaimStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal update status klaim.",
    });
  }
};

/* ═════════════════════════════════════════════
   GET MY CLAIMS (USER)
═════════════════════════════════════════════ */
const getMyClaims = async (req, res) => {
  try {
    const userId = req.user.userId;

    const claims = await Claim.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      claims.map(async (claim) => {
        const barang = await Barang.findOne({
          barangId: claim.barangId,
        });

        return {
          ...claim,
          barang,
        };
      })
    );

    return res.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error("getMyClaims error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil klaim user.",
    });
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