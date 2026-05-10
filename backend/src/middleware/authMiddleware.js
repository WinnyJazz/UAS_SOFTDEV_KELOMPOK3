const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Akses ditolak. Token tidak ditemukan." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token sudah expired. Silakan login ulang." });
    }
    return res.status(401).json({ message: "Token tidak valid." });
  }
};

// Middleware khusus untuk role admin
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Akses ditolak. Hanya admin." });
    }
    next();
  });
};

// Middleware khusus untuk role superadmin
const verifySuperAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Akses ditolak. Hanya superadmin." });
    }
    next();
  });
};

// Middleware untuk admin atau superadmin
const verifyAdminOrSuperAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (!["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Akses ditolak. Hanya admin atau superadmin." });
    }
    next();
  });
};

module.exports = { verifyToken, verifyAdmin, verifySuperAdmin, verifyAdminOrSuperAdmin };