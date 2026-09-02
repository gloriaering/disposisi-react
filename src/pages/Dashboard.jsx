import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";
import "../assets/css/Dashboard.css";

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [totalSurat, setTotalSurat] = useState(0);
  const [suratHariIni, setSuratHariIni] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     AMBIL DATA SURAT DARI MONGODB MELALUI BACKEND
  ========================================================= */

  const hitungStatistik = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/surat"
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Gagal mengambil data surat."
        );
      }

      const surat = Array.isArray(result.data)
        ? result.data
        : [];

      /* =====================================================
         TOTAL SEMUA SURAT
      ===================================================== */

      setTotalSurat(surat.length);

      /* =====================================================
         TANGGAL HARI INI
      ===================================================== */

      const sekarang = new Date();

      const tahunHariIni =
        sekarang.getFullYear();

      const bulanHariIni = String(
        sekarang.getMonth() + 1
      ).padStart(2, "0");

      const tanggalHariIni = String(
        sekarang.getDate()
      ).padStart(2, "0");

      const hariIni =
        `${tahunHariIni}-${bulanHariIni}-${tanggalHariIni}`;

      /* =====================================================
         HITUNG SURAT YANG DITERIMA HARI INI
      ===================================================== */

      const jumlahHariIni = surat.filter(
        (item) => {
          const tanggal =
            item.tanggal_diterima ||
            item.tanggalDiterima ||
            item.tanggal_masuk ||
            item.tanggalMasuk ||
            "";

          if (!tanggal) {
            return false;
          }

          return (
            String(tanggal).substring(0, 10) ===
            hariIni
          );
        }
      ).length;

      setSuratHariIni(jumlahHariIni);

    } catch (error) {
      console.error(
        "Gagal mengambil statistik surat:",
        error
      );

      setError(
        "Tidak dapat mengambil data dari server."
      );

      setTotalSurat(0);
      setSuratHariIni(0);

    } finally {
      setLoading(false);
    }
  };


  /* =========================================================
     LOAD DATA SAAT DASHBOARD DIBUKA
  ========================================================= */

  useEffect(() => {
    hitungStatistik();
  }, []);


  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <div className="app">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
  className={`sidebar ${
    menuOpen ? "sidebar-open" : ""
  }`}
>

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
              DISNAKERTRANS
            </h2>

            <span>
              Sulawesi Utara
            </span>

          </div>

        </div>


        {/* MENU */}

        <nav className="menu">

          <p className="menu-title">
            MENU UTAMA
          </p>


          {/* DASHBOARD */}

          <Link
            to="/"
            className="menu-item active"
          >
            <span>⌂</span>
            Dashboard
          </Link>


          {/* SURAT MASUK */}

          <Link
            to="/surat"
            className="menu-item"
          >
            <span>▣</span>
            Surat Masuk
          </Link>

        </nav>

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="main-content">


        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="topbar">

  <button
    className="hamburger-btn"
    onClick={() => setMenuOpen(!menuOpen)}
  >
    ☰
  </button>

  <div className="topbar-left">

    <h1>
      Dashboard
    </h1>

    <p>
      Sistem Informasi Disposisi Surat
    </p>

  </div>

</header>


        {/* ===================================================
            DASHBOARD CONTENT
        =================================================== */}

        <section className="dashboard">


          {/* =================================================
              MAIN BANNER
          ================================================= */}

          <div className="welcome-card">

            <div>

              <span className="welcome-label">
                SISTEM INFORMASI DISNAKERTRANS
              </span>

              <h2>
                PENGELOLAAN SURAT MASUK
              </h2>

            </div>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div
              style={{
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                color: "#be123c",
                padding: "12px 15px",
                borderRadius: "10px",
                marginBottom: "18px",
                fontSize: "13px",
              }}
            >
              {error}
            </div>

          )}


          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="statistics">


            {/* TOTAL SURAT */}

            <div className="stat-card">

              <div className="stat-icon">
                ✉
              </div>

              <div className="stat-content">

                <span>
                  Total Surat
                </span>

                <strong>
                  {loading
                    ? "..."
                    : totalSurat}
                </strong>

              </div>

            </div>


            {/* SURAT HARI INI */}

            <div className="stat-card">

              <div className="stat-icon">
                📅
              </div>

              <div className="stat-content">

                <span>
                  Surat Hari Ini
                </span>

                <strong>
                  {loading
                    ? "..."
                    : suratHariIni}
                </strong>

              </div>

            </div>


            {/* STATUS SISTEM */}

            <div className="stat-card">

              <div className="stat-icon">
                ✓
              </div>

              <div className="stat-content">

                <span>
                  Status Sistem
                </span>

                <strong>
                  {error
                    ? "Offline"
                    : loading
                    ? "..."
                    : "Aktif"}
                </strong>

              </div>

            </div>

          </div>


          {/* =================================================
              QUICK ACTION
          ================================================= */}

          <div className="quick-card">

            <div>

              <h3>
                Kelola Surat Masuk
              </h3>

              <p>
                Tambahkan surat baru atau lihat
                seluruh data surat yang masuk.
              </p>

            </div>


            <Link
              to="/surat/tambah"
              className="btn-primary"
            >
              + Tambah Surat
            </Link>

          </div>


          {/* =================================================
              INFORMATION
          ================================================= */}

          <div className="section-header">

            <h3>
              Informasi Sistem
            </h3>

            <p>
              DISNAKERTRANS Sulawesi Utara
            </p>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;