const Barang = require("../models/Barang");
const cloudinary = require("../config/cloudinary");

// Helper: extract Cloudinary public_id from URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/folder/filename.ext
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const pathWithVersion = parts[1]; // v123/folder/filename.ext
    const pathWithoutExt = pathWithVersion.replace(/\.[^/.]+$/, ""); // remove extension
    // Remove version prefix if present
    const segments = pathWithoutExt.split("/");
    if (segments[0].startsWith("v") && /^\d+$/.test(segments[0].slice(1))) {
      segments.shift();
    }
    return segments.join("/");
  } catch {
    return null;
  }
};

// GET /api/barang — Ambil semua barang
const getAllBarang = async (req, res) => {
  try {
    const { search, tanggal, lokasi } = req.query;
    let filter = {};

    if (search) {
      filter.nama = { $regex: search, $options: "i" };
    }

    if (lokasi) {
      filter.lokasi = { $regex: lokasi, $options: "i" };
    }

    if (tanggal) {
      // Filter untuk satu hari penuh (00:00:00 s/d 23:59:59)
      const dateStart = new Date(tanggal);
      dateStart.setHours(0, 0, 0, 0);

      const dateEnd = new Date(tanggal);
      dateEnd.setHours(23, 59, 59, 999);

      filter.tanggal = {
        $gte: dateStart,
        $lte: dateEnd,
      };
    }

    const barangList = await Barang.find(filter).sort({ tanggal: -1 });

    res.status(200).json({
      success: true,
      data: barangList,
    });
  } catch (error) {
    console.error("getAllBarang error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data barang." });
  }
};

// GET /api/barang/:id — Ambil satu barang
const getBarangById = async (req, res) => {
  try {
    const barang = await Barang.findOne({ barangId: req.params.id });

    if (!barang) {
      return res.status(404).json({ success: false, message: "Barang tidak ditemukan." });
    }

    res.status(200).json({ success: true, data: barang });
  } catch (error) {
    console.error("getBarangById error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data barang." });
  }
};

// POST /api/barang — Tambah barang baru
const createBarang = async (req, res) => {
  try {
    const { nama, lokasi, tanggal, kategori, deskripsi, foto } = req.body;

    if (!nama || !lokasi) {
      return res.status(400).json({ success: false, message: "Nama dan lokasi wajib diisi." });
    }

    let fotoUrl = null;

    // Upload foto ke Cloudinary jika ada (base64)
    if (foto) {
      const uploadResult = await cloudinary.uploader.upload(foto, {
        folder: "lost-and-found",
        resource_type: "image",
      });
      fotoUrl = uploadResult.secure_url;
    }

    const barang = new Barang({
      nama,
      lokasi,
      tanggal: tanggal || Date.now(),
      kategori: kategori || "umum",
      deskripsi: deskripsi || "",
      foto: fotoUrl,
      status: "tersedia",
    });

    await barang.save();

    res.status(201).json({
      success: true,
      message: "Barang berhasil ditambahkan.",
      data: barang,
    });
  } catch (error) {
    console.error("createBarang error:", error);
    res.status(500).json({ success: false, message: "Gagal menambahkan barang." });
  }
};

// PUT /api/barang/:id — Update barang
const updateBarang = async (req, res) => {
  try {
    const barang = await Barang.findOne({ barangId: req.params.id });

    if (!barang) {
      return res.status(404).json({ success: false, message: "Barang tidak ditemukan." });
    }

    const { nama, lokasi, tanggal, kategori, deskripsi, foto } = req.body;

    // Kalau ada foto baru (base64), upload ke Cloudinary & hapus yang lama
    if (foto && foto.startsWith("data:")) {
      // Hapus foto lama dari Cloudinary
      const oldPublicId = getPublicIdFromUrl(barang.foto);
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId).catch(() => { });
      }

      const uploadResult = await cloudinary.uploader.upload(foto, {
        folder: "lost-and-found",
        resource_type: "image",
      });
      barang.foto = uploadResult.secure_url;
    }

    if (nama) barang.nama = nama;
    if (lokasi) barang.lokasi = lokasi;
    if (tanggal) barang.tanggal = tanggal;
    if (kategori) barang.kategori = kategori;
    if (deskripsi !== undefined) barang.deskripsi = deskripsi;

    await barang.save();

    res.status(200).json({
      success: true,
      message: "Barang berhasil diupdate.",
      data: barang,
    });
  } catch (error) {
    console.error("updateBarang error:", error);
    res.status(500).json({ success: false, message: "Gagal mengupdate barang." });
  }
};

// DELETE /api/barang/:id — Hapus barang
const deleteBarang = async (req, res) => {
  try {
    const barang = await Barang.findOne({ barangId: req.params.id });

    if (!barang) {
      return res.status(404).json({ success: false, message: "Barang tidak ditemukan." });
    }

    // Hapus foto dari Cloudinary
    const publicId = getPublicIdFromUrl(barang.foto);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch(() => { });
    }

    await Barang.deleteOne({ barangId: req.params.id });

    res.status(200).json({
      success: true,
      message: "Barang berhasil dihapus.",
    });
  } catch (error) {
    console.error("deleteBarang error:", error);
    res.status(500).json({ success: false, message: "Gagal menghapus barang." });
  }
};

// PATCH /api/barang/:id/done — Tandai barang selesai
const markDone = async (req, res) => {
  try {
    const barang = await Barang.findOne({ barangId: req.params.id });

    if (!barang) {
      return res.status(404).json({ success: false, message: "Barang tidak ditemukan." });
    }

    barang.status = "dipinjam"; // "dipinjam" = sudah dikembalikan/selesai
    await barang.save();

    res.status(200).json({
      success: true,
      message: "Barang ditandai sebagai selesai.",
      data: barang,
    });
  } catch (error) {
    console.error("markDone error:", error);
    res.status(500).json({ success: false, message: "Gagal menandai barang." });
  }
};

// GET /api/barang/locations/available — Ambil daftar lokasi dari barang yang tersedia
const getAvailableLocations = async (req, res) => {
  try {
    // Ambil lokasi unik dari barang dengan status 'tersedia'
    const locations = await Barang.distinct("lokasi", { status: "tersedia" });

    // Sort lokasi secara alfabetik
    const sortedLocations = locations.sort();

    res.status(200).json({
      success: true,
      data: sortedLocations,
    });
  } catch (error) {
    console.error("getAvailableLocations error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil daftar lokasi." });
  }
};

module.exports = {
  getAllBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang,
  markDone,
  getAvailableLocations,
};
