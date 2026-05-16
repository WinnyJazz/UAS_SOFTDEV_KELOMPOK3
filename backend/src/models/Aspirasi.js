const mongoose = require("mongoose");

const AspirasiSchema = new mongoose.Schema(
  {
    aspirasiId: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    // Relasi ke Mahasiswa
    userId: {
      type: String,
      required: true,
      ref: "Mahasiswa",
    },
    judul: {
      type: String,
      required: true,
      trim: true,
    },
    deskripsi: {
      type: String,
      required: true,
    },
    kategori: {
      type: String,
      required: true,
      // contoh: "fasilitas", "akademik", "keamanan", dll
    },
    // lampiran = Firebase Storage URL (foto/dokumen pendukung)
    lampiran: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "diproses", "ditolak", "disetujui"],
      default: "pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    responAdmin: {
      type: String,
      default: null,
    },

  },
  {
    versionKey: false,
  }
);

AspirasiSchema.methods.getDetail = function () {
  return {
    aspirasiId: this.aspirasiId,
    judul: this.judul,
    deskripsi: this.deskripsi,
    kategori: this.kategori,
    status: this.status,
    lampiran: this.lampiran,
    createdAt: this.createdAt,
  };
};



module.exports = mongoose.model("Aspirasi", AspirasiSchema);