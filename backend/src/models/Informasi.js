const mongoose = require("mongoose");

const InformasiSchema = new mongoose.Schema(
  {
    informasiId: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    // Relasi ke Admin (yang publish)
    adminId: {
      type: String,
      required: true,
      ref: "Admin",
    },
    judul: {
      type: String,
      required: true,
      trim: true,
    },
    isi: {
      type: String,
      required: true,
    },
    tanggal: {
      type: Date,
      default: Date.now,
    },
    // media = Firebase Storage URL
    // Bisa foto atau video, simpan URL-nya aja
    media: {
      type: String, // single URL
      default: null,
      // Kalau di masa depan mau support multiple media, bisa pakai:
      // type: [String], default: []
    },
    kategori: {
      type: String,
      required: true,
      // contoh: "pengumuman", "berita", "kegiatan", dll
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Informasi", InformasiSchema);