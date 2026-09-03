import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";
import "../assets/css/TambahSurat.css";
import CameraCapture from "../components/CameraCapture";

// =========================================================
// URL BACKEND ONLINE
// =========================================================

const API_URL = "https://disposisi-react.vercel.app";

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
  const [error, setError] = useState("");

  // =========================================================
  // BANYAK FILE
  // =========================================================

  const [scanSurat, setScanSurat] = useState([]);

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

      const tanggalIndonesia = `${parts.year}-${parts.month}-${parts.day}`;

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

    const interval = setInterval(updateWaktuIndonesia, 60000);

    return () => clearInterval(interval);
  }, []);

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
      value = value.slice(0, 2) + "-" + value.slice(2);
    }

    if (value.length > 5) {
      value = value.slice(0, 5) + "-" + value.slice(5);
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
  // PILIH BANYAK FILE
  // =========================================================

  const handleScanChange = (e) => {
    const files = Array.from(e.target.files || []);

    setError("");

    if (files.length === 0) {
      return;
    }

    const fileValid = [];

    for (const file of files) {
      if (validateFile(file)) {
        fileValid.push(file);
      }
    }

    setScanSurat((prev) => {
      const gabungan = [...prev, ...fileValid];

      if (gabungan.length > 20) {
        setError("Maksimal hanya dapat mengupload 20 file.");

        return gabungan.slice(0, 20);
      }

      return gabungan;
    });

    e.target.value = "";
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
        setError("Maksimal hanya dapat mengupload 20 file.");

        return prev;
      }

      return [...prev, file];
    });

    setShowCamera(false);
  };

  // =========================================================
  // HAPUS SATU FILE
  // =========================================================

  const handleRemoveFile = (index) => {
    setScanSurat((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // =========================================================
  // CEK JENIS FILE
  // =========================================================

  const isImage = (file) => {
    return file?.type?.startsWith("image/");
  };

  const isPDF = (file) => {
    return file?.type === "application/pdf";
  };

  // =========================================================
  // SIMPAN SURAT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (
      !formData.nomor_surat.trim() ||
      !formData.asal_surat.trim() ||
      !formData.tanggal_surat.trim() ||
      !formData.nomor_agenda.trim() ||
      !formData.tanggal_diterima ||
      !formData.jam_diterima ||
      !formData.perihal.trim()
    ) {
      setError("Semua field bertanda * wajib diisi.");
      return;
    }

    if (scanSurat.length === 0) {
      setError(
        "Minimal satu scan surat wajib dipilih atau difoto."
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

    try {
      setLoading(true);

      const data = new FormData();

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

      data.append("sifat_surat", "");

      data.append(
        "diteruskan_kepada",
        JSON.stringify([])
      );

      data.append(
        "dengan_hormat_harap",
        JSON.stringify([])
      );

      data.append("catatan", "");

      // =====================================================
      // MASUKKAN SEMUA FILE
      // =====================================================

      scanSurat.forEach((file) => {
        data.append("arsip_surat", file);
      });

      // =====================================================
      // KIRIM KE BACKEND
      // =====================================================

      const response = await fetch(
        `${API_URL}/api/surat`,
        {
          method: "POST",
          body: data,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          "Gagal menyimpan surat."
        );
      }

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

      <button
        type="button"
        className="tambah-mobile-menu-btn"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Buka menu"
      >
        ☰
      </button>

      <aside
        className={`tambah-sidebar ${
          menuOpen ? "menu-open" : ""
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
            <h2>DISNAKERTRANS</h2>
            <span>Sulawesi Utara</span>
          </div>

        </div>

        <nav className="tambah-menu">

          <p className="tambah-menu-title">
            MENU UTAMA
          </p>

          <Link
            to="/"
            className="tambah-menu-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>⌂</span>
            Dashboard
          </Link>

          <Link
            to="/surat"
            className="tambah-menu-item active"
            onClick={() => setMenuOpen(false)}
          >
            <span>▣</span>
            Surat Masuk
          </Link>

          <Link
            to="/riwayat"
            className="tambah-menu-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>↶</span>
            Riwayat Surat
          </Link>

        </nav>

      </aside>

      <main className="tambah-main">

        <header className="tambah-topbar">

          <div className="tambah-topbar-left">
            <h1>Tambah Surat</h1>

            <p>
              Sistem Informasi Disposisi Surat
            </p>
          </div>

        </header>

        <section className="tambah-content">

          <div className="tambah-page-header">

            <div className="tambah-page-title">

              <span>DATA ADMINISTRASI</span>

              <h2>Tambah Surat Masuk</h2>

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

          {error && (
            <div className="tambah-error">
              {error}
            </div>
          )}

          <form
            className="tambah-form-card"
            onSubmit={handleSubmit}
          >

            <div className="tambah-form-top">

              <div>
                <h3>Informasi Surat</h3>

                <p>
                  Lengkapi informasi surat dengan benar.
                </p>
              </div>

            </div>

            <div className="tambah-form-grid">

              <div className="tambah-form-group">

                <label>
                  Surat Dari <b>*</b>
                </label>

                <input
                  type="text"
                  name="asal_surat"
                  value={formData.asal_surat}
                  onChange={handleChange}
                  placeholder="Contoh: Dinas Pendidikan"
                  autoComplete="off"
                />

              </div>

              <div className="tambah-form-group">

                <label>
                  Tanggal Diterima <b>*</b>
                </label>

                <input
                  type="text"
                  value={formData.tanggal_diterima}
                  readOnly
                />

              </div>

              <div className="tambah-form-group">

                <label>
                  Nomor Surat <b>*</b>
                </label>

                <input
                  type="text"
                  name="nomor_surat"
                  value={formData.nomor_surat}
                  onChange={handleChange}
                  placeholder="Contoh: 005/123/DISNAKERTRANS"
                />

              </div>

              <div className="tambah-form-group">

                <label>
                  Nomor Agenda <b>*</b>
                </label>

                <input
                  type="text"
                  name="nomor_agenda"
                  value={formData.nomor_agenda}
                  onChange={handleChange}
                  placeholder="Contoh: 001"
                />

              </div>

              <div className="tambah-form-group">

                <label>
                  Tanggal Surat <b>*</b>
                </label>

                <input
                  type="text"
                  name="tanggal_surat"
                  value={formData.tanggal_surat}
                  onChange={handleTanggalSuratChange}
                  placeholder="Contoh: 28-08-2026"
                  maxLength={10}
                  inputMode="numeric"
                />

              </div>

              <div className="tambah-form-group">

                <label>
                  Jam Diterima <b>*</b>
                </label>

                <input
                  type="time"
                  value={formData.jam_diterima}
                  readOnly
                />

              </div>

            </div>

            <div className="tambah-form-group tambah-full">

              <label>
                Perihal <b>*</b>
              </label>

              <textarea
                name="perihal"
                value={formData.perihal}
                onChange={handleChange}
                placeholder="Masukkan perihal surat"
                rows="4"
              />

            </div>

            {/* SCAN SURAT */}

            <div className="tambah-form-group tambah-full">

              <label htmlFor="arsip_surat">
                Scan Surat <b>*</b>
              </label>

              <input
                id="arsip_surat"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="tambah-scan-input"
                onChange={handleScanChange}
              />

              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="tambah-btn-camera"
                style={{
                  marginTop: "10px",
                  padding: "10px 15px",
                  cursor: "pointer",
                }}
              >
                📷 Ambil Foto dengan Kamera
              </button>

              <div
                style={{
                  marginTop: "15px",
                  fontWeight: "600",
                }}
              >
                File dipilih: {scanSurat.length} / 20
              </div>

              {scanSurat.length > 0 && (

                <div
                  style={{
                    marginTop: "15px",
                    display: "grid",
                    gap: "10px",
                  }}
                >

                  {scanSurat.map((file, index) => (

                    <div
                      key={`${file.name}-${index}`}
                      style={{
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >

                      <div>

                        <strong>
                          {isPDF(file)
                            ? "📄"
                            : isImage(file)
                            ? "🖼️"
                            : "📁"}{" "}

                          File {index + 1}
                        </strong>

                        <div>
                          {file.name}
                        </div>

                        <div
                          style={{
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveFile(index)
                        }
                      >
                        🗑️ Hapus
                      </button>

                    </div>

                  ))}

                </div>

              )}

              <small
                className="tambah-scan-info"
                style={{
                  display: "block",
                  marginTop: "12px",
                }}
              >
                Upload PDF, JPG, JPEG, PNG, atau WEBP.
                Maksimal 20 file dan maksimal 20 MB setiap file.
              </small>

            </div>

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
                disabled={loading}
              >
                {loading
                  ? "Menyimpan..."
                  : `✓ Simpan Surat (${scanSurat.length} File)`}
              </button>

            </div>

          </form>

        </section>

      </main>

      {showCamera && (

        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />

      )}

    </div>
  );
}

export default TambahSurat;