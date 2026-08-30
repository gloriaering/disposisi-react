import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";
import "../assets/css/Tambahsurat.css";

function TambahSurat() {
  const navigate = useNavigate();

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
  // TANGGAL & JAM DITERIMA OTOMATIS - WITA
  // =========================================================

  useEffect(() => {
    const updateWaktuIndonesia = () => {
      const sekarang = new Date();

      const formatterTanggal = new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: "Asia/Makassar",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

      const tanggalIndonesia =
        formatterTanggal
          .format(sekarang)
          .replace(/\//g, "-");

      const formatterJam = new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone: "Asia/Makassar",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      );

      const jamIndonesia =
        formatterJam
          .format(sekarang)
          .substring(0, 5);

      setFormData((prev) => ({
        ...prev,
        tanggal_diterima: tanggalIndonesia,
        jam_diterima: jamIndonesia,
      }));
    };

    // Jalankan langsung saat halaman dibuka
    updateWaktuIndonesia();

    // Perbarui setiap 1 menit
    const interval = setInterval(
      updateWaktuIndonesia,
      60000
    );

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

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/surat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            nomor_surat:
              formData.nomor_surat.trim(),

            asal_surat:
              formData.asal_surat.trim(),

            tanggal_surat:
              formData.tanggal_surat.trim(),

            nomor_agenda:
              formData.nomor_agenda.trim(),

            tanggal_diterima:
              formData.tanggal_diterima,

            jam_diterima:
              formData.jam_diterima,

            perihal:
              formData.perihal.trim(),

            // Field tambahan sesuai model MongoDB
            sifat_surat: "",

            diteruskan_kepada: [],

            dengan_hormat_harap: [],

            catatan: "",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Gagal menyimpan surat."
        );
      }

      alert("✓ Surat berhasil disimpan.");

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

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="tambah-sidebar">

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

          {/* DASHBOARD */}

          <Link
            to="/"
            className="tambah-menu-item"
          >
            <span>⌂</span>
            Dashboard
          </Link>

          {/* SURAT MASUK */}

          <Link
            to="/surat"
            className="tambah-menu-item active"
          >
            <span>▣</span>
            Surat Masuk
          </Link>

          {/* RIWAYAT */}

          <Link
            to="/riwayat"
            className="tambah-menu-item"
          >
            <span>↶</span>
            Riwayat Surat
          </Link>

        </nav>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="tambah-main">

        {/* ===================================================
            TOPBAR
        =================================================== */}

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

        {/* ===================================================
            CONTENT
        =================================================== */}

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

          {/* =================================================
              FORM CARD
          ================================================= */}

          <form
            className="tambah-form-card"
            onSubmit={handleSubmit}
          >

            {/* FORM HEADER */}

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

              {/* =================================================
                  BARIS 1 KIRI
                  SURAT DARI
              ================================================= */}

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

              {/* =================================================
                  BARIS 1 KANAN
                  TANGGAL DITERIMA
              ================================================= */}

              <div className="tambah-form-group">

                <label>
                  Tanggal Diterima <b>*</b>
                </label>

                <input
                  type="text"
                  name="tanggal_diterima"
                  value={formData.tanggal_diterima}
                  readOnly
                />

                <small>
                  Otomatis mengikuti tanggal Indonesia
                  (WITA).
                </small>

              </div>

              {/* =================================================
                  BARIS 2 KIRI
                  NOMOR SURAT
              ================================================= */}

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

              {/* =================================================
                  BARIS 2 KANAN
                  NOMOR AGENDA
              ================================================= */}

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

              {/* =================================================
                  BARIS 3 KIRI
                  TANGGAL SURAT
              ================================================= */}

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
                  Ketik sesuai tanggal yang tercantum
                  pada surat.
                </small>

              </div>

              {/* =================================================
                  BARIS 3 KANAN
                  JAM DITERIMA
              ================================================= */}

              <div className="tambah-form-group">

                <label>
                  Jam Diterima <b>*</b>
                </label>

                <input
                  type="time"
                  name="jam_diterima"
                  value={formData.jam_diterima}
                  readOnly
                />

                <small>
                  Otomatis mengikuti waktu Indonesia
                  (WITA).
                </small>

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
                value={formData.perihal}
                onChange={handleChange}
                placeholder="Masukkan perihal surat"
                rows="4"
              />

            </div>

            {/* =================================================
                ACTION
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

    </div>
  );
}

export default TambahSurat;