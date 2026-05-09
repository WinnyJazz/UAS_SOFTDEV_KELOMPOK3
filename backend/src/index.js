const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // 1. Import fungsi koneksi DB

// Load variabel dari .env
dotenv.config();

// 2. Jalankan fungsi koneksi MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server Backend UAS Kelompok 3 Berjalan dan Terhubung ke Database!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});