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
      enum: ["Lost & Found", "Aspirasi", "User", "Sistem"],
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

    // siapa target notif (admin / user)
    target: {
      type: String,
      enum: ["admin", "user"],
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
 * Auto generate notifId biar gampang tracking
 */
notifikasiSchema.pre("save", function (next) {
  if (!this.notifId) {
    this.notifId = `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports =
  mongoose.models.Notifikasi ||
  mongoose.model("Notifikasi", notifikasiSchema);