import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logoSulut from "../assets/images/logo-sulut.png";
import "../assets/css/Dashboard.css";

// =========================================================
// URL BACKEND
// =========================================================
// Jika dibuka dari localhost:
// gunakan backend lokal.
//
// Jika dibuka dari website online:
// gunakan backend Vercel.
// =========================================================

const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_URL = isLocalhost
  ? "http://localhost:5000"
  : import.meta.env.VITE_API_URL ||
    "https://disposisi-react-8vdu.vercel.app";

function Dashboard() {
  const navigate = useNavigate();

  /* =========================================================
     MENU MOBILE
  ========================================================= */

  const [menuOpen, setMenuOpen] = useState(false);

  /* =========================================================
     STATISTIK
  ========================================================= */

  const [totalSurat, setTotalSurat] = useState(0);
  const [suratHariIni, setSuratHariIni] = useState(0);

  /* =========================================================
     STATUS
  ========================================================= */

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     DATA USER LOGIN
  ========================================================= */

  const [user, setUser] = useState(null);

  /* =========================================================
     AMBIL DATA USER LOGIN
  ========================================================= */

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");

      // Jika tidak ada token,
      // ProtectedRoute di App.jsx sebenarnya sudah menangani.
      // Ini hanya pengaman tambahan.
      if (!token) {
        return;
      }

      const userLogin = localStorage.getItem("user");

      if (userLogin) {
        setUser(JSON.parse(userLogin));
      }
    } catch (error) {
      console.error(
        "Gagal mengambil data user:",
        error
      );

      setUser(null);
    }
  }, []);

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    const yakin = window.confirm(
      "Apakah Anda yakin ingin logout?"
    );

    if (!yakin) {
      return;
    }

    // =======================================================
    // HAPUS SEMUA DATA LOGIN
    // =======================================================

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("bidang");

    // =======================================================
    // KEMBALI KE LOGIN
    //
    // Menggunakan window.location.href agar halaman Dashboard
    // benar-benar dihentikan dan tidak terjadi navigasi
    // berulang yang menyebabkan halaman putih.
    // =======================================================

    window.location.href = "/login";
  };

  /* =========================================================
     AMBIL DATA SURAT DARI BACKEND
  ========================================================= */

  const hitungStatistik = async () => {
    try {
      setLoading(true);
      setError("");

      // =====================================================
      // AMBIL TOKEN
      // =====================================================

      const token = localStorage.getItem("token");

      // =====================================================
      // JIKA TOKEN TIDAK ADA
      // =====================================================

      if (!token) {
        setLoading(false);
        return;
      }

      // =====================================================
      // DEBUG
      // =====================================================

      console.log(
        "Mengambil data surat dari:",
        `${API_URL}/api/surat`
      );

      // =====================================================
      // FETCH DATA SURAT
      // =====================================================

      const response = await fetch(
        `${API_URL}/api/surat`,
        {
          method: "GET",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // =====================================================
      // DEBUG RESPONSE
      // =====================================================

      console.log(
        "STATUS DATA SURAT:",
        response.status
      );

      // =====================================================
      // AMBIL RESPONSE
      // =====================================================

      const result = await response.json();

      console.log(
        "HASIL DATA SURAT:",
        result
      );

      // =====================================================
      // TOKEN TIDAK VALID
      // =====================================================

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        // Hapus data login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("bidang");

        // Jangan menggunakan navigate() berulang.
        // Reload langsung ke halaman login.
        window.location.href = "/login";

        return;
      }

      // =====================================================
      // ERROR SERVER
      // =====================================================

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Gagal mengambil data surat."
        );
      }

      // =====================================================
      // AMBIL DATA SURAT
      // =====================================================

      const surat = Array.isArray(result.data)
        ? result.data
        : [];

      // =====================================================
      // TOTAL SURAT
      // =====================================================

      setTotalSurat(surat.length);

      // =====================================================
      // TANGGAL HARI INI
      // =====================================================

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

      // =====================================================
      // HITUNG SURAT HARI INI
      // =====================================================

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

      // =====================================================
      // JIKA FETCH DIBATALKAN / HALAMAN SUDAH MENINGGALKAN
      // DASHBOARD, JANGAN TAMPILKAN ERROR.
      // =====================================================

      if (
        error?.name === "AbortError"
      ) {
        return;
      }

      setError(
        error?.message ||
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
    const token = localStorage.getItem("token");

    // Tidak perlu navigate("/login") di sini.
    // ProtectedRoute pada App.jsx sudah menangani
    // pengguna yang tidak mempunyai token.

    if (!token) {
      setLoading(false);
      return;
    }

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

          {/* HAMBURGER */}

          <button
            className="hamburger-btn"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
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

          {/* =================================================
              USER + LOGOUT
          ================================================= */}

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >

            {/* NAMA USER */}

            <div
              style={{
                textAlign: "right",
              }}
            >

              <strong
                style={{
                  display: "block",
                  color: "#1e293b",
                  fontSize: "14px",
                }}
              >
                {user?.username || "User"}
              </strong>

              <span
                style={{
                  display: "block",
                  color: "#64748b",
                  fontSize: "11px",
                  marginTop: "2px",
                }}
              >
                Pengguna
              </span>

            </div>

            {/* TOMBOL LOGOUT */}

            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",

                height: "38px",
                padding: "0 15px",

                border: "none",
                borderRadius: "7px",

                background: "#dc2626",
                color: "#ffffff",

                fontSize: "13px",
                fontWeight: "700",

                cursor: "pointer",

                boxShadow:
                  "0 3px 8px rgba(220, 38, 38, 0.25)",
              }}
            >

              <span
                style={{
                  fontSize: "15px",
                }}
              >
                ↪
              </span>

              Logout

            </button>

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
                border:
                  "1px solid #fecdd3",
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