const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Mahasiswa = require("../models/Mahasiswa");
const { sendVerificationEmail } = require("../utils/emailService");

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { nama, nim, email, password } = req.body;

    // Validasi input
    if (!nama || !nim || !email || !password) {
      return res.status(400).json({ message: "Semua field harus diisi." });
    }

    // Cek duplikat email atau NIM
    const emailExist = await Mahasiswa.findOne({ email });
    if (emailExist) {
      return res.status(409).json({ message: "Email sudah terdaftar." });
    }

    const nimExist = await Mahasiswa.findOne({ nim });
    if (nimExist) {
      return res.status(409).json({ message: "NIM sudah terdaftar." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Buat verification token (random hex 32 byte)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

    // Simpan mahasiswa baru (auto-verified untuk dev)
    const mahasiswa = await Mahasiswa.create({
      nama,
      nim,
      email,
      password: hashedPassword,
      verificationToken: null,
      verificationTokenExpiry: null,
      isVerified: true,
    });

    return res.status(201).json({
      message: "Registrasi berhasil! Silakan login.",
      data: {
        userId: mahasiswa.userId,
        nama: mahasiswa.nama,
        email: mahasiswa.email,
        nim: mahasiswa.nim,
        isVerified: mahasiswa.isVerified,
      },
    });
  } catch (error) {
    console.error("[register]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────
// GET /api/auth/verify-email?token=xxx
// ─────────────────────────────────────────
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token tidak ditemukan." });
    }

    // Cari mahasiswa dengan token yang cocok dan belum expired
    const mahasiswa = await Mahasiswa.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }, // token masih berlaku
    });

    if (!mahasiswa) {
      return res
        .status(400)
        .json({ message: "Token tidak valid atau sudah expired." });
    }

    if (mahasiswa.isVerified) {
      return res.status(200).json({ message: "Akun sudah terverifikasi sebelumnya." });
    }

    // Tandai sebagai verified & hapus token
    mahasiswa.isVerified = true;
    mahasiswa.verificationToken = null;
    mahasiswa.verificationTokenExpiry = null;
    await mahasiswa.save();

    return res.status(200).json({ message: "Email berhasil diverifikasi! Silakan login." });
  } catch (error) {
    console.error("[verifyEmail]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, nim, password } = req.body;

    // Harus kirim email ATAU nim, plus password
    if ((!email && !nim) || !password) {
      return res
        .status(400)
        .json({ message: "Email/NIM dan password harus diisi." });
    }

    // Cari mahasiswa by email atau NIM
    const query = email ? { email } : { nim };
    const mahasiswa = await Mahasiswa.findOne(query);

    if (!mahasiswa) {
      return res.status(401).json({ message: "Email/NIM atau password salah." });
    }

    // Cek apakah sudah verifikasi email
    if (!mahasiswa.isVerified) {
      return res.status(403).json({
        message:
          "Akun belum diverifikasi. Cek email kamu untuk link verifikasi.",
      });
    }

    // Cek password
    const isPasswordValid = await bcrypt.compare(password, mahasiswa.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email/NIM atau password salah." });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: mahasiswa.userId,
        email: mahasiswa.email,
        role: mahasiswa.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(200).json({
      message: "Login berhasil.",
      token,
      data: {
        userId: mahasiswa.userId,
        nama: mahasiswa.nama,
        email: mahasiswa.email,
        nim: mahasiswa.nim,
        role: mahasiswa.role,
      },
    });
  } catch (error) {
    console.error("[login]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────
// POST /api/auth/resend-verification
// Kalau token expired, user bisa minta kirim ulang
// ─────────────────────────────────────────
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email harus diisi." });
    }

    const mahasiswa = await Mahasiswa.findOne({ email });

    if (!mahasiswa) {
      // Jangan kasih info spesifik (security)
      return res.status(200).json({
        message: "Kalau email terdaftar, link verifikasi sudah dikirim.",
      });
    }

    if (mahasiswa.isVerified) {
      return res.status(400).json({ message: "Akun sudah terverifikasi." });
    }

    // Generate token baru
    const verificationToken = crypto.randomBytes(32).toString("hex");
    mahasiswa.verificationToken = verificationToken;
    mahasiswa.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await mahasiswa.save();

    await sendVerificationEmail(email, mahasiswa.nama, verificationToken);

    return res.status(200).json({
      message: "Link verifikasi baru sudah dikirim ke email kamu.",
    });
  } catch (error) {
    console.error("[resendVerification]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

module.exports = { register, verifyEmail, login, resendVerification };