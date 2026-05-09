// utils/emailService.js
// Placeholder untuk future email implementation

const sendVerificationEmail = async (toEmail, nama, token) => {
  // Skip email untuk sekarang
  console.log(`[Email] Verification link: ${process.env.BASE_URL}/api/auth/verify-email?token=${token}`);
};

module.exports = { sendVerificationEmail };
