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
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

ClaimSchema.methods.getStatus = function () {
  return this.status;
};

module.exports = mongoose.model("Claim", ClaimSchema);