import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";

/* =========================================================
   API URL
========================================================= */

const API_URL = "https://disposisi-react-8vdu.vercel.app";


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

  // FILE YANG SEDANG DILIHAT FULLSCREEN
  const [arsipAktif, setArsipAktif] =
    useState(null);


  /* =======================================================
     AMBIL DATA SURAT
  ======================================================= */

  useEffect(() => {

    const fetchDetailSurat =
      async () => {

        try {

          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API_URL}/api/surat/${id}`
            );

          const result =
            await response.json();

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

     PERBAIKAN UTAMA:
     arsip_surat SEKARANG BERUPA ARRAY
  ======================================================= */

  let daftarArsip = [];

  if (Array.isArray(surat.arsip_surat)) {

    daftarArsip =
      surat.arsip_surat;

  } else if (
    surat.arsip_surat &&
    typeof surat.arsip_surat === "object"
  ) {

    // UNTUK DATA LAMA YANG MASIH SATU FILE
    daftarArsip = [
      surat.arsip_surat
    ];

  }


  /* =======================================================
     CEK JENIS FILE
  ======================================================= */

  const adalahPDF = (arsip) => {

    if (!arsip) return false;

    return (

      arsip.tipe_file ===
        "application/pdf" ||

      arsip.nama_file
        ?.toLowerCase()
        .endsWith(".pdf")

    );

  };


  const adalahGambar = (arsip) => {

    if (!arsip) return false;

    return (

      arsip.tipe_file
        ?.startsWith("image/") ||

      /\.(jpg|jpeg|png|webp)$/i.test(
        arsip.nama_file || ""
      )

    );

  };


  /* =======================================================
     TAMPILAN
  ======================================================= */

  return (

    <div className="app">

      <Sidebar />


      <main className="main-content">

        <Topbar />


        <section className="page-content">


          {/* =================================================
              HEADER
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
              CARD
          ================================================= */}

          <div className="form-card">


            {/* =============================================
                INFORMASI SURAT
            ============================================= */}

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


            {/* =============================================
                PERIHAL
            ============================================= */}

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


            {/* =============================================
                SCAN SURAT
            ============================================= */}

            <div className="form-section">

              <h3>
                Scan Surat
              </h3>


              {/* JIKA BELUM ADA FILE */}

              {daftarArsip.length === 0 && (

                <div
                  style={{
                    padding: "20px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                  }}
                >
                  Scan surat belum tersedia.
                </div>

              )}


              {/* ===========================================
                  TAMPILKAN SEMUA FILE
              =========================================== */}

              {daftarArsip.map(
                (arsip, index) => (

                  <div
                    key={
                      arsip.public_id ||
                      `${arsip.nama_file}-${index}`
                    }
                    style={{
                      marginTop: "25px",
                      border:
                        "1px solid #d6e2ea",
                      borderRadius: "12px",
                      overflow: "hidden",
                      background: "#ffffff",
                    }}
                  >


                    {/* HEADER FILE */}

                    <div
                      style={{
                        padding: "15px 20px",
                        background: "#f8fafc",
                        borderBottom:
                          "1px solid #d6e2ea",
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >

                      <div>

                        <strong>

                          {adalahPDF(arsip)
                            ? "📄"
                            : adalahGambar(arsip)
                            ? "🖼️"
                            : "📁"}

                          {" "}File {index + 1}

                        </strong>

                        <div
                          style={{
                            marginTop: "5px",
                            color: "#64748b",
                            fontSize: "14px",
                          }}
                        >
                          {arsip.nama_file ||
                            "Arsip Surat"}
                        </div>

                      </div>


                      <span
                        style={{
                          fontSize: "13px",
                          color: "#64748b",
                        }}
                      >
                        {arsip.tipe_file ||
                          "File"}
                      </span>

                    </div>


                    {/* =====================================
                        PREVIEW PDF
                    ===================================== */}

                    {adalahPDF(arsip) && (

                      <iframe
                        title={`Preview PDF ${index + 1}`}
                        src={arsip.url_file}
                        style={{
                          width: "100%",
                          height: "700px",
                          border: "none",
                          display: "block",
                          background: "#ffffff",
                        }}
                      />

                    )}


                    {/* =====================================
                        PREVIEW GAMBAR
                    ===================================== */}

                    {adalahGambar(arsip) && (

                      <div
                        style={{
                          width: "100%",
                          minHeight: "400px",
                          display: "flex",
                          justifyContent:
                            "center",
                          alignItems:
                            "center",
                          background:
                            "#ffffff",
                          padding: "20px",
                          boxSizing:
                            "border-box",
                        }}
                      >

                        <img
                          src={arsip.url_file}
                          alt={
                            arsip.nama_file ||
                            `Scan Surat ${index + 1}`
                          }
                          style={{
                            maxWidth: "100%",
                            maxHeight: "700px",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />

                      </div>

                    )}


                    {/* =====================================
                        FILE LAIN
                    ===================================== */}

                    {!adalahPDF(arsip) &&
                      !adalahGambar(arsip) && (

                      <div
                        style={{
                          padding: "40px",
                          textAlign: "center",
                          color: "#64748b",
                        }}
                      >

                        📁 File tidak dapat dipreview.

                      </div>

                    )}


                    {/* =====================================
                        BUTTON FILE
                    ===================================== */}

                    <div
                      style={{
                        padding: "15px 20px",
                        borderTop:
                          "1px solid #d6e2ea",
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >

                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() =>
                          setArsipAktif(arsip)
                        }
                        style={{
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        ⛶ Lihat Layar Penuh
                      </button>


                      <a
                        href={arsip.url_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{
                          textDecoration: "none",
                        }}
                      >
                        📂 Buka File
                      </a>


                      <a
                        href={arsip.url_file}
                        download
                        className="btn-secondary"
                        style={{
                          textDecoration: "none",
                        }}
                      >
                        ↓ Download
                      </a>

                    </div>


                  </div>

                )

              )}

            </div>


            {/* =============================================
                BUTTON BAWAH
            ============================================= */}

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
          MODAL LAYAR PENUH
      =================================================== */}

      {arsipAktif && (

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


          {/* HEADER MODAL */}

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
              gap: "15px",
            }}
          >

            <div
              style={{
                overflow: "hidden",
              }}
            >

              <h3
                style={{
                  margin: 0,
                }}
              >
                {adalahPDF(arsipAktif)
                  ? "📄 Scan Surat PDF"
                  : adalahGambar(arsipAktif)
                  ? "🖼️ Scan Surat"
                  : "📁 Arsip Surat"}

              </h3>


              <small
                style={{
                  wordBreak: "break-word",
                }}
              >
                {arsipAktif.nama_file ||
                  "Arsip Surat"}
              </small>

            </div>


            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setArsipAktif(null)
              }
              style={{
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              ✕ Tutup
            </button>

          </div>


          {/* ===============================================
              PDF FULLSCREEN
          =============================================== */}

          {adalahPDF(arsipAktif) && (

            <iframe
              title="PDF Fullscreen"
              src={arsipAktif.url_file}
              style={{
                width: "100%",
                flex: 1,
                border: "none",
                background: "#f8fafc",
              }}
            />

          )}


          {/* ===============================================
              GAMBAR FULLSCREEN
          =============================================== */}

          {adalahGambar(arsipAktif) && (

            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "25px",
                display: "flex",
                justifyContent:
                  "center",
                alignItems:
                  "flex-start",
                background: "#f8fafc",
              }}
            >

              <img
                src={arsipAktif.url_file}
                alt={
                  arsipAktif.nama_file ||
                  "Scan Surat"
                }
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  display: "block",
                }}
              />

            </div>

          )}


          {/* ===============================================
              FILE LAIN
          =============================================== */}

          {!adalahPDF(arsipAktif) &&
            !adalahGambar(arsipAktif) && (

            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent:
                  "center",
                alignItems:
                  "center",
                flexDirection:
                  "column",
                gap: "15px",
              }}
            >

              <h2>
                📁 File tidak dapat dipreview
              </h2>


              <a
                href={arsipAktif.url_file}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{
                  textDecoration: "none",
                }}
              >
                📂 Buka File
              </a>

            </div>

          )}


        </div>

      )}


    </div>

  );

}

export default DetailSurat;