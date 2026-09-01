import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";

/* =========================================================
   PARSE TANGGAL LOCAL
========================================================= */

function parseDateLocal(value) {
  if (!value) return null;

  const text = String(value).trim();

  /* Format YYYY-MM-DD */

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/* =========================================================
   FORMAT TANGGAL
========================================================= */

function formatTanggal(value) {
  const date = parseDateLocal(value);

  if (!date) return "-";

  const hari = String(date.getDate()).padStart(2, "0");

  const bulan = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const tahun = date.getFullYear();

  return `${hari}/${bulan}/${tahun}`;
}

/* =========================================================
   FORMAT JAM
========================================================= */

function formatJam(value) {
  if (!value) return "-";

  const text = String(value).trim();

  const match = text.match(
    /^(\d{1,2}):(\d{2})/
  );

  if (!match) {
    return `${text} WITA`;
  }

  return `${String(match[1]).padStart(
    2,
    "0"
  )}:${match[2]} WITA`;
}

/* =========================================================
   KOMPONEN SIDEBAR
========================================================= */

function Sidebar() {
  return (
    <aside className="sidebar">

      {/* BRAND */}

      <div className="brand">

        <div className="brand-logo">

          <img
            src={logoSulut}
            alt="Logo Sulawesi Utara"
          />

        </div>

        <div className="brand-text">

          <h2>
            DISNAKERTRANSDA
          </h2>

          <span>
            Sulawesi Utara
          </span>

        </div>

      </div>

      {/* MENU */}

      <nav className="menu">

        <Link
          to="/"
          className="menu-item"
        >
          <span>
            ⌂
          </span>

          Dashboard
        </Link>

        <Link
          to="/surat"
          className="menu-item active"
        >
          <span>
            ▣
          </span>

          Surat Masuk
        </Link>

      </nav>

    </aside>
  );
}

/* =========================================================
   KOMPONEN TOPBAR
========================================================= */

function Topbar() {
  return (
    <header className="topbar">

      <div>

        <h1>
          Detail Surat
        </h1>

        <p>
          Informasi lengkap surat masuk
        </p>

      </div>

      <div className="user-info">
        Administrator
      </div>

    </header>
  );
}

/* =========================================================
   COMPONENT DETAIL SURAT
========================================================= */

function DetailSurat() {

  const { id } = useParams();

  const [surat, setSurat] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* =======================================================
     STATE UNTUK TAMPILAN ARSIP LAYAR PENUH
  ======================================================= */

  const [lihatArsip, setLihatArsip] =
    useState(false);

  /* =======================================================
     AMBIL DATA DARI BACKEND
  ======================================================= */

  useEffect(() => {

    const fetchDetailSurat = async () => {

      try {

        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/surat/${id}`
        );

        const result = await response.json();

        if (!response.ok) {

          throw new Error(
            result.message ||
            "Data surat tidak ditemukan."
          );

        }

        setSurat(
          result.data || result
        );

      } catch (error) {

        console.error(
          "Gagal mengambil detail surat:",
          error
        );

        setError(
          error.message ||
          "Data surat tidak tersedia atau gagal mengambil data dari server."
        );

      } finally {

        setLoading(false);

      }

    };

    if (id) {
      fetchDetailSurat();
    }

  }, [id]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {

    return (
      <div className="app">

        <Sidebar />

        <main className="main-content">

          <Topbar />

          <section className="page-content">

            <div className="form-card">

              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                  fontSize: "13px",
                }}
              >
                Memuat data surat...
              </p>

            </div>

          </section>

        </main>

      </div>
    );

  }

  /* =======================================================
     DATA TIDAK DITEMUKAN
  ======================================================= */

  if (!surat || error) {

    return (
      <div className="app">

        <Sidebar />

        <main className="main-content">

          <Topbar />

          <section className="page-content">

            <div className="form-card">

              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "10px",
                }}
              >
                Surat Tidak Ditemukan
              </h2>

              <p
                style={{
                  color: "#6b7280",
                  marginBottom: "20px",
                }}
              >
                {error ||
                  "Data surat tidak tersedia."}
              </p>

              <Link
                to="/surat"
                className="btn-secondary"
              >
                ← Kembali
              </Link>

            </div>

          </section>

        </main>

      </div>
    );

  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="app">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar />

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="main-content">

        {/* TOPBAR */}

        <Topbar />

        {/* =================================================
            CONTENT
        ================================================= */}

        <section className="page-content">

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="page-header">

            <div>

              <h2>
                Detail Surat Masuk
              </h2>

              <p>
                Informasi lengkap data surat.
              </p>

            </div>

            <Link
              to="/surat"
              className="btn-secondary"
            >
              ← Kembali
            </Link>

          </div>

          {/* =================================================
              FORM CARD
          ================================================= */}

          <div className="form-card">

            {/* =================================================
                INFORMASI SURAT
            ================================================= */}

            <div className="form-section">

              <h3>
                Informasi Surat
              </h3>

              <div className="form-grid">

                {/* NOMOR SURAT */}

                <div className="form-group">

                  <label>
                    Nomor Surat
                  </label>

                  <input
                    type="text"
                    value={
                      surat.nomor_surat || ""
                    }
                    readOnly
                  />

                </div>

                {/* NOMOR AGENDA */}

                <div className="form-group">

                  <label>
                    Nomor Agenda
                  </label>

                  <input
                    type="text"
                    value={
                      surat.nomor_agenda || ""
                    }
                    readOnly
                  />

                </div>

                {/* SURAT DARI */}

                <div className="form-group">

                  <label>
                    Surat Dari
                  </label>

                  <input
                    type="text"
                    value={
                      surat.asal_surat || ""
                    }
                    readOnly
                  />

                </div>

                {/* SIFAT SURAT */}

                <div className="form-group">

                  <label>
                    Sifat Surat
                  </label>

                  <input
                    type="text"
                    value={
                      surat.sifat_surat || ""
                    }
                    readOnly
                  />

                </div>

                {/* TANGGAL SURAT */}

                <div className="form-group">

                  <label>
                    Tanggal Surat
                  </label>

                  <input
                    type="text"
                    value={
                      formatTanggal(
                        surat.tanggal_surat
                      )
                    }
                    readOnly
                  />

                </div>

                {/* TANGGAL DITERIMA */}

                <div className="form-group">

                  <label>
                    Tanggal Diterima
                  </label>

                  <input
                    type="text"
                    value={
                      formatTanggal(
                        surat.tanggal_diterima
                      )
                    }
                    readOnly
                  />

                </div>

                {/* JAM DITERIMA */}

                <div className="form-group">

                  <label>
                    Jam Diterima
                  </label>

                  <input
                    type="text"
                    value={
                      formatJam(
                        surat.jam_diterima
                      )
                    }
                    readOnly
                  />

                </div>

              </div>

            </div>

            {/* =================================================
                PERIHAL
            ================================================= */}

            <div className="form-section">

              <h3>
                Perihal
              </h3>

              <div className="form-group">

                <label>
                  Perihal Surat
                </label>

                <textarea
                  value={
                    surat.perihal || ""
                  }
                  readOnly
                  rows="4"
                />

              </div>

            </div>

            {/* =================================================
                SCAN SURAT
            ================================================= */}

            <div className="form-section">

              <h3>
                Scan Surat
              </h3>

              {surat.arsip_surat?.url_file ? (

                <div>

                  <p
                    style={{
                      marginTop: 0,
                      marginBottom: "12px",
                      color: "#6b7280",
                      fontSize: "12px",
                    }}
                  >
                    {surat.arsip_surat.nama_file ||
                      "Arsip surat"}
                  </p>

                  {/* PREVIEW DI HALAMAN DETAIL */}

                  <iframe
                    title="Preview Scan Surat"
                    src={
                      `http://localhost:5000/api/surat/preview/${surat._id}`
                    }
                    style={{
                      width: "100%",
                      height: "700px",
                      border: "1px solid #d6e2ea",
                      borderRadius: "10px",
                      background: "#f8fafc",
                    }}
                  />

                  {/* =================================================
                      BUTTON
                  ================================================= */}

                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >

                    {/* LIHAT ARSIP LAYAR PENUH */}

                    <button
                      type="button"
                      onClick={() =>
                        setLihatArsip(true)
                      }
                      className="btn-primary"
                      style={{
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      ⛶ Lihat Arsip Layar Penuh
                    </button>

                    {/* DOWNLOAD ARSIP */}

                    <a
                      href={
                        `http://localhost:5000/api/surat/download/${surat._id}`
                      }
                      className="btn-primary"
                      style={{
                        textDecoration: "none",
                      }}
                    >
                      ↓ Download Arsip
                    </a>

                  </div>

                </div>

              ) : (

                <div
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    color: "#6b7280",
                    fontSize: "12px",
                  }}
                >
                  Scan surat belum tersedia.
                </div>

              )}

            </div>

            {/* =================================================
                BUTTON BAWAH
            ================================================= */}

            <div className="form-actions">

              <Link
                to="/surat"
                className="btn-secondary"
              >
                ← Kembali
              </Link>

              <Link
                to={`/surat/edit/${surat._id}`}
                className="btn-primary"
              >
                Edit Surat
              </Link>

            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          MODAL ARSIP LAYAR PENUH
      ====================================================== */}

      {lihatArsip &&
        surat.arsip_surat?.url_file && (

          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "#ffffff",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
            }}
          >

            {/* =================================================
                HEADER MODAL
            ================================================= */}

            <div
              style={{
                padding: "15px 25px",
                borderBottom:
                  "1px solid #d6e2ea",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "15px",
                flexWrap: "wrap",
                background: "#ffffff",
              }}
            >

              <div>

                <h3
                  style={{
                    margin: 0,
                  }}
                >
                  Scan Surat
                </h3>

                <p
                  style={{
                    margin:
                      "4px 0 0 0",
                    color: "#6b7280",
                    fontSize: "12px",
                  }}
                >
                  {surat.arsip_surat.nama_file ||
                    "Arsip surat"}
                </p>

              </div>

              {/* =================================================
                  TOMBOL KEMBALI
              ================================================= */}

              <button
                type="button"
                onClick={() =>
                  setLihatArsip(false)
                }
                className="btn-secondary"
                style={{
                  cursor: "pointer",
                }}
              >
                ← Kembali ke Detail Surat
              </button>

            </div>

            {/* =================================================
                ARSIP LAYAR PENUH
            ================================================= */}

            <iframe
              title="Arsip Surat Layar Penuh"
              src={
                `http://localhost:5000/api/surat/preview/${surat._id}`
              }
              style={{
                width: "100%",
                flex: 1,
                border: "none",
                background: "#f8fafc",
              }}
            />

          </div>

        )}

    </div>
  );
}

export default DetailSurat;