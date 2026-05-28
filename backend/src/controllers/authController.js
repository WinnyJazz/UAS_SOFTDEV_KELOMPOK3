const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Mahasiswa = require("../models/Mahasiswa");
const Admin = require("../models/Admin");
const cloudinary = require('../config/cloudinary');
const { sendVerificationEmail, sendResetPasswordEmail } = require("../utils/emailService");

// ─────────────────────────────────────────
// HELPER: Extract NIM dari email
// Format: nama.NIM@stu.untar.ac.id
// ─────────────────────────────────────────
const extractNimFromEmail = (email) => {
  // Email format: nama.NIM@stu.untar.ac.id
  const emailParts = email.split("@")[0]; // ambil bagian sebelum @
  const parts = emailParts.split("."); // split dengan .

  // NIM adalah bagian terakhir sebelum @
  if (parts.length > 0) {
    const nim = parts[parts.length - 1]; // ambil bagian terakhir
    return nim;
  }
  return null;
};

// ─────────────────────────────────────────
// HELPER: Validasi NIM
// ─────────────────────────────────────────
const validateNim = (nim) => {
  const nimRegex = /^\d{9}$/;
  if (!nimRegex.test(nim)) {
    return { valid: false, error: "NIM harus terdiri dari 9 digit angka." };
  }

  const nimPrefix = nim.substring(0, 3);
  if (!["535", "825"].includes(nimPrefix)) {
    return { valid: false, error: "NIM tidak valid. Hanya mahasiswa FTI (TI: 535xxx, SI: 825xxx) yang bisa mendaftar." };
  }

  return { valid: true };
};

