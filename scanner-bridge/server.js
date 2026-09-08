const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");

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
  const scriptPath = path.join(__dirname, "scan.ps1");

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
      console.error("ERROR SCANNER:", errorOutput);

      return res.status(500).json({
        success: false,
        message:
          errorOutput ||
          "Scanner gagal melakukan scan.",
      });
    }

    /* =====================================================
       HASIL FILE SCAN
    ===================================================== */

    const filePath = output.trim();

    if (!filePath) {
      return res.status(500).json({
        success: false,
        message: "Scanner tidak menghasilkan file.",
      });
    }

    console.log("HASIL SCAN:", filePath);

    /* =====================================================
       KIRIM FILE KE FRONTEND
    ===================================================== */

    res.sendFile(filePath, (error) => {
      if (error) {
        console.error(
          "Gagal mengirim file:",
          error
        );

        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message:
              "Gagal mengirim hasil scan.",
          });
        }
      }
    });
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

  res.status(500).json({
    success: false,
    message:
      err.message ||
      "Terjadi kesalahan pada Scanner Bridge.",
  });
});

/* =========================================================
   JALANKAN SCANNER BRIDGE
========================================================= */

app.listen(PORT, "127.0.0.1", () => {
  console.log("=================================");
  console.log("SCANNER BRIDGE BERHASIL BERJALAN");
  console.log("=================================");
  console.log(
    `Scanner Bridge: http://127.0.0.1:${PORT}`
  );
  console.log("=================================");
});