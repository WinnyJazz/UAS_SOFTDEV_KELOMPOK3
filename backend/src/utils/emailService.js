const nodemailer = require("nodemailer");

// Pastikan env variables ter-load
const emailUser = process.env.EMAIL_USER?.trim();
const emailPassword = process.env.EMAIL_PASSWORD?.trim();
const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
const emailPort = parseInt(process.env.EMAIL_PORT) || 587;

console.log("[Email Config] Host:", emailHost, "Port:", emailPort);
console.log("[Email Config] User configured:", !!emailUser);
console.log("[Email Config] Password configured:", !!emailPassword);

// Create transporter
const transporter = nodemailer.createTransport({
  host: emailHost,
  port: 465,       // ← hardcode 465, ignore env EMAIL_PORT
  secure: true,    // ← ganti false ke true
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error("[Email] Transporter verification FAILED:");
    console.error("  - Message:", error.message);
    console.error("  - Code:", error.code);
    console.error("  - Make sure EMAIL_USER and EMAIL_PASSWORD are set correctly in .env");
  } else {
    console.log("[Email] ✅ Transporter ready for sending emails");
  }
});

const sendVerificationEmail = async (toEmail, nama, token) => {
  try {
    if (!emailUser || !emailPassword) {
      const missing = [];
      if (!emailUser) missing.push("EMAIL_USER");
      if (!emailPassword) missing.push("EMAIL_PASSWORD");
      throw new Error(`Missing in .env: ${missing.join(", ")}`);
    }

    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:3000";
    const verificationLink = `${frontendBaseUrl}/verify?token=${token}`;

    const mailOptions = {
      from: emailUser,
      to: toEmail,
      subject: "Verifikasi Email - FTI One",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Selamat datang di FTI One!</h2>
          <p>Halo ${nama},</p>
          <p>Terima kasih telah mendaftar. Untuk mengaktifkan akun kamu, silakan klik tombol di bawah untuk verifikasi email:</p>
          <div style="margin: 30px 0;">
            <a href="${verificationLink}" style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verifikasi Email
            </a>
          </div>
          <p>Atau copy dan paste link ini di browser kamu:</p>
          <p><code style="background: #f0f0f0; padding: 10px; display: block; word-break: break-all;">${verificationLink}</code></p>
          <p style="color: #666; font-size: 12px;">Link ini berlaku selama 24 jam.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Jika kamu tidak mendaftar, silakan abaikan email ini.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] ✅ Sent to ${toEmail}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] ❌ Send failed:", {
      message: error.message,
      code: error.code,
    });
    throw error;
  }
};

const sendResetPasswordEmail = async (toEmail, nama, token) => {
  try {
    if (!emailUser || !emailPassword) {
      const missing = [];
      if (!emailUser) missing.push("EMAIL_USER");
      if (!emailPassword) missing.push("EMAIL_PASSWORD");
      throw new Error(`Missing in .env: ${missing.join(", ")}`);
    }

    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:3000";
    const resetLink = `${frontendBaseUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: emailUser,
      to: toEmail,
      subject: "Reset Password - FTI One",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Reset Password FTI One</h2>
          <p>Halo ${nama},</p>
          <p>Kami menerima permintaan untuk mereset password akun kamu. Klik tombol di bawah untuk mengubah password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 12px 30px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>Atau copy dan paste link ini di browser kamu:</p>
          <p><code style="background: #f0f0f0; padding: 10px; display: block; word-break: break-all;">${resetLink}</code></p>
          <p style="color: #666; font-size: 12px;">Link ini berlaku selama 1 jam.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Jika kamu tidak melakukan permintaan ini, silakan abaikan email ini. Password kamu tetap aman.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] ✅ Reset password email sent to ${toEmail}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email] ❌ Reset password email send failed:", {
      message: error.message,
      code: error.code,
    });
    throw error;
  }
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
