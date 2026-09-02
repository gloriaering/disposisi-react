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
// TEST MONGODB
// BUKA: /test-mongodb
// =========================================================

app.get("/api/test-mongodb", async (req, res) => {
  try {

    // CEK APAKAH MONGODB_URI ADA
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({
        success: false,
        message: "MONGODB_URI TIDAK ADA di Environment Variables Vercel",
      });
    }

    // JIKA BELUM TERHUBUNG, COBA HUBUNGKAN
    if (mongoose.connection.readyState !== 1) {

      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      });

    }

    return res.json({
      success: true,
      message: "BERHASIL TERHUBUNG KE MONGODB ATLAS",
      database: mongoose.connection.name,
      status: mongoose.connection.readyState,
    });

  } catch (error) {

    console.error("ERROR MONGODB:", error);

    return res.status(500).json({
      success: false,
      message: "GAGAL TERHUBUNG KE MONGODB",
      error: error.message,
    });

  }
});

// =========================================================
// CEK STATUS DATABASE
// BUKA: /api/status-db
// =========================================================

app.get("/api/status-db", (req, res) => {

  const status = mongoose.connection.readyState;

  const statusDatabase = {
    0: "DISCONNECTED",
    1: "CONNECTED",
    2: "CONNECTING",
    3: "DISCONNECTING",
  };

  return res.json({
    success: status === 1,
    database_status: statusDatabase[status],
    readyState: status,
  });

});

// =========================================================
// KONEKSI MONGODB SEBELUM API DIGUNAKAN
// =========================================================

app.use(async (req, res, next) => {

  try {

    if (!process.env.MONGODB_URI) {

      return res.status(500).json({
        success: false,
        message: "MONGODB_URI belum ditemukan di Vercel",
      });

    }

    // JIKA SUDAH CONNECTED, JANGAN CONNECT LAGI
    if (mongoose.connection.readyState !== 1) {

      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      });

      console.log("MongoDB Atlas berhasil terhubung");

    }

    next();

  } catch (error) {

    console.error("GAGAL KONEK MONGODB:");
    console.error(error.message);

    return res.status(500).json({
      success: false,
      message: "Gagal terhubung ke database.",
      error: error.message,
    });

  }

});

// =========================================================
// ROUTE SURAT
// =========================================================

app.use("/api/surat", suratRoutes);

// =========================================================
// EXPORT UNTUK VERCEL
// =========================================================

module.exports = app;