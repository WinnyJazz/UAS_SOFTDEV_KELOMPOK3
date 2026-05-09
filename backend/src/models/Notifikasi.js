const mongoose = require("mongoose");

const NotifikasiSchema = new mongoose.Schema(
  {
    notifikasiId: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    // Relasi ke Mahasiswa (penerima notifikasi)
    userId: {
      type: String,
      required: true,
      ref: "Mahasiswa",
    },
    pesan: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // target = referensi ke object Notifiable (Aspirasi / Claim / Informasi)
    // Karena MongoDB flexible, kita pakai refPath pattern
    target: {
      refId: {
        type: String,
        required: true,
      },
      refModel: {
        type: String,
        required: true,
        enum: ["Aspirasi", "Claim", "Informasi", "Barang"],
      },
    },
  },
  {
    versionKey: false,
  }
);

NotifikasiSchema.methods.tandaiBaca = async function () {
  this.isRead = true;
  await this.save();
};

module.exports = mongoose.model("Notifikasi", NotifikasiSchema);