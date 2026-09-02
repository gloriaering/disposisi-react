import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";

/* =========================================================
   PARSE TANGGAL
========================================================= */

function parseDateLocal(value) {
  if (!value) return null;

  const text = String(value).trim();

  // FORMAT DD-MM-YYYY
  const matchDDMMYYYY = text.match(
    /^(\d{2})-(\d{2})-(\d{4})$/
  );

  if (matchDDMMYYYY) {
    const date = new Date(
      Number(matchDDMMYYYY[3]),
      Number(matchDDMMYYYY[2]) - 1,
      Number(matchDDMMYYYY[1])
    );

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  // FORMAT YYYY-MM-DD
  const matchYYYYMMDD = text.match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (matchYYYYMMDD) {
    const date = new Date(
      Number(matchYYYYMMDD[1]),
      Number(matchYYYYMMDD[2]) - 1,
      Number(matchYYYYMMDD[3])
    );

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}


/* =========================================================
   FORMAT TANGGAL
========================================================= */

function formatTanggal(value) {
  const date = parseDateLocal(value);

  if (!date) return "-";

  const hari = String(
    date.getDate()
  ).padStart(2, "0");

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

  return `${String(
    match[1]
  ).padStart(2, "0")}:${match[2]} WITA`;
}


/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="brand">

        <div className="brand-logo">
          <img
            src={logoSulut}
            alt="Logo Sulawesi Utara"
          />
        </div>

        <div className="brand-text">

          <h2>
            DISNAKERTRANS
          </h2>

          <span>
            Sulawesi Utara
          </span>

        </div>

      </div>


      <nav className="menu">

        <Link
          to="/"
          className="menu-item"
        >
          <span>⌂</span>
          Dashboard
        </Link>


        <Link
          to="/surat"
          className="menu-item active"
        >
          <span>▣</span>
          Surat Masuk
        </Link>


        <Link
          to="/riwayat"
          className="menu-item"
        >
          <span>↶</span>
          Riwayat Surat
        </Link>

      </nav>

    </aside>
  );
}


/* =========================================================
   TOPBAR
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

    </header>
  );
}


/* =========================================================
   DETAIL SURAT
========================================================= */

