const mongoose = require("mongoose");

const notifikasiSchema = new mongoose.Schema(
  {
    notifId: {
      type: String,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    desc: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: ["Lost & Found", "Aspirasi", "Info", "Sistem"],
      default: "Sistem",
    },

    icon: {
      type: String,
      default: "🔔",
    },

    iconBg: {
      type: String,
      default: "#e0e7ff",
    },

    // siapa target notif (admin / user / all = broadcast ke semua user)
    target: {
      type: String,
      enum: ["admin", "user", "all"],
      default: "admin",
    },

    // status read
    read: {
      type: Boolean,
      default: false,
    },

    // optional reference (biar bisa klik ke data asal notif)
    refType: {
      type: String, // contoh: "barang", "aspirasi", "claim"
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

/**
 * notifId dibuat langsung di notifHelper.js, bukan di pre-hook
 * untuk menghindari issues dengan Mongoose model caching
 */

module.exports =
  mongoose.models.Notifikasi ||
  mongoose.model("Notifikasi", notifikasiSchema);