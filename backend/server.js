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
// KONEKSI MONGODB
// =========================================================

let connectionPromise = null;


async function connectMongoDB() {

  // Kalau sudah terhubung
  if (mongoose.connection.readyState === 1) {

    return mongoose.connection;

  }


  // Kalau sedang proses koneksi
  if (connectionPromise) {

    return connectionPromise;

  }


  // Cek MONGODB_URI
  if (!process.env.MONGODB_URI) {

    throw new Error(
      "MONGODB_URI belum ditemukan di Environment Variables Vercel."
    );

  }


  console.log("Menghubungkan ke MongoDB Atlas...");


  connectionPromise =
    mongoose.connect(
      process.env.MONGODB_URI,
      {
        serverSelectionTimeoutMS: 10000,
      }
    )
    .then(function () {

      console.log(
        "Berhasil terhubung ke MongoDB Atlas"
      );

      return mongoose.connection;

    })
    .catch(function (error) {

      connectionPromise = null;

      console.error(
        "Gagal terhubung ke MongoDB Atlas:",
        error.message
      );

      throw error;

    });


  return connectionPromise;

}


// =========================================================
// MIDDLEWARE PASTIKAN DATABASE TERHUBUNG
// =========================================================

app.use(
  async function (req, res, next) {

    try {

      await connectMongoDB();

      next();

    } catch (error) {

      console.error(
        "DATABASE ERROR:",
        error.message
      );

      return res.status(500).json({

        success: false,

        message:
          "Gagal terhubung ke database.",

      });

    }

  }
);


// =========================================================
// ROUTE UTAMA
// =========================================================

app.get(
  "/",

  function (req, res) {

    res.json({

      success: true,

      message:
        "Backend Disposisi Surat berhasil berjalan",

    });

  }
);


// =========================================================
// TEST PREVIEW
// =========================================================

app.get(
  "/test-preview",

  function (req, res) {

    res.send(
      "TEST PREVIEW ROUTE BERHASIL"
    );

  }
);


// =========================================================
// ROUTE SURAT
// =========================================================

app.use(
  "/api/surat",
  suratRoutes
);


// =========================================================
// EXPORT UNTUK VERCEL
// =========================================================

module.exports = app;