import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";
import "../assets/css/SuratMasuk.css";

function SuratMasuk() {
  const [search, setSearch] = useState("");
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // SIDEBAR MOBILE
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* =========================================================
     AMBIL DATA SURAT DARI BACKEND
  ========================================================= */

  const fetchSurat = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/surat"
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil data surat."
        );
      }

      setSuratList(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error(
        "Gagal mengambil data surat:",
        error
      );

      setError(
        "Gagal mengambil data surat. Pastikan backend sedang berjalan."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    fetchSurat();
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const keyword = search
    .toLowerCase()
    .trim();

  const filteredSurat = suratList.filter(
    (surat) => {
      const text = `
        ${surat.nomor_surat || ""}
        ${surat.nomor_agenda || ""}
        ${surat.asal_surat || ""}
        ${surat.perihal || ""}
      `.toLowerCase();

      return text.includes(keyword);
    }
  );

  /* =========================================================
     FORMAT TANGGAL
  ========================================================= */

  const formatTanggal = (tanggal) => {
    if (!tanggal) {
      return "-";
    }

    if (
      typeof tanggal === "string" &&
      /^\d{2}-\d{2}-\d{4}$/.test(tanggal)
    ) {
      return tanggal;
    }

    const date = new Date(tanggal);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    const hari = String(
      date.getDate()
    ).padStart(2, "0");

    const bulan = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const tahun = date.getFullYear();

    return `${hari}-${bulan}-${tahun}`;
  };

  /* =========================================================
     FORMAT JAM
  ========================================================= */

  const formatJam = (jam) => {
    if (!jam) {
      return "-";
    }

    return (
      String(jam).substring(0, 5) +
      " WITA"
    );
  };

  /* =========================================================
     HAPUS SURAT
  ========================================================= */

  const handleDelete = async (id) => {
    const yakin = window.confirm(
      "Apakah Anda yakin ingin menghapus surat ini?\n\nSurat akan dipindahkan ke Riwayat Surat."
    );

    if (!yakin) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/surat/${id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          "Gagal menghapus surat."
        );
      }

      setSuratList((prev) =>
        prev.filter(
          (surat) =>
            String(surat._id) !==
            String(id)
        )
      );

      alert(
        "Surat berhasil dipindahkan ke Riwayat Surat."
      );

    } catch (error) {
      console.error(
        "Gagal menghapus surat:",
        error
      );

      alert(
        "Gagal menghapus surat. Pastikan backend sedang berjalan."
      );
    }
  };

  /* =========================================================
     TAMPILAN
  ========================================================= */

  return (
    <div className="surat-page">

      {/* =====================================================
          SIDEBAR OVERLAY MOBILE
      ===================================================== */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`surat-sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >

        {/* BRAND */}

        <div className="surat-brand">

          <div className="surat-brand-logo">

            <img
              src={logoSulut}
              alt="Logo Sulawesi Utara"
            />

          </div>

          <div className="surat-brand-text">

            <h2>
              DISNAKERTRANS
            </h2>

            <span>
              Sulawesi Utara
            </span>

          </div>

        </div>


        {/* MENU */}

        <nav className="surat-menu">

          <p className="surat-menu-title">
            MENU UTAMA
          </p>


          {/* DASHBOARD */}

          <Link
            to="/"
            className="surat-menu-item"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <span>⌂</span>
            Dashboard
          </Link>


          {/* SURAT MASUK */}

          <Link
            to="/surat"
            className="surat-menu-item active"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <span>▣</span>
            Surat Masuk
          </Link>


          {/* RIWAYAT */}

          <Link
            to="/riwayat"
            className="surat-menu-item"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <span>↶</span>
            Riwayat Surat
          </Link>

        </nav>

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="surat-main">


        {/* =====================================================
            TOPBAR
        ===================================================== */}

        <header className="surat-topbar">


          {/* HAMBURGER */}

          <button
            type="button"
            className="surat-hamburger-btn"
            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
            aria-label="Buka menu"
          >
            ☰
          </button>


          {/* TITLE */}

          <div className="surat-topbar-left">

            <h1>
              Surat Masuk
            </h1>

            <p>
              Sistem Informasi Disposisi Surat
            </p>

          </div>

        </header>


        {/* =====================================================
            CONTENT
        ===================================================== */}

        <section className="surat-content">


          {/* PAGE HEADER */}

          <div className="surat-page-header">

            <div className="surat-page-title">

              <span>
                DATA ADMINISTRASI
              </span>

              <h2>
                Daftar Surat Masuk
              </h2>

            </div>


            {/* BUTTON TAMBAH */}

            <Link
              to="/surat/tambah"
              className="surat-btn-add"
            >

              <span className="plus-icon">
                +
              </span>

              Tambah Surat

            </Link>

          </div>


          {/* ERROR */}

          {error && (

            <div className="surat-error">
              {error}
            </div>

          )}


          {/* =====================================================
              TABLE CARD
          ===================================================== */}

          <div className="surat-table-card">


            {/* TABLE HEADER */}

            <div className="surat-table-top">


              {/* SEARCH */}

              <div className="surat-search">

                <span className="surat-search-icon">
                  🔍
                </span>

                <input
                  type="text"
                  placeholder="Cari nomor surat, asal, perihal..."
                  autoComplete="off"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />


                {/* CLEAR SEARCH */}

                {search && (

                  <button
                    type="button"
                    className="surat-search-clear"
                    onClick={() =>
                      setSearch("")
                    }
                    aria-label="Hapus pencarian"
                  >
                    ×
                  </button>

                )}

              </div>


              {/* COUNT */}

              <div className="surat-count">

                {keyword
                  ? `Menampilkan ${filteredSurat.length} surat`
                  : `Total ${suratList.length} surat`}

              </div>

            </div>


            {/* =====================================================
                LOADING
            ===================================================== */}

            {loading ? (

              <div className="surat-empty">

                <div className="surat-loading-icon">
                  ↻
                </div>

                <p>
                  Memuat data surat...
                </p>

              </div>

            ) : error ? (

              <div className="surat-empty">

                <div className="surat-empty-icon">
                  !
                </div>

                <p>
                  Data surat belum dapat ditampilkan.
                </p>

              </div>

            ) : (


              /* =====================================================
                  TABLE
              ===================================================== */

              <div className="surat-table-wrapper">

                <table className="surat-table">

                  <thead>

                    <tr>

                      <th className="col-no">
                        No
                      </th>

                      <th>
                        Nomor Surat
                      </th>

                      <th>
                        Surat Dari
                      </th>

                      <th>
                        Perihal
                      </th>

                      <th>
                        Tanggal Surat
                      </th>

                      <th>
                        Diterima
                      </th>

                      <th className="col-action">
                        Aksi
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredSurat.length > 0 ? (

                      filteredSurat.map(
                        (row, index) => (

                          <tr
                            key={row._id}
                          >


                            {/* NOMOR */}

                            <td className="row-number">

                              {index + 1}

                            </td>


                            {/* NOMOR SURAT */}

                            <td>

                              <div className="nomor-surat">

                                {row.nomor_surat || "-"}

                              </div>

                            </td>


                            {/* ASAL SURAT */}

                            <td>

                              <div className="asal-surat">

                                {row.asal_surat || "-"}

                              </div>

                            </td>


                            {/* PERIHAL */}

                            <td>

                              <div className="perihal">

                                {row.perihal || "-"}

                              </div>

                            </td>


                            {/* TANGGAL */}

                            <td>

                              <span className="tanggal-surat">

                                {formatTanggal(
                                  row.tanggal_surat
                                )}

                              </span>

                            </td>


                            {/* DITERIMA */}

                            <td>

                              <div className="diterima">

                                <span>

                                  {formatTanggal(
                                    row.tanggal_diterima
                                  )}

                                </span>

                                <small>

                                  {formatJam(
                                    row.jam_diterima
                                  )}

                                </small>

                              </div>

                            </td>


                            {/* AKSI */}

                            <td>

                              <div className="action-group">


                                {/* DETAIL */}

                                <Link
                                  to={`/surat/detail/${row._id}`}
                                  className="action-btn btn-detail"
                                >
                                  Detail
                                </Link>


                                {/* EDIT */}

                                <Link
                                  to={`/surat/edit/${row._id}`}
                                  className="action-btn btn-edit"
                                >
                                  Edit
                                </Link>


                                {/* CETAK */}

                                <Link
                                  to={`/surat/cetak/${row._id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="action-btn btn-print"
                                >
                                  Cetak
                                </Link>


                                {/* HAPUS */}

                                <button
                                  type="button"
                                  className="action-btn btn-delete"
                                  onClick={() =>
                                    handleDelete(row._id)
                                  }
                                >
                                  Hapus
                                </button>

                              </div>

                            </td>

                          </tr>

                        )
                      )

                    ) : keyword ? (

                      <tr>

                        <td
                          colSpan="7"
                          className="surat-empty-table"
                        >

                          Tidak ada surat yang sesuai
                          dengan pencarian.

                        </td>

                      </tr>

                    ) : (

                      <tr>

                        <td
                          colSpan="7"
                          className="surat-empty-table"
                        >

                          Belum ada data surat masuk.

                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default SuratMasuk;