const mongoose = require("mongoose");

const MahasiswaSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    nama: {
      type: String,
      required: true,
      trim: true,
    },
    nickname: {
      type: String,
      default: null,
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    nim: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      default: "mahasiswa",
      enum: ["mahasiswa", "admin"],
    },

    // === Email Verification ===
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpiry: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordTokenExpiry: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

MahasiswaSchema.methods.getPesanNotifikasi = function () {
  return `Notifikasi untuk mahasiswa: ${this.nama}`;
};

module.exports = mongoose.model("Mahasiswa", MahasiswaSchema);