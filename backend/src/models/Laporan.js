const mongoose = require("mongoose");

const LaporanSchema = new mongoose.Schema(
  {
    laporanId: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    userId: {
      type: String,
      required: true,
      ref: "Mahasiswa",
    },
    namaBarang: {
      type: String,
      required: true,
    },
    deskripsi: {
      type: String,
      default: "",
    },
    lokasi: {
      type: String,
      required: true,
    },
    tanggal: {
      type: Date,
      default: Date.now,
    },
    foto: {
      type: String, // Cloudinary URL
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "diterima", "ditemukan"],
      default: "pending",
    },
    pesanAdmin: {
      type: String,
      default: null, // e.g., "Barang bisa diambil di R.904 Lt.9 mulai besok"
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

module.exports = mongoose.model("Laporan", LaporanSchema);
