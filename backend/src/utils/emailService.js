const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const frontendBaseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:3000";

const sendVerificationEmail = async (toEmail, nama, token) => {
  const verificationLink = `${frontendBaseUrl}/verify?token=${token}`;
  
  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev", // pakai ini dulu untuk testing
    to: toEmail,
    subject: "Verifikasi Email - FTI One",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Selamat datang di FTI One!</h2>
        <p>Halo ${nama},</p>
        <p>Klik tombol di bawah untuk verifikasi email:</p>
        <div style="margin: 30px 0;">
          <a href="${verificationLink}" style="padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            Verifikasi Email
          </a>
        </div>
        <p><code>${verificationLink}</code></p>
      </div>
    `,
  });

  if (error) throw new Error(error.message);
  console.log(`[Email] ✅ Sent to ${toEmail}`);
  return { success: true };
};

const sendResetPasswordEmail = async (toEmail, nama, token) => {
  const resetLink = `${frontendBaseUrl}/reset-password?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev", // pakai ini dulu untuk testing
    to: toEmail,
    subject: "Reset Password - FTI One",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Reset Password FTI One</h2>
        <p>Halo ${nama},</p>
        <p>Klik tombol di bawah untuk reset password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="padding: 12px 30px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </div>
        <p><code>${resetLink}</code></p>
        <p style="color: #666; font-size: 12px;">Link berlaku 1 jam.</p>
      </div>
    `,
  });

  if (error) throw new Error(error.message);
  console.log(`[Email] ✅ Reset email sent to ${toEmail}`);
  return { success: true };
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail };