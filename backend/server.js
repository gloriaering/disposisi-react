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
// TEST PREVIEW
// =========================================================

app.get("/test-preview", (req, res) => {

  res.send("TEST PREVIEW ROUTE BERHASIL");

});


// =========================================================
// ROUTE SURAT
// =========================================================

app.use(
  "/api/surat",
  suratRoutes
);


// =========================================================
// KONEKSI MONGODB
// =========================================================

if (!process.env.MONGODB_URI) {

  console.error(
    "MONGODB_URI belum ditemukan"
  );

} else {

  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {

      console.log(
        "Berhasil terhubung ke MongoDB Atlas"
      );

    })
    .catch((error) => {

      console.error(
        "Gagal terhubung ke MongoDB Atlas"
      );

      console.error(
        error.message
      );

    });

}


// =========================================================
// EXPORT UNTUK VERCEL
// =========================================================

module.exports = app;