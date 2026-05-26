const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./src/models/Admin");
require("dotenv").config();

async function seedSuperAdmin() {
    try {
        // Connect MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Validasi env
        if (
            !process.env.SUPERADMIN_EMAIL ||
            !process.env.SUPERADMIN_PASSWORD
        ) {
            throw new Error(
                "SUPERADMIN_EMAIL atau SUPERADMIN_PASSWORD belum diisi di .env"
            );
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(
            process.env.SUPERADMIN_PASSWORD,
            salt
        );

        // Update kalau sudah ada, create kalau belum ada
        const superAdmin = await Admin.findOneAndUpdate(
            { role: "superadmin" },
            {
                nama: "Super Admin",
                email: process.env.SUPERADMIN_EMAIL,
                password: hashedPassword,
                role: "superadmin",
            },
            {
                upsert: true,
                new: true,
            }
        );

        console.log("Superadmin berhasil dibuat / diupdate:");
        console.log({
            adminId: superAdmin.adminId,
            nama: superAdmin.nama,
            email: superAdmin.email,
            role: superAdmin.role,
        });

    } catch (error) {
        console.error("Error seeding superadmin:", error.message);

    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

seedSuperAdmin();