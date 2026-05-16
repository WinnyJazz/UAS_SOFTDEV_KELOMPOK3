const Informasi = require("../models/Informasi");

// GET /api/informasi (Publik & Admin)
exports.getAllInformasi = async (req, res) => {
  try {
    const info = await Informasi.find().sort({ tanggal: -1 });
    res.json({ success: true, data: info });
  } catch (err) {
    console.error("getAllInformasi error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/informasi (Khusus Admin)
exports.createInformasi = async (req, res) => {
  try {
    const { judul, isi, media, kategori } = req.body;
    
    // Asumsi req.user berisi data token admin (adminId / id)
    // Sesuaikan properti req.user.id atau req.user.adminId dengan struktur JWT kamu
    const adminId = req.user?.adminId || req.user?.id || "admin-system"; 

    if (!judul || !isi || !kategori) {
      return res.status(400).json({ success: false, message: "Judul, isi, dan kategori wajib diisi" });
    }

    const newInfo = await Informasi.create({
      adminId,
      judul,
      isi,
      media: media || null,
      kategori,
    });

    res.status(201).json({ success: true, data: newInfo, message: "Informasi berhasil ditambahkan" });
  } catch (err) {
    console.error("createInformasi error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/informasi/:id (Khusus Admin)
exports.deleteInformasi = async (req, res) => {
  try {
    const { id } = req.params;
    // Cari berdasarkan informasiId (custom ID) atau _id MongoDB
    const info = await Informasi.findOneAndDelete({ 
      $or: [{ informasiId: id }, { _id: id }] 
    });

    if (!info) {
      return res.status(404).json({ success: false, message: "Informasi tidak ditemukan" });
    }

    res.json({ success: true, message: "Informasi berhasil dihapus" });
  } catch (err) {
    console.error("deleteInformasi error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};