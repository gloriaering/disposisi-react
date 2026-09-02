import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";
import "../assets/css/TambahSurat.css";
import CameraCapture from "../components/CameraCapture";

function TambahSurat() {
  const navigate = useNavigate();

  /* =========================================================
     FORM DATA
  ========================================================= */

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
  const [scanSurat, setScanSurat] = useState(null);

  /* =========================================================
     HAMBURGER MENU
  ========================================================= */

  const [menuOpen, setMenuOpen] = useState(false);

  /* =========================================================
     KAMERA
  ========================================================= */

  const [showCamera, setShowCamera] = useState(false);

  /* =========================================================
     TANGGAL & JAM OTOMATIS WITA
  ========================================================= */

  useEffect(() => {
    const updateWaktuIndonesia = () => {
      const sekarang = new Date();

      /* TANGGAL FORMAT YYYY-MM-DD */

      const parts = new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone: "Asia/Makassar",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }
      )
        .formatToParts(sekarang)
        .reduce((acc, part) => {
          if (part.type !== "literal") {
            acc[part.type] = part.value;
          }

          return acc;
        }, {});

      const tanggalIndonesia =
        `${parts.year}-${parts.month}-${parts.day}`;

      /* JAM WITA */

      const formatterJam = new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: "Asia/Makassar",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      );

      const jamIndonesia =
        formatterJam.format(sekarang);

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

  /* =========================================================
     HANDLE INPUT
  ========================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================================================
     HANDLE TANGGAL SURAT
  ========================================================= */

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

  /* =========================================================
     FILE YANG DIIZINKAN
  ========================================================= */

  const validFileTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  /* =========================================================
     VALIDASI FILE
  ========================================================= */

  const validateFile = (file) => {
    if (!file) {
      return false;
    }

    if (!validFileTypes.includes(file.type)) {
      setError(
        "File scan surat harus berupa PDF, JPG, JPEG, atau PNG."
      );

      return false;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError(
        "Ukuran scan surat maksimal 20 MB."
      );

      return false;
    }

    return true;
  };

  /* =========================================================
     PILIH FILE SCAN
  ========================================================= */

  const handleScanChange = (e) => {
    const file = e.target.files?.[0] || null;

    setError("");

    if (!file) {
      setScanSurat(null);
      return;
    }

    if (!validateFile(file)) {
      setScanSurat(null);
      e.target.value = "";
      return;
    }

    setScanSurat(file);
  };

  /* =========================================================
     HASIL FOTO KAMERA
  ========================================================= */

  const handleCameraCapture = (file) => {
    setError("");

    if (!validateFile(file)) {
      return;
    }

    setScanSurat(file);

    setShowCamera(false);
  };

  /* =========================================================
     SIMPAN SURAT
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    /* VALIDASI FORM */

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

    /* VALIDASI SCAN */

    if (!scanSurat) {
      setError(
        "Scan surat wajib dipilih atau difoto."
      );

      return;
    }

    if (!validateFile(scanSurat)) {
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      /* DATA SURAT */

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

      /* DATA TAMBAHAN */

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

      /* FILE */

      data.append(
        "arsip_surat",
        scanSurat
      );

      /* KIRIM KE BACKEND */

      const response = await fetch(
        "http://localhost:5000/api/surat",
        {
          method: "POST",
          body: data,
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          "Gagal menyimpan surat."
        );
      }

      alert(
        "✓ Surat berhasil disimpan."
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

  /* =========================================================
     TAMPILAN
  ========================================================= */

  return (
    <div className="tambah-page">

      {/* HAMBURGER HP */}

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


      {/* SIDEBAR */}

      <aside
        className={`tambah-sidebar ${
          menuOpen ? "menu-open" : ""
        }`}
      >

        {/* BRAND */}

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


        {/* MENU */}

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


      {/* MAIN */}

      <main className="tambah-main">

        {/* TOPBAR */}

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


        {/* CONTENT */}

        <section className="tambah-content">

          {/* PAGE HEADER */}

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


          {/* ERROR */}

          {error && (

            <div className="tambah-error">
              {error}
            </div>

          )}


          {/* FORM */}

          <form
            className="tambah-form-card"
            onSubmit={handleSubmit}
          >

            {/* FORM TOP */}

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


            {/* FORM GRID */}

            <div className="tambah-form-grid">


              {/* SURAT DARI */}

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


              {/* TANGGAL DITERIMA */}

              <div className="tambah-form-group">

                <label>
                  Tanggal Diterima <b>*</b>
                </label>

                <input
                  type="text"
                  value={formData.tanggal_diterima}
                  readOnly
                />

                <small>
                  Otomatis mengikuti tanggal Indonesia (WITA).
                </small>

              </div>


              {/* NOMOR SURAT */}

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
                  autoComplete="off"
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
                  value={formData.nomor_agenda}
                  onChange={handleChange}
                  placeholder="Contoh: 001"
                  autoComplete="off"
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
                  value={formData.tanggal_surat}
                  onChange={handleTanggalSuratChange}
                  placeholder="Contoh: 28-08-2026"
                  maxLength={10}
                  inputMode="numeric"
                  autoComplete="off"
                />

                <small>
                  Ketik sesuai tanggal yang tercantum pada surat.
                </small>

              </div>


              {/* JAM */}

              <div className="tambah-form-group">

                <label>
                  Jam Diterima <b>*</b>
                </label>

                <input
                  type="time"
                  value={formData.jam_diterima}
                  readOnly
                />

                <small>
                  Otomatis mengikuti waktu Indonesia (WITA).
                </small>

              </div>

            </div>


            {/* PERIHAL */}

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
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="tambah-scan-input"
                onChange={handleScanChange}
              />


              {/* CAMERA */}

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


              {/* FILE TERPILIH */}

              {scanSurat && (

                <div className="tambah-scan-selected">

                  ✓ {scanSurat.name}

                </div>

              )}


              <small className="tambah-scan-info">

                Upload PDF, JPG, JPEG, atau PNG.
                Maksimal 20 MB.

              </small>

            </div>


            {/* BUTTON */}

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
                  : "✓ Simpan Surat"}

              </button>

            </div>

          </form>

        </section>

      </main>


      {/* MODAL KAMERA */}

      {showCamera && (

        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() =>
            setShowCamera(false)
          }
        />

      )}

    </div>
  );
}

export default TambahSurat;