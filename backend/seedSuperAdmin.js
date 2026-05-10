const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./src/models/Admin");
require("dotenv").config();

async function seedSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Check if superadmin already exists
        const existingSuperAdmin = await Admin.findOne({ role: "superadmin" });
        if (existingSuperAdmin) {
            console.log("Superadmin already exists");
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("superadmin123", salt);

        // Create superadmin
        const superAdmin = await Admin.create({
            nama: "Super Admin",
            email: "superadmin@fti.com",
            password: hashedPassword,
            role: "superadmin",
        });

        console.log("Superadmin created successfully:", {
            adminId: superAdmin.adminId,
            nama: superAdmin.nama,
            email: superAdmin.email,
            role: superAdmin.role,
        });

    } catch (error) {
        console.error("Error seeding superadmin:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

seedSuperAdmin();