function DetailSurat() {

  const { id } = useParams();

  const [surat, setSurat] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [lihatArsip, setLihatArsip] =
    useState(false);


  /* =======================================================
     AMBIL DATA
  ======================================================= */

  useEffect(() => {

    const fetchDetailSurat =
      async () => {

        try {

          setLoading(true);
          setError("");

          const response =
            await fetch(
              `http://localhost:5000/api/surat/${id}`
            );

          const result =
            await response.json();

          if (!response.ok) {

            throw new Error(
              result.message ||
              "Data surat tidak ditemukan."
            );

          }

          /* PERBAIKAN:
             Bisa menerima result.data atau result langsung
          */

          setSurat(
            result.data || result
          );

        } catch (error) {

          console.error(error);

          setError(
            error.message ||
            "Gagal mengambil data surat."
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
              Memuat data surat...
            </div>

          </section>

        </main>

      </div>
    );

  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (!surat || error) {

    return (
      <div className="app">

        <Sidebar />

        <main className="main-content">

          <Topbar />

          <section className="page-content">

            <div className="form-card">

              <h2>
                Surat Tidak Ditemukan
              </h2>

              <p>
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
     DATA ARSIP
  ======================================================= */

  const arsip =
    surat?.arsip_surat || {};

  const urlFile =
    arsip?.url_file || "";

  const tipeFile =
    arsip?.tipe_file || "";

  const namaFile =
    arsip?.nama_file || "";


  /* =======================================================
     URL KHUSUS PREVIEW DAN DOWNLOAD
  ======================================================= */

  const urlPreview =
    `http://localhost:5000/api/surat/preview/${surat._id}`;

  const urlDownload =
    `http://localhost:5000/api/surat/download/${surat._id}`;


  /* =======================================================
     CEK JENIS FILE
  ======================================================= */

  const adalahPDF =
    tipeFile === "application/pdf" ||
    namaFile.toLowerCase().endsWith(".pdf");

  const adalahGambar =
    tipeFile.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp)$/i.test(namaFile);


  /* =======================================================
     TAMPILAN
  ======================================================= */

  return (
    <div className="app">

      <Sidebar />


      <main className="main-content">

        <Topbar />


        <section className="page-content">


          {/* HEADER */}

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


          {/* CARD */}

          <div className="form-card">


            {/* INFORMASI SURAT */}

            <div className="form-section">

              <h3>
                Informasi Surat
              </h3>


              <div className="form-grid">


                <div className="form-group">

                  <label>
                    Nomor Surat
                  </label>

                  <input
                    value={
                      surat.nomor_surat || ""
                    }
                    readOnly
                  />

                </div>


                <div className="form-group">

                  <label>
                    Nomor Agenda
                  </label>

                  <input
                    value={
                      surat.nomor_agenda || ""
                    }
                    readOnly
                  />

                </div>


                <div className="form-group">

                  <label>
                    Surat Dari
                  </label>

                  <input
                    value={
                      surat.asal_surat || ""
                    }
                    readOnly
                  />

                </div>


                <div className="form-group">

                  <label>
                    Sifat Surat
                  </label>

                  <input
                    value={
                      surat.sifat_surat || "-"
                    }
                    readOnly
                  />

                </div>


                <div className="form-group">

                  <label>
                    Tanggal Surat
                  </label>

                  <input
                    value={
                      formatTanggal(
                        surat.tanggal_surat
                      )
                    }
                    readOnly
                  />

                </div>


                <div className="form-group">

                  <label>
                    Tanggal Diterima
                  </label>

                  <input
                    value={
                      formatTanggal(
                        surat.tanggal_diterima
                      )
                    }
                    readOnly
                  />

                </div>


                <div className="form-group">

                  <label>
                    Jam Diterima
                  </label>

                  <input
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


            {/* PERIHAL */}

            <div className="form-section">

              <h3>
                Perihal
              </h3>

              <div className="form-group">

                <textarea
                  value={
                    surat.perihal || ""
                  }
                  readOnly
                  rows="4"
                />

              </div>

            </div>


            {/* SCAN SURAT */}

            <div className="form-section">

              <h3>
                Scan Surat
              </h3>


              {!urlFile ? (

                <div
                  style={{
                    padding: "20px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                  }}
                >
                  Scan surat belum tersedia.
                </div>

              ) : (

                <>

                  <p
                    style={{
                      marginBottom: "15px",
                      color: "#64748b",
                    }}
                  >
                    📎 {namaFile}
                  </p>


                  {/* PDF */}

                  {adalahPDF && (

                    <iframe
                      title="Preview PDF Surat"
                      src={urlPreview}
                      style={{
                        width: "100%",
                        height: "750px",
                        border: "1px solid #d6e2ea",
                        borderRadius: "10px",
                        background: "#ffffff",
                      }}
                    />

                  )}


                  {/* GAMBAR */}

                  {adalahGambar && (

                    <div
                      style={{
                        width: "100%",
                        minHeight: "400px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        background: "#ffffff",
                        padding: "15px",
                        borderRadius: "10px",
                        border:
                          "1px solid #d6e2ea",
                        overflow: "hidden",
                      }}
                    >

                      <img
                        src={urlPreview}
                        alt="Scan Surat"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "700px",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />

                    </div>

                  )}


                  {/* FILE TIDAK DIKENAL */}

                  {!adalahPDF &&
                    !adalahGambar && (

                    <div
                      style={{
                        padding: "20px",
                        background: "#f8fafc",
                      }}
                    >
                      File tidak dapat dipreview.
                    </div>

                  )}


                  {/* BUTTON */}

                  <div
                    style={{
                      marginTop: "15px",
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() =>
                        setLihatArsip(true)
                      }
                      style={{
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      ⛶ Lihat Layar Penuh
                    </button>


                    <a
                      href={urlDownload}
                      className="btn-primary"
                      style={{
                        textDecoration: "none",
                      }}
                    >
                      ↓ Download Arsip
                    </a>

                  </div>

                </>

              )}

            </div>


            {/* BUTTON BAWAH */}

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


      {/* ===================================================
          LAYAR PENUH
      =================================================== */}

      {lihatArsip && urlFile && (

        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#ffffff",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
          }}
        >

          {/* HEADER */}

          <div
            style={{
              padding: "15px 25px",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              borderBottom:
                "1px solid #d6e2ea",
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

              <small>
                {namaFile}
              </small>

            </div>


            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setLihatArsip(false)
              }
              style={{
                cursor: "pointer",
              }}
            >
              ✕ Tutup
            </button>

          </div>


          {/* PDF FULLSCREEN */}

          {adalahPDF && (

            <iframe
              title="PDF Fullscreen"
              src={urlPreview}
              style={{
                width: "100%",
                flex: 1,
                border: "none",
                background: "#f8fafc",
              }}
            />

          )}


          {/* IMAGE FULLSCREEN */}

          {adalahGambar && (

            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "20px",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                background: "#f8fafc",
              }}
            >

              <img
                src={urlPreview}
                alt="Scan Surat"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                }}
              />

            </div>

          )}

        </div>

      )}

    </div>
  );
}

export default DetailSurat;