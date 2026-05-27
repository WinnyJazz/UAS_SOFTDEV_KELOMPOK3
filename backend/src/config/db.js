const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log("URI Mongo:", process.env.MONGO_URI);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
    });

    console.log(`✅ MongoDB Terhubung: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Error Koneksi MongoDB:");
    console.error(error);

    process.exit(1);
  }
};

module.exports = connectDB;