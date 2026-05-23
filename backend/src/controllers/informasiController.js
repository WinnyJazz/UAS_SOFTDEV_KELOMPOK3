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
    const adminId = req.user?.adminId || req.user?.id || "admin-system";

    if (!judul || !isi || !kategori) {
      return res.status(400).json({ success: false, message: "Judul, isi, dan kategori wajib diisi" });
    }

    const newInfo = await Informasi.create({
      adminId,
      judul,
      isi,
      media: Array.isArray(media) ? media : media ? [media] : [],
      kategori,
    });

    res.status(201).json({ success: true, data: newInfo, message: "Informasi berhasil ditambahkan" });
  } catch (err) {
    console.error("createInformasi error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/informasi/:id
exports.getInformasiById = async (req, res) => {
  try {
    const { id } = req.params;
    const info = await Informasi.findOne({
      $or: [{ informasiId: id }, { _id: id }]
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


  // PUT /api/informasi/:id (Khusus Admin)
exports.updateInformasi = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, isi, media, kategori, timeline, contactPerson, judulLinkTerkait, linkTerkait } = req.body;

    const updated = await Informasi.findOneAndUpdate(
      { $or: [{ informasiId: id }, { _id: id }] },
      { judul, isi, media: Array.isArray(media) ? media : media ? [media] : [], kategori, timeline, contactPerson, judulLinkTerkait, linkTerkait },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Informasi tidak ditemukan" });
    }

    res.json({ success: true, data: updated, message: "Informasi berhasil diperbarui" });
  } catch (err) {
    console.error("updateInformasi error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/informasi/:id (Khusus Admin)
exports.deleteInformasi = async (req, res) => {
  try {
    const { id } = req.params;
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