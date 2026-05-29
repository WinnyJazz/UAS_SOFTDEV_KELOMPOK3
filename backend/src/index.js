require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const barangRoutes = require('./routes/barangRoutes');
const claimRoutes = require('./routes/claimRoutes');
const teamPhotoRoutes = require('./routes/teamPhotoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const informasiRoutes = require('./routes/informasiRoutes');
const aspirasiRoutes = require('./routes/aspirasiRoutes');
const notifikasiRoutes = require('./routes/notifikasiRoutes');
const settingRoutes = require('./routes/settingRoute');

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
    res.send('Server Backend UAS Kelompok 3 Berjalan dan Terhubung ke Database!');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/barang', barangRoutes);
app.use('/api/claim', claimRoutes);
app.use('/api/team-photos', teamPhotoRoutes);
app.use('/api/informasi', informasiRoutes);
app.use('/api/aspirasi', aspirasiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifikasi', notifikasiRoutes);
app.use('/api/settings', settingRoutes);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});