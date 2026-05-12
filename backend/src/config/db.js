const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4
    });
    
    console.log(`MongoDB Terhubung: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error Koneksi MongoDB: ${error.message}`);
    process.exit(1); 
  }
};

module.exports = connectDB;