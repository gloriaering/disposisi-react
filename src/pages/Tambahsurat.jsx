import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";
import "../assets/css/TambahSurat.css";
import CameraCapture from "../components/CameraCapture";

// =========================================================
// URL BACKEND ONLINE
// =========================================================

const API_URL = "https://disposisi-react-8vdu.vercel.app";

// =========================================================
// URL SCANNER BRIDGE DI KOMPUTER
// EPSON L3210 USB
// =========================================================

const SCANNER_URL = "http://127.0.0.1:5050";

function TambahSurat() {
  const navigate = useNavigate();

  // =========================================================
  // FORM DATA
  // =========================================================

  const [formData, setFormData] = useState({
    nomor_surat: "",
    asal_surat: "",
    tanggal_surat: "",
    nomor_agenda: "",
    tanggal_diterima: "",
    jam_diterima: "",
    perihal: "",
  });

  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // BANYAK FILE
  // =========================================================

  const [scanSurat, setScanSurat] = useState([]);

  // =========================================================
  // PREVIEW HASIL SCAN
  // =========================================================

  const [previewUrls, setPreviewUrls] = useState([]);

  // =========================================================
  // HAMBURGER MENU
  // =========================================================

  const [menuOpen, setMenuOpen] = useState(false);

  // =========================================================
  // KAMERA
  // =========================================================

  const [showCamera, setShowCamera] = useState(false);

  // =========================================================
  // TANGGAL & JAM OTOMATIS WITA
  // =========================================================

  useEffect(() => {
    const updateWaktuIndonesia = () => {
      const sekarang = new Date();

      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Makassar",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .formatToParts(sekarang)
        .reduce((acc, part) => {
          if (part.type !== "literal") {
            acc[part.type] = part.value;
          }

          return acc;
        }, {});

      const tanggalIndonesia =
        `${parts.year}-${parts.month}-${parts.day}`;

      const formatterJam = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Makassar",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const jamIndonesia = formatterJam.format(sekarang);

      setFormData((prev) => ({
        ...prev,
        tanggal_diterima: tanggalIndonesia,
        jam_diterima: jamIndonesia,
      }));
    };

    updateWaktuIndonesia();

    const interval = setInterval(
      updateWaktuIndonesia,
      60000
    );

    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // BUAT PREVIEW UNTUK FILE
  // =========================================================

  useEffect(() => {
    const urls = scanSurat.map((file) => {
      if (file?.type?.startsWith("image/")) {
        return URL.createObjectURL(file);
      }

      return null;
    });

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [scanSurat]);

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // HANDLE TANGGAL SURAT
  // =========================================================

  const handleTanggalSuratChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    if (value.length > 2) {
      value =
        value.slice(0, 2) +
        "-" +
        value.slice(2);
    }

    if (value.length > 5) {
      value =
        value.slice(0, 5) +
        "-" +
        value.slice(5);
    }

    setFormData((prev) => ({
      ...prev,
      tanggal_surat: value,
    }));
  };

  // =========================================================
  // FILE YANG DIIZINKAN
  // =========================================================

  const validFileTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  // =========================================================
  // VALIDASI SATU FILE
  // =========================================================

  const validateFile = (file) => {
    if (!file) {
      return false;
    }

    if (!validFileTypes.includes(file.type)) {
      setError(
        `${file.name} tidak didukung. Gunakan PDF, JPG, JPEG, PNG, atau WEBP.`
      );

      return false;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError(
        `${file.name} terlalu besar. Maksimal ukuran setiap file adalah 20 MB.`
      );

      return false;
    }

    return true;
  };

  // =========================================================
  // SCAN DOKUMEN EPSON L3210
  // =========================================================

  const handleScanDocument = async () => {
    setError("");

    // =======================================================
    // CEK JUMLAH FILE
    // =======================================================

    if (scanSurat.length >= 20) {
      setError(
        "Maksimal hanya dapat memasukkan 20 file."
      );

      return;
    }

    try {
      setScanning(true);

      console.log(
        "======================================"
      );

      console.log(
        "MEMULAI SCAN DOKUMEN"
      );

      console.log(
        "SCANNER:",
        "EPSON L3210"
      );

      console.log(
        "SCANNER BRIDGE:",
        SCANNER_URL
      );

      console.log(
        "======================================"
      );

      // =====================================================
      // CEK SCANNER BRIDGE
      // =====================================================

      try {
        const checkResponse = await fetch(
          `${SCANNER_URL}/`,
          {
            method: "GET",
          }
        );

        if (!checkResponse.ok) {
          throw new Error(
            "Scanner Bridge tidak merespons."
          );
        }
      } catch (bridgeError) {
        console.error(
          "Scanner Bridge tidak dapat diakses:",
          bridgeError
        );

        throw new Error(
          "Scanner Bridge belum berjalan. Jalankan scanner-bridge terlebih dahulu di komputer yang terhubung ke Epson L3210."
        );
      }

      // =====================================================
      // MINTA SCAN
      // =====================================================

      const response = await fetch(
        `${SCANNER_URL}/scan`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            nama_file:
              `scan_${Date.now()}.jpg`,
          }),
        }
      );

      // =====================================================
      // JIKA SCAN GAGAL
      // =====================================================

      if (!response.ok) {
        let message =
          "Gagal melakukan scan dokumen.";

        try {
          const result =
            await response.json();

          if (result.message) {
            message = result.message;
          }
        } catch {
          // Tidak masalah jika response bukan JSON
        }

        throw new Error(message);
      }

      // =====================================================
      // AMBIL HASIL SCAN SEBAGAI BLOB
      // =====================================================

      const blob =
        await response.blob();

      if (!blob || blob.size === 0) {
        throw new Error(
          "Scanner tidak menghasilkan file."
        );
      }

      // =====================================================
      // UBAH BLOB MENJADI FILE
      // =====================================================

      const fileName =
        `scan_${Date.now()}.jpg`;

      const scannedFile =
        new File(
          [blob],
          fileName,
          {
            type: "image/jpeg",
            lastModified: Date.now(),
          }
        );

      // =====================================================
      // VALIDASI HASIL SCAN
      // =====================================================

      if (!validateFile(scannedFile)) {
        return;
      }

      // =====================================================
      // MASUKKAN HASIL SCAN KE DAFTAR
      // =====================================================

      setScanSurat((prev) => {
        if (prev.length >= 20) {
          setError(
            "Maksimal hanya dapat memasukkan 20 file."
          );

          return prev;
        }

        return [
          ...prev,
          scannedFile,
        ];
      });

      console.log(
        "SCAN BERHASIL:",
        scannedFile.name
      );

      console.log(
        "UKURAN:",
        scannedFile.size
      );

    } catch (error) {
      console.error(
        "GAGAL SCAN:",
        error
      );

      setError(
        error.message ||
        "Gagal melakukan scan dokumen."
      );

    } finally {
      setScanning(false);
    }
  };

  // =========================================================
  // HASIL FOTO DARI KAMERA
  // =========================================================

  const handleCameraCapture = (file) => {
    setError("");

    if (!validateFile(file)) {
      return;
    }

    setScanSurat((prev) => {
      if (prev.length >= 20) {
        setError(
          "Maksimal hanya dapat mengupload 20 file."
        );

        return prev;
      }

      return [
        ...prev,
        file,
      ];
    });

    setShowCamera(false);
  };

  // =========================================================
  // HAPUS SATU FILE
  // =========================================================

  const handleRemoveFile = (index) => {
    setScanSurat((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };

  // =========================================================
  // CEK JENIS FILE
  // =========================================================

  const isImage = (file) => {
    return file?.type?.startsWith(
      "image/"
    );
  };

  const isPDF = (file) => {
    return (
      file?.type ===
      "application/pdf"
    );
  };

  // =========================================================
  // SIMPAN SURAT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // =====================================================
    // CEK FORM
    // =====================================================

    if (
      !formData.nomor_surat.trim() ||
      !formData.asal_surat.trim() ||
      !formData.tanggal_surat.trim() ||
      !formData.nomor_agenda.trim() ||
      !formData.tanggal_diterima ||
      !formData.jam_diterima ||
      !formData.perihal.trim()
    ) {
      setError(
        "Semua field bertanda * wajib diisi."
      );

      return;
    }

    // =====================================================
    // CEK FILE
    // =====================================================

    if (scanSurat.length === 0) {
      setError(
        "Minimal satu scan surat wajib dilakukan."
      );

      return;
    }

    if (scanSurat.length > 20) {
      setError(
        "Maksimal hanya dapat mengupload 20 file."
      );

      return;
    }

    for (const file of scanSurat) {
      if (!validateFile(file)) {
        return;
      }
    }

    // =====================================================
    // MULAI SIMPAN
    // =====================================================

    try {
      setLoading(true);

      // ===================================================
      // AMBIL TOKEN LOGIN
      // ===================================================

      const token =
        localStorage.getItem(
          "token"
        );

      // ===================================================
      // JIKA TOKEN TIDAK ADA
      // ===================================================

      if (!token) {
        setError(
          "Sesi login tidak ditemukan. Silakan login kembali."
        );

        navigate("/login");

        return;
      }

      // ===================================================
      // BUAT FORMDATA
      // ===================================================

      const data =
        new FormData();

      data.append(
        "nomor_surat",
        formData.nomor_surat.trim()
      );

      data.append(
        "asal_surat",
        formData.asal_surat.trim()
      );

      data.append(
        "tanggal_surat",
        formData.tanggal_surat.trim()
      );

      data.append(
        "nomor_agenda",
        formData.nomor_agenda.trim()
      );

      data.append(
        "tanggal_diterima",
        formData.tanggal_diterima
      );

      data.append(
        "jam_diterima",
        formData.jam_diterima
      );

      data.append(
        "perihal",
        formData.perihal.trim()
      );

      data.append(
        "sifat_surat",
        ""
      );

      data.append(
        "diteruskan_kepada",
        JSON.stringify([])
      );

      data.append(
        "dengan_hormat_harap",
        JSON.stringify([])
      );

      data.append(
        "catatan",
        ""
      );

      // ===================================================
      // MASUKKAN SEMUA FILE
      // ===================================================

      scanSurat.forEach((file) => {
        data.append(
          "arsip_surat",
          file
        );
      });

      // ===================================================
      // KIRIM KE BACKEND
      // ===================================================

      console.log(
        "Mengirim surat ke:",
        `${API_URL}/api/surat`
      );

      const response =
        await fetch(
          `${API_URL}/api/surat`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: data,
          }
        );

      // ===================================================
      // AMBIL HASIL RESPONSE
      // ===================================================

      const result =
        await response.json();

      // ===================================================
      // TOKEN EXPIRED / TIDAK VALID
      // ===================================================

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        localStorage.removeItem(
          "bidang"
        );

        setError(
          "Sesi login sudah berakhir. Silakan login kembali."
        );

        navigate("/login");

        return;
      }

      // ===================================================
      // ERROR LAIN
      // ===================================================

      if (!response.ok) {
        throw new Error(
          result.message ||
          "Gagal menyimpan surat."
        );
      }

      // ===================================================
      // BERHASIL
      // ===================================================

      alert(
        `✓ Surat berhasil disimpan dengan ${scanSurat.length} file.`
      );

      navigate("/surat");

    } catch (error) {
      console.error(
        "Gagal menyimpan surat:",
        error
      );

      setError(
        error.message ||
        "Gagal menyimpan surat. Pastikan backend sedang berjalan."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // TAMPILAN
  // =========================================================

  return (
    <div className="tambah-page">

      {/* ===================================================
          MOBILE MENU BUTTON
      =================================================== */}

      <button
        type="button"
        className="tambah-mobile-menu-btn"
        onClick={() =>
          setMenuOpen(!menuOpen)
        }
        aria-label="Buka menu"
      >
        ☰
      </button>

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={`tambah-sidebar ${
          menuOpen
            ? "menu-open"
            : ""
        }`}
      >

        <div className="tambah-brand">

          <div className="tambah-brand-logo">

            <img
              src={logoSulut}
              alt="Logo Sulawesi Utara"
            />

          </div>

          <div className="tambah-brand-text">

            <h2>
              DISNAKERTRANS
            </h2>

            <span>
              Sulawesi Utara
            </span>

          </div>

        </div>

        {/* =================================================
            MENU
        ================================================= */}

        <nav className="tambah-menu">

          <p className="tambah-menu-title">
            MENU UTAMA
          </p>

          <Link
            to="/"
            className="tambah-menu-item"
            onClick={() =>
              setMenuOpen(false)
            }
          >
            <span>⌂</span>
            Dashboard
          </Link>

          <Link
            to="/surat"
            className="tambah-menu-item active"
            onClick={() =>
              setMenuOpen(false)
            }
          >
            <span>▣</span>
            Surat Masuk
          </Link>

          <Link
            to="/riwayat"
            className="tambah-menu-item"
            onClick={() =>
              setMenuOpen(false)
            }
          >
            <span>↶</span>
            Riwayat Surat
          </Link>

        </nav>

      </aside>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="tambah-main">

        {/* =================================================
            TOPBAR
        ================================================= */}

        <header className="tambah-topbar">

          <div className="tambah-topbar-left">

            <h1>
              Tambah Surat
            </h1>

            <p>
              Sistem Informasi Disposisi Surat
            </p>

          </div>

        </header>

        {/* =================================================
            CONTENT
        ================================================= */}

        <section className="tambah-content">

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="tambah-page-header">

            <div className="tambah-page-title">

              <span>
                DATA ADMINISTRASI
              </span>

              <h2>
                Tambah Surat Masuk
              </h2>

              <p>
                Masukkan data surat masuk ke dalam sistem.
              </p>

            </div>

            <Link
              to="/surat"
              className="tambah-btn-back"
            >
              ← Kembali ke Surat Masuk
            </Link>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="tambah-error">
              {error}
            </div>
          )}

          {/* =================================================
              FORM
          ================================================= */}

          <form
            className="tambah-form-card"
            onSubmit={handleSubmit}
          >

            {/* =================================================
                FORM TOP
            ================================================= */}

            <div className="tambah-form-top">

              <div>

                <h3>
                  Informasi Surat
                </h3>

                <p>
                  Lengkapi informasi surat dengan benar.
                </p>

              </div>

            </div>

            {/* =================================================
                FORM GRID
            ================================================= */}

            <div className="tambah-form-grid">

              {/* SURAT DARI */}

              <div className="tambah-form-group">

                <label>
                  Surat Dari <b>*</b>
                </label>

                <input
                  type="text"
                  name="asal_surat"
                  value={
                    formData.asal_surat
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Contoh: Dinas Pendidikan"
                  autoComplete="off"
                />

              </div>

              {/* TANGGAL DITERIMA */}

              <div className="tambah-form-group">

                <label>
                  Tanggal Diterima <b>*</b>
                </label>

                <input
                  type="text"
                  value={
                    formData.tanggal_diterima
                  }
                  readOnly
                />

              </div>

              {/* NOMOR SURAT */}

              <div className="tambah-form-group">

                <label>
                  Nomor Surat <b>*</b>
                </label>

                <input
                  type="text"
                  name="nomor_surat"
                  value={
                    formData.nomor_surat
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Contoh: 005/123/DISNAKERTRANS"
                />

              </div>

              {/* NOMOR AGENDA */}

              <div className="tambah-form-group">

                <label>
                  Nomor Agenda <b>*</b>
                </label>

                <input
                  type="text"
                  name="nomor_agenda"
                  value={
                    formData.nomor_agenda
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Contoh: 001"
                />

              </div>

              {/* TANGGAL SURAT */}

              <div className="tambah-form-group">

                <label>
                  Tanggal Surat <b>*</b>
                </label>

                <input
                  type="text"
                  name="tanggal_surat"
                  value={
                    formData.tanggal_surat
                  }
                  onChange={
                    handleTanggalSuratChange
                  }
                  placeholder="Contoh: 28-08-2026"
                  maxLength={10}
                  inputMode="numeric"
                />

              </div>

              {/* JAM DITERIMA */}

              <div className="tambah-form-group">

                <label>
                  Jam Diterima <b>*</b>
                </label>

                <input
                  type="time"
                  value={
                    formData.jam_diterima
                  }
                  readOnly
                />

              </div>

            </div>

            {/* =================================================
                PERIHAL
            ================================================= */}

            <div className="tambah-form-group tambah-full">

              <label>
                Perihal <b>*</b>
              </label>

              <textarea
                name="perihal"
                value={
                  formData.perihal
                }
                onChange={
                  handleChange
                }
                placeholder="Masukkan perihal surat"
                rows="4"
              />

            </div>

            {/* =================================================
                SCAN SURAT
            ================================================= */}

            <div className="tambah-form-group tambah-full">

              <label>
                Scan Surat <b>*</b>
              </label>

              {/* =================================================
                  TOMBOL SCAN
              ================================================= */}

              <button
                type="button"
                onClick={
                  handleScanDocument
                }
                disabled={
                  scanning ||
                  scanSurat.length >= 20
                }
                className="tambah-btn-scan"
                style={{
                  width: "100%",
                  minHeight: "52px",
                  padding: "12px 18px",
                  border: "none",
                  borderRadius: "10px",
                  background:
                    scanning
                      ? "#999"
                      : "#2563eb",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor:
                    scanning ||
                    scanSurat.length >= 20
                      ? "not-allowed"
                      : "pointer",
                  transition:
                    "0.2s",
                }}
              >
                {scanning
                  ? "⏳ Sedang Memindai..."
                  : "🖨️ Scan Dokumen"}
              </button>

              {/* =================================================
                  PREVIEW HASIL SCAN
              ================================================= */}

              {scanSurat.length > 0 && (
                <div
                  style={{
                    marginTop: "18px",
                    display: "grid",
                    gap: "18px",
                  }}
                >

                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                    }}
                  >
                    🖼️ Hasil Scan
                  </div>

                  {scanSurat.map(
                    (file, index) => (

                      <div
                        key={`${file.name}-${index}`}
                        style={{
                          border:
                            "1px solid #ddd",
                          borderRadius:
                            "12px",
                          padding: "15px",
                          background:
                            "#fafafa",
                        }}
                      >

                        {/* =====================================
                            PREVIEW GAMBAR
                        ====================================== */}

                        {isImage(file) &&
                          previewUrls[index] && (

                            <div
                              style={{
                                width:
                                  "100%",
                                display:
                                  "flex",
                                justifyContent:
                                  "center",
                                marginBottom:
                                  "15px",
                                background:
                                  "#f1f1f1",
                                borderRadius:
                                  "10px",
                                padding:
                                  "10px",
                                boxSizing:
                                  "border-box",
                              }}
                            >

                              <img
                                src={
                                  previewUrls[index]
                                }
                                alt={`Hasil scan ${index + 1}`}
                                style={{
                                  display:
                                    "block",
                                  maxWidth:
                                    "100%",
                                  width:
                                    "auto",
                                  maxHeight:
                                    "600px",
                                  objectFit:
                                    "contain",
                                  borderRadius:
                                    "6px",
                                }}
                              />

                            </div>

                          )}

                        {/* =====================================
                            PREVIEW PDF
                        ====================================== */}

                        {isPDF(file) && (

                          <div
                            style={{
                              padding:
                                "20px",
                              textAlign:
                                "center",
                              background:
                                "#f1f1f1",
                              borderRadius:
                                "10px",
                              marginBottom:
                                "15px",
                            }}
                          >
                            📄 File PDF
                            <br />
                            <small>
                              PDF akan disimpan bersama surat.
                            </small>
                          </div>

                        )}

                        {/* =====================================
                            INFO FILE
                        ====================================== */}

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                            gap: "10px",
                            flexWrap:
                              "wrap",
                          }}
                        >

                          <div>

                            <strong>
                              {isPDF(file)
                                ? "📄"
                                : isImage(file)
                                ? "🖨️"
                                : "📁"}{" "}
                              File {index + 1}
                            </strong>

                            <div
                              style={{
                                marginTop:
                                  "4px",
                              }}
                            >
                              {file.name}
                            </div>

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#666",
                                marginTop:
                                  "3px",
                              }}
                            >
                              {(
                                file.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </div>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveFile(
                                index
                              )
                            }
                            style={{
                              padding:
                                "8px 12px",
                              border:
                                "none",
                              borderRadius:
                                "7px",
                              cursor:
                                "pointer",
                            }}
                          >
                            🗑️ Hapus
                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>
              )}

              {/* =================================================
                  KAMERA
              ================================================= */}

              <button
                type="button"
                onClick={() =>
                  setShowCamera(true)
                }
                className="tambah-btn-camera"
                style={{
                  marginTop: "10px",
                  padding: "10px 15px",
                  cursor: "pointer",
                }}
              >
                📷 Ambil Foto dengan Kamera
              </button>

              {/* =================================================
                  JUMLAH FILE
              ================================================= */}

              <div
                style={{
                  marginTop: "15px",
                  fontWeight: "600",
                }}
              >
                File hasil scan:{" "}
                {scanSurat.length} / 20
              </div>

              {/* =================================================
                  INFO
              ================================================= */}

              <small
                className="tambah-scan-info"
                style={{
                  display: "block",
                  marginTop: "12px",
                }}
              >
                Klik 🖨️ Scan Dokumen untuk
                memindai surat menggunakan
                Epson L3210. Untuk dokumen
                beberapa halaman, lakukan
                scan satu halaman lalu klik
                Scan Dokumen lagi.
                Maksimal 20 file.
              </small>

            </div>

            {/* =================================================
                BUTTON
            ================================================= */}

            <div className="tambah-form-actions">

              <Link
                to="/surat"
                className="tambah-btn-cancel"
              >
                Batal
              </Link>

              <button
                type="submit"
                className="tambah-btn-save"
                disabled={
                  loading ||
                  scanning
                }
              >
                {loading
                  ? "Menyimpan..."
                  : `✓ Simpan Surat (${scanSurat.length} File)`}
              </button>

            </div>

          </form>

        </section>

      </main>

      {/* =====================================================
          CAMERA
      ===================================================== */}

      {showCamera && (

        <CameraCapture
          onCapture={
            handleCameraCapture
          }
          onClose={() =>
            setShowCamera(false)
          }
        />

      )}

    </div>
  );
}

export default TambahSurat;