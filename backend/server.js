const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const suratRoutes = require("./routes/suratRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// =========================================================
// CORS
// =========================================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://disposisi-disnakertransulut.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Request tanpa origin
    // Contoh: Postman / server-to-server
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("CORS DITOLAK:", origin);

    return callback(null, false);
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

// Pasang CORS
app.use(cors(corsOptions));

// Tangani preflight OPTIONS
app.options("*", cors(corsOptions));

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(express.json());

// =========================================================
// ROUTE UTAMA
// =========================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Backend Disposisi Surat berhasil berjalan",
  });
});

// =========================================================
// KONEKSI MONGODB
// =========================================================

const connectMongoDB = async () => {
  try {
    if (
      mongoose.connection.readyState === 1
    ) {
      return;
    }

    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log(
      "================================="
    );
    console.log(
      "MongoDB Atlas BERHASIL TERHUBUNG"
    );
    console.log(
      "Database:",
      mongoose.connection.name
    );
    console.log(
      "================================="
    );
  } catch (error) {
    console.error(
      "GAGAL TERHUBUNG KE MONGODB:"
    );

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
    console.error(
      "DATABASE ERROR:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Gagal terhubung ke database",
    });
  }
});

// =========================================================
// TEST STATUS DATABASE
// =========================================================

app.get(
  "/api/status-db",
  (req, res) => {
    const status =
      mongoose.connection.readyState;

    const statusDatabase = {
      0: "DISCONNECTED",
      1: "CONNECTED",
      2: "CONNECTING",
      3: "DISCONNECTING",
    };

    res.json({
      success: status === 1,
      database_status:
        statusDatabase[status],
      readyState: status,
    });
  }
);

// =========================================================
// TEST MONGODB
// =========================================================

app.get(
  "/api/test-mongodb",
  (req, res) => {
    res.json({
      success:
        mongoose.connection
          .readyState === 1,

      message:
        "BERHASIL TERHUBUNG KE MONGODB ATLAS",

      database:
        mongoose.connection.name,
    });
  }
);

// =========================================================
// ROUTE AUTH / LOGIN
// =========================================================

app.use(
  "/api/auth",
  authRoutes
);

// =========================================================
// ROUTE SURAT
// =========================================================

app.use(
  "/api/surat",
  suratRoutes
);

// =========================================================
// JALANKAN SERVER LOCAL
// =========================================================

const PORT =
  process.env.PORT || 5000;

if (require.main === module) {
  connectMongoDB()
    .then(() => {
      app.listen(
        PORT,
        () => {
          console.log(
            `Server berjalan di http://localhost:${PORT}`
          );
        }
      );
    })
    .catch(() => {
      console.log(
        "Server tidak dapat dijalankan."
      );
    });
}

// =========================================================
// EXPORT UNTUK VERCEL
// =========================================================

module.exports = app;