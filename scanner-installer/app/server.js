const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = 5050;

/* =========================================================
   PRIVATE NETWORK ACCESS
========================================================= */

app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Private-Network",
    "true"
  );

  next();
});

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  "https://disposisi-disnakertransulut.vercel.app",
  "http://localhost:5173",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Request tanpa origin
    if (!origin) {
      return callback(null, true);
    }

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
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

/* =========================================================
   BODY PARSER
========================================================= */

app.use(express.json());

/* =========================================================
   TEST SCANNER BRIDGE
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Scanner Bridge berjalan",
  });
});

/* =========================================================
   SCAN DOKUMEN
========================================================= */

app.post("/scan", (req, res) => {
  const scriptPath = path.join(
    __dirname,
    "scan.ps1"
  );

  console.log("=================================");
  console.log("MEMULAI PROSES SCAN");
  console.log("=================================");

  const powershell = spawn(
    "powershell.exe",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
    ],
    {
      windowsHide: true,
    }
  );

  let output = "";
  let errorOutput = "";

  /* =======================================================
     HASIL OUTPUT POWERSHELL
  ======================================================= */

  powershell.stdout.on("data", (data) => {
    output += data.toString();
  });

  /* =======================================================
     ERROR POWERSHELL
  ======================================================= */

  powershell.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  /* =======================================================
     POWERSHELL SELESAI
  ======================================================= */

  powershell.on("close", (code) => {
    console.log("PowerShell selesai.");
    console.log("Kode:", code);

    /* =====================================================
       SCAN GAGAL
    ===================================================== */

    if (code !== 0) {
      console.error(
        "ERROR SCANNER:",
        errorOutput
      );

      return res.status(500).json({
        success: false,
        message:
          errorOutput ||
          "Scanner gagal melakukan scan.",
      });
    }

    /* =====================================================
       AMBIL PATH FILE DARI OUTPUT POWERSHELL
       
       Output PowerShell berisi banyak teks.
       Path file adalah baris terakhir.
    ===================================================== */

    const lines = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const filePath = lines[lines.length - 1];

    console.log("=================================");
    console.log("HASIL OUTPUT POWERSHELL");
    console.log("=================================");

    console.log(output);

    console.log("=================================");
    console.log("PATH FILE SCAN:");
    console.log(filePath);
    console.log("=================================");

    /* =====================================================
       CEK PATH FILE
    ===================================================== */

    if (!filePath) {
      return res.status(500).json({
        success: false,
        message:
          "Scanner tidak menghasilkan file.",
      });
    }

    /* =====================================================
       CEK APAKAH FILE BENAR-BENAR ADA
    ===================================================== */

    if (!path.isAbsolute(filePath)) {
      console.error(
        "PATH FILE BUKAN ABSOLUT:",
        filePath
      );

      return res.status(500).json({
        success: false,
        message:
          "Path hasil scan tidak valid.",
      });
    }

    if (!fs.existsSync(filePath)) {
      console.error(
        "FILE SCAN TIDAK DITEMUKAN:",
        filePath
      );

      return res.status(500).json({
        success: false,
        message:
          "File hasil scan tidak ditemukan.",
      });
    }

    /* =====================================================
       CEK UKURAN FILE
    ===================================================== */

    const stats = fs.statSync(filePath);

    console.log(
      "Ukuran file:",
      stats.size,
      "bytes"
    );

    if (stats.size === 0) {
      return res.status(500).json({
        success: false,
        message:
          "File hasil scan kosong.",
      });
    }

    /* =====================================================
       KIRIM FILE KE FRONTEND
    ===================================================== */

    console.log("Mengirim hasil scan ke frontend...");

    res.sendFile(
      filePath,
      {
        dotfiles: "deny",
      },
      (error) => {
        if (error) {
          console.error(
            "================================="
          );

          console.error(
            "GAGAL MENGIRIM FILE:"
          );

          console.error(error);

          console.error(
            "================================="
          );

          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message:
                "Gagal mengirim hasil scan.",
            });
          }
        } else {
          console.log(
            "================================="
          );

          console.log(
            "HASIL SCAN BERHASIL DIKIRIM!"
          );

          console.log(
            "================================="
          );
        }
      }
    );
  });

  /* =======================================================
     ERROR SAAT SPAWN POWERSHELL
  ======================================================= */

  powershell.on("error", (error) => {
    console.error(
      "GAGAL MENJALANKAN POWERSHELL:"
    );

    console.error(error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message:
          "Tidak dapat menjalankan PowerShell.",
      });
    }
  });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error("=================================");
  console.error("SERVER ERROR");
  console.error(err.message);
  console.error("=================================");

  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      message:
        err.message ||
        "Terjadi kesalahan pada Scanner Bridge.",
    });
  }
});

/* =========================================================
   JALANKAN SCANNER BRIDGE
========================================================= */

app.listen(PORT, "127.0.0.1", () => {
  console.log("=================================");
  console.log(
    "SCANNER BRIDGE BERHASIL BERJALAN"
  );
  console.log("=================================");

  console.log(
    `Scanner Bridge: http://127.0.0.1:${PORT}`
  );

  console.log("=================================");
});