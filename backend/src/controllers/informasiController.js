const Informasi = require("../models/Informasi");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const { Readable } = require("stream");
const { createNotif } = require("../utils/notifHelper");

// ── Multer: simpan di memory ──
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ── Helper: upload buffer ke Cloudinary ──
const uploadToCloudinary = (buffer, folder = "informasi") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

// ── Helper: hapus gambar dari Cloudinary by URL ──
const deleteFromCloudinary = async (urls = []) => {
  for (const url of urls) {
    try {
      const parts = url.split("/");
      const filenameWithExt = parts[parts.length - 1];
      const folder = parts[parts.length - 2];
      const publicId = `${folder}/${filenameWithExt.split(".")[0]}`;
      await cloudinary.uploader.destroy(publicId);
    } catch (e) {
      console.error("Gagal hapus dari Cloudinary:", e.message);
    }
  }
};

exports.upload = upload;

exports.getAllInformasi = async (req, res) => {
  try {
    const info = await Informasi.find().sort({ tanggal: -1 });
    res.json({ success: true, data: info });
  } catch (err) {
    console.error("getAllInformasi error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getInformasiById = async (req, res) => {
  try {
    const { id } = req.params;
    const info = await Informasi.findOne({
      $or: [{ informasiId: id }, { _id: id }],
    });
    if (!info) {
      return res.status(404).json({ success: false, message: "Informasi tidak ditemukan" });
    }
    res.json({ success: true, data: info });
  } catch (err) {
    console.error("getInformasiById error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.createInformasi = async (req, res) => {
  try {
    const { judul, isi, kategori, timeline, contactPerson, judulLinkTerkait, linkTerkait } = req.body;
    const adminId = req.user?.adminId || req.user?.id || "admin-system";

    if (!judul || !isi || !kategori) {
      return res.status(400).json({ success: false, message: "Judul, isi, dan kategori wajib diisi" });
    }

    const mediaUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        mediaUrls.push(url);
      }
    }

    const newInfo = await Informasi.create({
      adminId,
      judul,
      isi,
      media: mediaUrls,
      kategori,
      timeline,
      contactPerson,
      judulLinkTerkait,
      linkTerkait,
    });

    // Buat notifikasi untuk semua user
    console.log("📝 Membuat notifikasi info...");
    const notifResult = await createNotif({
      title: `📢 Info Baru: ${judul}`,
      desc: isi.substring(0, 100),
      category: "Info",
      icon: "📰",
      iconBg: "#fef3c7",
      refType: "Informasi",
      refId: newInfo._id.toString(),
      target: "all",
    });
    console.log("✅ Notifikasi info berhasil:", notifResult ? notifResult._id : "null");

    res.status(201).json({ success: true, data: newInfo, message: "Informasi berhasil ditambahkan" });
  } catch (err) {
    console.error("❌ createInformasi error:", err);
    console.error("   Stack:", err.stack);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateInformasi = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, isi, kategori, timeline, contactPerson, judulLinkTerkait, linkTerkait, keepMedia } = req.body;

    const existing = await Informasi.findOne({
      $or: [{ informasiId: id }, { _id: id }],
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Informasi tidak ditemukan" });
    }

    const kept = Array.isArray(keepMedia) ? keepMedia : keepMedia ? [keepMedia] : [];
    const toDelete = existing.media.filter((url) => !kept.includes(url));
    await deleteFromCloudinary(toDelete);

    const newUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        newUrls.push(url);
      }
    }

    const updatedMedia = [...kept, ...newUrls];

    const updated = await Informasi.findOneAndUpdate(
      { $or: [{ informasiId: id }, { _id: id }] },
      { judul, isi, media: updatedMedia, kategori, timeline, contactPerson, judulLinkTerkait, linkTerkait },
      { new: true }
    );

    res.json({ success: true, data: updated, message: "Informasi berhasil diperbarui" });
  } catch (err) {
    console.error("updateInformasi error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteInformasi = async (req, res) => {
  try {
    const { id } = req.params;
    const info = await Informasi.findOneAndDelete({
      $or: [{ informasiId: id }, { _id: id }],
    });

    if (!info) {
      return res.status(404).json({ success: false, message: "Informasi tidak ditemukan" });
    }

    await deleteFromCloudinary(info.media || []);

    res.json({ success: true, message: "Informasi berhasil dihapus" });
  } catch (err) {
    console.error("deleteInformasi error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};