const mongoose = require("mongoose");

const BarangSchema = new mongoose.Schema(
  {
    barangId: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    nama: {
      type: String,
      required: true,
      trim: true,
    },
    deskripsi: {
      type: String,
      trim: true,
    },
    kategori: {
      type: String,
      default: "umum",
    },
    lokasi: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["tersedia", "dipinjam", "hilang", "rusak"],
      default: "tersedia",
    },
    // foto = Firebase Storage URL (foto barang)
    foto: {
      type: String,
      default: null,
    },
    tanggal: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

BarangSchema.methods.isAvailable = function () {
  return this.status === "tersedia";
};

module.exports = mongoose.model("Barang", BarangSchema);