const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");

const app = express();

const PORT = 5050;

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());
app.use(express.json());

// =========================================================
// TEST SCANNER BRIDGE
// =========================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Scanner Bridge berjalan",
  });
});

// =========================================================
// SCAN DOKUMEN
// =========================================================

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

  // =======================================================
  // HASIL OUTPUT POWERSHELL
  // =======================================================

  powershell.stdout.on("data", (data) => {
    output += data.toString();
  });

  // =======================================================
  // ERROR POWERSHELL
  // =======================================================

  powershell.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  // =======================================================
  // POWERSHELL SELESAI
  // =======================================================

  powershell.on("close", (code) => {
    console.log("PowerShell selesai.");
    console.log("Kode:", code);

    // Jika scan gagal
    if (code !== 0) {
      console.error("ERROR SCANNER:", errorOutput);

      return res.status(500).json({
        success: false,
        message:
          errorOutput ||
          "Scanner gagal melakukan scan.",
      });
    }

    // Lokasi file hasil scan
    const filePath = output.trim();

    // Kalau tidak ada file
    if (!filePath) {
      return res.status(500).json({
        success: false,
        message: "Scanner tidak menghasilkan file.",
      });
    }

    console.log("HASIL SCAN:", filePath);

    // =====================================================
    // KIRIM FILE HASIL SCAN KE FRONTEND
    // =====================================================

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

// =========================================================
// JALANKAN SCANNER BRIDGE
// =========================================================

app.listen(PORT, "127.0.0.1", () => {
  console.log("=================================");
  console.log("SCANNER BRIDGE BERHASIL BERJALAN");
  console.log("=================================");
  console.log(
    `Scanner Bridge: http://127.0.0.1:${PORT}`
  );
  console.log("=================================");
});