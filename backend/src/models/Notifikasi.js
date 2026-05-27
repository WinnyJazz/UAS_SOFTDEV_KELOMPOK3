const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const NotifikasiSchema = new mongoose.Schema(
  {
    notifId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },

    // Judul singkat notifikasi
    title: {
      type: String,
      required: true,
    },

    // Deskripsi detail
    desc: {
      type: String,
      default: "",
    },

    // Kategori: "Lost & Found" | "Aspirasi" | "User" | "Sistem"
    category: {
      type: String,
      enum: ["Lost & Found", "Aspirasi", "User", "Sistem"],
      default: "Sistem",
    },

    // Emoji icon dan warna background
    icon: {
      type: String,
      default: "🔔",
    },
    iconBg: {
      type: String,
      default: "#e0e7ff",
    },

    // Sudah dibaca atau belum
    read: {
      type: Boolean,
      default: false,
    },

    // Target penerima: "admin" | userId spesifik
    target: {
      type: String,
      default: "admin",
    },

    // Referensi ke entitas terkait (opsional)
    refType: {
      type: String,
      enum: ["claim", "barang", "aspirasi", "jawaban", null],
      default: null,
    },
    refId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notifikasi", NotifikasiSchema);