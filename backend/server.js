const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const suratRoutes = require("./routes/suratRoutes");

const app = express();

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());

app.use(express.json());

// =========================================================
// ROUTE UTAMA
// =========================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend Disposisi Surat berhasil berjalan",
  });
});

// =========================================================
// KONEKSI MONGODB
// =========================================================

const connectMongoDB = async () => {
  try {
    // Kalau sudah terhubung, tidak perlu connect lagi
    if (mongoose.connection.readyState === 1) {
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("=================================");
    console.log("MongoDB Atlas BERHASIL TERHUBUNG");
    console.log("Database:", mongoose.connection.name);
    console.log("=================================");

  } catch (error) {
    console.error("GAGAL TERHUBUNG KE MONGODB:");
    console.error(error.message);

    throw error;
  }
};

// =========================================================
// MIDDLEWARE KONEK DATABASE
// =========================================================

app.use(async (req, res, next) => {
  try {
    await connectMongoDB();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal terhubung ke database",
    });
  }
});

// =========================================================
// TEST STATUS DATABASE
// =========================================================

app.get("/api/status-db", (req, res) => {

  const status = mongoose.connection.readyState;

  const statusDatabase = {
    0: "DISCONNECTED",
    1: "CONNECTED",
    2: "CONNECTING",
    3: "DISCONNECTING",
  };

  res.json({
    success: status === 1,
    database_status: statusDatabase[status],
    readyState: status,
  });

});

// =========================================================
// TEST MONGODB
// =========================================================

app.get("/api/test-mongodb", (req, res) => {

  res.json({
    success: mongoose.connection.readyState === 1,
    message: "BERHASIL TERHUBUNG KE MONGODB ATLAS",
    database: mongoose.connection.name,
  });

});

// =========================================================
// ROUTE SURAT
// =========================================================

app.use("/api/surat", suratRoutes);

// =========================================================
// JALANKAN SERVER DI LOCALHOST SAJA
// =========================================================

const PORT = process.env.PORT || 5000;

if (require.main === module) {

  connectMongoDB()
    .then(() => {

      app.listen(PORT, () => {
        console.log(
          `Server berjalan di http://localhost:${PORT}`
        );
      });

    })
    .catch(() => {
      console.log("Server tidak dapat dijalankan.");
    });

}

// =========================================================
// EXPORT UNTUK VERCEL
// =========================================================

module.exports = app;