const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const suratRoutes = require("./routes/suratRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  "http://localhost:5173",
  "https://disposisi-disnakertransulut.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Izinkan request tanpa origin
    // Contoh: Postman / server-to-server
    if (!origin) {
      return callback(null, true);
    }

    // Izinkan frontend yang terdaftar
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("=================================");
    console.log("CORS DITOLAK");
    console.log("Origin:", origin);
    console.log("=================================");

    return callback(
      new Error("Origin tidak diizinkan oleh CORS")
    );
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  credentials: true,

  optionsSuccessStatus: 204,
};

/* =========================================================
   MIDDLEWARE CORS
========================================================= */

app.use(cors(corsOptions));

/*
  Pastikan request OPTIONS / preflight ditangani.
*/
app.options("*", cors(corsOptions));

/* =========================================================
   BODY PARSER
========================================================= */

app.use(express.json());

/* =========================================================
   ROOT
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend Disposisi Surat berhasil berjalan",
  });
});

/* =========================================================
   MONGODB
========================================================= */

const connectMongoDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI belum diatur.");
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

/* =========================================================
   DATABASE MIDDLEWARE
========================================================= */

app.use(async (req, res, next) => {
  try {
    await connectMongoDB();
    next();
  } catch (error) {
    console.error("DATABASE ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Gagal terhubung ke database",
    });
  }
});

/* =========================================================
   STATUS DATABASE
========================================================= */

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

/* =========================================================
   TEST MONGODB
========================================================= */

app.get("/api/test-mongodb", (req, res) => {
  res.json({
    success: mongoose.connection.readyState === 1,
    message: "BERHASIL TERHUBUNG KE MONGODB ATLAS",
    database: mongoose.connection.name,
  });
});

/* =========================================================
   AUTH ROUTES
========================================================= */

app.use("/api/auth", authRoutes);

/* =========================================================
   SURAT ROUTES
========================================================= */

app.use("/api/surat", suratRoutes);

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error("=================================");
  console.error("SERVER ERROR");
  console.error(err.message);
  console.error("=================================");

  res.status(500).json({
    success: false,
    message: err.message || "Terjadi kesalahan pada server.",
  });
});

/* =========================================================
   SERVER
========================================================= */

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectMongoDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log("=================================");
        console.log(
          `Server berjalan di http://localhost:${PORT}`
        );
        console.log("=================================");
      });
    })
    .catch((error) => {
      console.error("Server tidak dapat dijalankan.");
      console.error(error.message);
    });
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = app;