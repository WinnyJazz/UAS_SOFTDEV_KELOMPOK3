const mongoose = require("mongoose");

const ClaimSchema = new mongoose.Schema(
  {
    claimId: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    // Relasi ke Mahasiswa (Melakukan)
    userId: {
      type: String,
      required: true,
      ref: "Mahasiswa",
    },
    // Relasi ke Barang (Merujuk) - Many Claim ke 1 Barang
    barangId: {
      type: String,
      required: true,
      ref: "Barang",
    },
    nama: {
      type: String,
      required: true,
    },
    nim: {
      type: String,
      required: true,
    },
    nomorTelepon: {
      type: String,
      required: true,
    },
    fotoKTM: {
      type: String, // Cloudinary URL
      required: true,
    },
    tanggal: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "disetujui", "ditolak", "selesai"],
      default: "pending",
    },
    catatan: {
      type: String,
      default: null,
    },
    namaBarang: {
      type: String,
      default: null,
    },
    lokasiBarang: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ClaimSchema.methods.getStatus = function () {
  return this.status;
};

module.exports = mongoose.model("Claim", ClaimSchema);