// ─────────────────────────────────────────
// HELPER: Validasi input registrasi
// ─────────────────────────────────────────
const validateRegistrationInput = (nama, email, password) => {
  const errors = [];

  // Validasi email: harus @stu.untar.ac.id
  const emailRegex = /^[a-zA-Z0-9._%+-]+@stu\.untar\.ac\.id$/;
  if (!emailRegex.test(email)) {
    errors.push("Email harus menggunakan domain @stu.untar.ac.id");
  }

  // Extract dan validasi NIM dari email
  const nim = extractNimFromEmail(email);
  if (!nim) {
    errors.push("Format email tidak valid. Gunakan format: nama.NIM@stu.untar.ac.id");
  } else {

    const nimValidation = validateNim(nim);
    if (!nimValidation.valid) {
      errors.push(nimValidation.error);
    }
  }

  // Validasi password:
  // - Minimal 8 karakter
  // - Minimal 1 huruf besar
  // - Minimal 1 huruf kecil
  // - Minimal 1 angka
  // - Minimal 1 karakter spesial
  if (password.length < 8) {
    errors.push("Password minimal 8 karakter.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password harus mengandung minimal 1 huruf besar.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password harus mengandung minimal 1 huruf kecil.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password harus mengandung minimal 1 angka.");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password harus mengandung minimal 1 karakter spesial (!@#$%^&* dll).");
  }

  return errors;
};

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { nama, email, password } = req.body;

    // Validasi input
    if (!nama || !email || !password) {
      return res.status(400).json({ message: "Nama, email, dan password harus diisi." });
    }

    // Validasi input
    const validationErrors = validateRegistrationInput(nama, email, password);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validasi gagal.",
        errors: validationErrors,
      });
    }

    // Extract NIM dari email
    const nim = extractNimFromEmail(email);

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

    // Simpan mahasiswa baru (belum verified)
    const mahasiswa = await Mahasiswa.create({
      nama,
      nim,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiry,
      isVerified: false,
    });

    // Kirim verification email
    try {
      await sendVerificationEmail(email, nama, verificationToken);
    } catch (emailError) {
      console.warn("[register] Email send warning:", emailError.message);
      // Lanjut meski email gagal
    }

    return res.status(201).json({
      message: "Registrasi berhasil! Cek email kamu untuk link verifikasi.",
      data: {
        userId: mahasiswa.userId,
        nama: mahasiswa.nama,
        email: mahasiswa.email,
        nim: mahasiswa.nim,
        isVerified: mahasiswa.isVerified,
      },
    });
  } catch (error) {
    console.error("[register] Error:", error.message);

    // Cek asal eror
    if (error.message.includes("email") || error.code === 11000) {
      return res.status(409).json({ message: "Email atau NIM sudah terdaftar." });
    }

    return res.status(500).json({ message: "Terjadi kesalahan server: " + error.message });
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

    let user = null;
    let userType = "";

    // Cari di Mahasiswa dulu
    if (email || nim) {
      const query = email ? { email } : { nim };
      user = await Mahasiswa.findOne(query);
      if (user) {
        userType = "mahasiswa";
      }
    }

    // Jika tidak ditemukan di Mahasiswa, cari di Admin
    if (!user && email) {
      user = await Admin.findOne({ email });
      if (user) {
        userType = "admin";
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Email/NIM atau password salah." });
    }

    // Cek password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email/NIM atau password salah." });
    }

    // Untuk Mahasiswa, cek verifikasi email
    if (userType === "mahasiswa" && !user.isVerified) {
      return res.status(403).json({
        message:
          "Akun belum diverifikasi. Cek email kamu untuk link verifikasi.",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.userId || user.adminId,
        email: user.email,
        role: user.role,
        userType,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(200).json({
      message: "Login berhasil.",
      token,
      data: {
        userId: user.userId || user.adminId,
        nama: user.nama,
        nickname: user.nickname || null,
        profilePhoto: user.profilePhoto || null,
        email: user.email,
        nim: user.nim || null,
        role: user.role,
        userType,
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

    // Kirim email
    try {
      await sendVerificationEmail(email, mahasiswa.nama, verificationToken);
    } catch (emailError) {
      console.warn("[resendVerification] Email send warning:", emailError.message);
      // Token sudah disimpan, kirim response optimis
    }

    return res.status(200).json({
      message: "Link verifikasi baru sudah dikirim ke email kamu.",
    });
  } catch (error) {
    console.error("[resendVerification]", error.message);
    return res.status(500).json({ message: "Terjadi kesalahan server: " + error.message });
  }
};

// ─────────────────────────────────────────
// POST /api/auth/register-admin (hanya superadmin)
// ─────────────────────────────────────────
const registerAdmin = async (req, res) => {
  try {
    const { nama, email, password, role } = req.body;

    // Validasi input
    if (!nama || !email || !password) {
      return res.status(400).json({ message: "Nama, email, dan password harus diisi." });
    }

    // Cek role user yang request
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Hanya superadmin yang bisa register admin." });
    }

    // Validasi role
    if (role && !["admin", "superadmin"].includes(role)) {
      return res.status(400).json({ message: "Role harus 'admin' atau 'superadmin'." });
    }

    // Cek duplikat email
    const emailExist = await Admin.findOne({ email });
    if (emailExist) {
      return res.status(409).json({ message: "Email sudah terdaftar." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan admin baru
    const admin = await Admin.create({
      nama,
      email,
      password: hashedPassword,
      role: role || "admin",
    });

    return res.status(201).json({
      message: "Admin berhasil didaftarkan.",
      data: {
        adminId: admin.adminId,
        nama: admin.nama,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("[registerAdmin]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────
// GET /api/auth/users (hanya admin/superadmin)
// ─────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    if (!["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Akses ditolak." });
    }

    // authController.js - getAllUsers
    const mahasiswas = await Mahasiswa.find({}, {
      password: 0,
      verificationToken: 0,
      verificationTokenExpiry: 0,
      resetPasswordToken: 0,
      resetPasswordTokenExpiry: 0,
      profilePhoto: 0
    });
    const admins = await Admin.find({}, { password: 0 });

    // Email yang sudah ada di Admin collection (mencegah double)
    const adminEmails = new Set(admins.map(a => a.email));

    // Mahasiswa yang role-nya admin tapi TIDAK ada di Admin collection
    const mahasiswaYangJadiAdmin = mahasiswas
      .filter(m => m.role === "admin" && !adminEmails.has(m.email))
      .map(m => ({
        adminId: m.userId,
        nama: m.nama,
        email: m.email,
        nim: m.nim,
        role: m.role,
      }));

    const allAdmins = [
      ...admins.map(a => ({
        adminId: a.adminId,
        nama: a.nama,
        email: a.email,
        nim: a.nim ?? null,
        role: a.role,
      })),
      ...mahasiswaYangJadiAdmin
    ];

    const mahasiswaBiasa = mahasiswas.filter(m => m.role === "mahasiswa");

    return res.status(200).json({
      message: "Data user berhasil diambil.",
      data: {
        mahasiswas: mahasiswaBiasa,
        admins: allAdmins,
        total: mahasiswas.length + admins.length
      }
    });
  } catch (error) {
    console.error("[getAllUsers]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};
// ─────────────────────────────────────────
// POST /api/auth/change-role
// Hanya superadmin yang bisa ubah role mahasiswa
// ─────────────────────────────────────────
const changeRole = async (req, res) => {
  try {
    const { userIds, newRole } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !newRole) {
      return res.status(400).json({ message: "userIds dan newRole harus diisi." });
    }

    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Hanya superadmin yang bisa mengubah role." });
    }

    if (!["mahasiswa", "admin"].includes(newRole)) {
      return res.status(400).json({ message: "Role baru harus 'mahasiswa' atau 'admin'." });
    }

    const updatedUsers = [];

    for (const userId of userIds) {
      const mahasiswa = await Mahasiswa.findOne({ userId });
      if (!mahasiswa) continue;

      if (newRole === "admin") {
        // Cek apakah sudah ada di Admin collection
        const existingAdmin = await Admin.findOne({ email: mahasiswa.email });
        if (!existingAdmin) {
          // Pindahkan ke Admin collection
          await Admin.create({
            nama: mahasiswa.nama,
            email: mahasiswa.email,
            password: mahasiswa.password,
            nim: mahasiswa.nim,
            role: "admin",
          });
        } else {
          existingAdmin.role = "admin";
          await existingAdmin.save();
        }

        mahasiswa.role = "admin";
        await mahasiswa.save();

        updatedUsers.push({ nama: mahasiswa.nama, email: mahasiswa.email, role: "admin" });
      } else {
        // Downgrade langsung di Mahasiswa
        mahasiswa.role = newRole;
        await mahasiswa.save();
        updatedUsers.push({ userId: mahasiswa.userId, nama: mahasiswa.nama, email: mahasiswa.email, role: mahasiswa.role });
      }
    }

    return res.status(200).json({
      message: `Role berhasil diubah untuk ${updatedUsers.length} user.`,
      data: updatedUsers,
    });
  } catch (error) {
    console.error("[changeRole]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};
// ─────────────────────────────────────────
// POST /api/auth/downgrade-admin
// Hanya superadmin yang bisa downgrade admin ke mahasiswa
// ─────────────────────────────────────────
const downgradeAdmin = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "userIds (array) harus diisi dan tidak kosong." });
    }

    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Hanya superadmin yang bisa downgrade admin." });
    }

    const downgradedUsers = [];

    for (const id of userIds) {
      // Coba cari di Admin collection dulu (admin murni)
      const adminDoc = await Admin.findOne({ adminId: id, role: "admin" });

      if (adminDoc) {
        const existing = await Mahasiswa.findOne({ email: adminDoc.email });
        if (!existing && adminDoc.nim) {
          existing = await Mahasiswa.findOne({ nim: adminDoc.nim });
        }
        if (existing) {
          existing.role = "mahasiswa";  // restore role, NIM tetap sama
          await existing.save();
        } else {
          // Fallback kalau memang tidak ada (edge case)
          await Mahasiswa.create({
            nama: adminDoc.nama,
            email: adminDoc.email,
            password: adminDoc.password,
            nim: adminDoc.nim,  // pakai NIM dari Admin collection
            role: "mahasiswa",
            isVerified: true,
          });
        }
        await Admin.deleteOne({ adminId: id });
        downgradedUsers.push({ nama: adminDoc.nama, email: adminDoc.email, role: "mahasiswa" });
        continue;
      }

      // Kalau tidak ada di Admin collection, cari di Mahasiswa collection (mahasiswa yang di-upgrade)
      const mahasiswaDoc = await Mahasiswa.findOne({ userId: id, role: "admin" });
      if (mahasiswaDoc) {
        mahasiswaDoc.role = "mahasiswa";
        await mahasiswaDoc.save();
        downgradedUsers.push({ nama: mahasiswaDoc.nama, email: mahasiswaDoc.email, role: "mahasiswa" });
      }
    }

    return res.status(200).json({
      message: `${downgradedUsers.length} admin berhasil di-downgrade ke mahasiswa.`,
      data: downgradedUsers,
    });
  } catch (error) {
    console.error("[downgradeAdmin]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────
// POST /api/auth/forgot-password
// Kirim reset password link ke email
// ─────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email harus diisi." });
    }

    const mahasiswa = await Mahasiswa.findOne({ email });

    if (!mahasiswa) {
      // Security: jangan kasih info spesifik
      return res.status(200).json({
        message: "Kalau email terdaftar, link reset password sudah dikirim.",
      });
    }

    // Generate reset password token
    const resetPasswordToken = crypto.randomBytes(32).toString("hex");
    mahasiswa.resetPasswordToken = resetPasswordToken;
    mahasiswa.resetPasswordTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 jam
    await mahasiswa.save();

    // Kirim email
    try {
      await sendResetPasswordEmail(email, mahasiswa.nama, resetPasswordToken);
    } catch (emailError) {
      console.warn("[forgotPassword] Email send warning:", emailError.message);
      // Token sudah disimpan, kirim response optimis
    }

    return res.status(200).json({
      message: "Link reset password sudah dikirim ke email kamu.",
    });
  } catch (error) {
    console.error("[forgotPassword]", error.message);
    return res.status(500).json({ message: "Terjadi kesalahan server: " + error.message });
  }
};

// ─────────────────────────────────────────
// POST /api/auth/reset-password
// Reset password menggunakan token dari email
// ─────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token dan password baru harus diisi." });
    }

    // Validasi password baru
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password minimal 8 karakter." });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: "Password harus mengandung minimal 1 huruf besar." });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ message: "Password harus mengandung minimal 1 huruf kecil." });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: "Password harus mengandung minimal 1 angka." });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return res.status(400).json({ message: "Password harus mengandung minimal 1 karakter spesial." });
    }

    // Cari mahasiswa dengan token yang cocok dan belum expired
    const mahasiswa = await Mahasiswa.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { $gt: new Date() },
    });

    if (!mahasiswa) {
      return res.status(400).json({ message: "Token tidak valid atau sudah expired." });
    }

    // Hash password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password & hapus token
    mahasiswa.password = hashedPassword;
    mahasiswa.resetPasswordToken = null;
    mahasiswa.resetPasswordTokenExpiry = null;
    await mahasiswa.save();

    return res.status(200).json({
      message: "Password berhasil direset! Silakan login dengan password baru.",
    });
  } catch (error) {
    console.error("[resetPassword]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────
// PUT /api/auth/update-profile
// Update nickname dan profilePhoto user
// ─────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const { nickname, profilePhoto } = req.body;

    const mahasiswa = await Mahasiswa.findOne({ userId });
    if (!mahasiswa) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    if (profilePhoto) {
      // Hapus foto lama kalau ada, tapi jangan stop kalau gagal
      if (mahasiswa.profilePhoto) {
        try {
          const publicId = mahasiswa.profilePhoto
            .split('/')
            .slice(-2)
            .join('/')
            .split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (destroyError) {
          console.warn('[updateProfile] Gagal hapus foto lama:', destroyError.message);
          // Lanjut meski foto lama gagal dihapus
        }
      }

      const uploadResult = await cloudinary.uploader.upload(profilePhoto, {
        folder: 'profile_photos',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      mahasiswa.profilePhoto = uploadResult.secure_url;
    }

    if (nickname !== undefined) {
      mahasiswa.nickname = nickname?.trim() || null;
    }

    await mahasiswa.save();

    return res.status(200).json({
      message: 'Profil berhasil diperbarui.',
      data: {
        userId: mahasiswa.userId,
        nama: mahasiswa.nama,
        nickname: mahasiswa.nickname,
        email: mahasiswa.email,
        nim: mahasiswa.nim,
        profilePhoto: mahasiswa.profilePhoto,
        role: mahasiswa.role,
      },
    });
  } catch (error) {
    console.error('[updateProfile]', error.message);
    return res.status(500).json({ message: 'Terjadi kesalahan server: ' + error.message });
  }
};

module.exports = { register, verifyEmail, login, resendVerification, registerAdmin, getAllUsers, changeRole, downgradeAdmin, forgotPassword, resetPassword, updateProfile };