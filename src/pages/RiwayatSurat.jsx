import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";
import "../assets/css/RiwayatSurat.css";

function RiwayatSurat() {
  const navigate = useNavigate();

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);

  const [selectedSurat, setSelectedSurat] = useState([]);

  /* =========================================================
     TOKEN
  ========================================================= */

  const getToken = () => {
    return localStorage.getItem("token");
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("bidang");

    navigate("/login");
  };

  /* =========================================================
     AMBIL DATA RIWAYAT SURAT
  ========================================================= */

  const fetchRiwayat = async () => {
    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/surat/riwayat`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Gagal mengambil riwayat surat."
        );
      }

      setSuratList(
        Array.isArray(result.data)
          ? result.data
          : []
      );

      setSelectedSurat([]);

    } catch (error) {
      console.error(
        "Gagal mengambil riwayat surat:",
        error
      );

      setError(
        error.message ||
          "Gagal mengambil riwayat surat. Pastikan backend sedang berjalan."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    fetchRiwayat();
  }, []);

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

    return `${hari}/${bulan}/${tahun}`;
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
     PILIH SATU SURAT
  ========================================================= */

  const handleSelectSurat = (id) => {
    setSelectedSurat((prev) => {
      if (prev.includes(id)) {
        return prev.filter(
          (selectedId) =>
            selectedId !== id
        );
      }

      return [...prev, id];
    });
  };

  /* =========================================================
     PILIH SEMUA SURAT
  ========================================================= */

  const handleSelectAll = () => {
    if (
      selectedSurat.length ===
        suratList.length &&
      suratList.length > 0
    ) {
      setSelectedSurat([]);
    } else {
      const semuaId = suratList.map(
        (surat) => surat._id
      );

      setSelectedSurat(semuaId);
    }
  };

  /* =========================================================
     PULIHKAN SURAT
  ========================================================= */

  const handleRestore = async (id) => {
    const yakin = window.confirm(
      "Apakah Anda yakin ingin memulihkan surat ini?"
    );

    if (!yakin) {
      return;
    }

    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/surat/${id}/restore`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Gagal memulihkan surat."
        );
      }

      setSuratList((prev) =>
        prev.filter(
          (surat) =>
            String(surat._id) !==
            String(id)
        )
      );

      setSelectedSurat((prev) =>
        prev.filter(
          (selectedId) =>
            String(selectedId) !==
            String(id)
        )
      );

      alert(
        "Surat berhasil dipulihkan dan kembali ke Surat Masuk."
      );

    } catch (error) {
      console.error(
        "Gagal memulihkan surat:",
        error
      );

      alert(
        error.message ||
          "Gagal memulihkan surat."
      );
    }
  };

  /* =========================================================
     HAPUS PERMANEN SATU SURAT
  ========================================================= */

  const handlePermanentDelete = async (id) => {
    const yakin = window.confirm(
      "PERINGATAN!\n\nSurat ini akan dihapus secara permanen dan tidak dapat dipulihkan lagi.\n\nApakah Anda yakin?"
    );

    if (!yakin) {
      return;
    }

    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/surat/${id}/permanen`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Gagal menghapus surat secara permanen."
        );
      }

      setSuratList((prev) =>
        prev.filter(
          (surat) =>
            String(surat._id) !==
            String(id)
        )
      );

      setSelectedSurat((prev) =>
        prev.filter(
          (selectedId) =>
            String(selectedId) !==
            String(id)
        )
      );

      alert(
        "Surat berhasil dihapus secara permanen."
      );

    } catch (error) {
      console.error(
        "Gagal menghapus surat permanen:",
        error
      );

      alert(
        error.message ||
          "Gagal menghapus surat secara permanen."
      );
    }
  };

  /* =========================================================
     HAPUS BEBERAPA SURAT
  ========================================================= */

  const handleDeleteSelected = async () => {
    if (selectedSurat.length === 0) {
      alert(
        "Pilih minimal satu surat terlebih dahulu."
      );

      return;
    }

    const yakin = window.confirm(
      `PERINGATAN!\n\nAnda akan menghapus ${selectedSurat.length} surat secara permanen.\n\nData tidak dapat dipulihkan lagi.\n\nApakah Anda yakin?`
    );

    if (!yakin) {
      return;
    }

    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    try {
      const hasil = await Promise.all(
        selectedSurat.map(async (id) => {
          const response = await fetch(
            `${API_URL}/api/surat/${id}/permanen`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const result =
            await response.json();

          if (
            response.status === 401 ||
            response.status === 403
          ) {
            throw new Error(
              "Sesi login sudah berakhir."
            );
          }

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Gagal menghapus salah satu surat."
            );
          }

          return id;
        })
      );

      setSuratList((prev) =>
        prev.filter(
          (surat) =>
            !hasil.includes(surat._id)
        )
      );

      setSelectedSurat([]);

      alert(
        `${hasil.length} surat berhasil dihapus secara permanen.`
      );

    } catch (error) {
      console.error(
        "Gagal menghapus surat terpilih:",
        error
      );

      alert(
        error.message ||
          "Terjadi kesalahan saat menghapus surat."
      );

      fetchRiwayat();
    }
  };

  /* =========================================================
     TAMPILAN
  ========================================================= */

  return (
    <div className="riwayat-page">

      {/* HAMBURGER */}

      <button
        className="riwayat-mobile-menu-btn"
        onClick={() =>
          setMenuOpen(!menuOpen)
        }
      >
        ☰
      </button>

      {/* SIDEBAR */}

      <aside
        className={`riwayat-sidebar ${
          menuOpen ? "menu-open" : ""
        }`}
      >

        <div className="riwayat-brand">

          <div className="riwayat-brand-logo">
            <img
              src={logoSulut}
              alt="Logo Sulawesi Utara"
            />
          </div>

          <div className="riwayat-brand-text">
            <h2>DISNAKERTRANS</h2>
            <span>Sulawesi Utara</span>
          </div>

        </div>

        <nav className="riwayat-menu">

          <p className="riwayat-menu-title">
            MENU UTAMA
          </p>

          <Link
            to="/"
            className="riwayat-menu-item"
          >
            <span>⌂</span>
            Dashboard
          </Link>

          <Link
            to="/surat"
            className="riwayat-menu-item"
          >
            <span>▣</span>
            Surat Masuk
          </Link>

          <Link
            to="/riwayat"
            className="riwayat-menu-item active"
          >
            <span>↶</span>
            Riwayat Surat
          </Link>

        </nav>

      </aside>

      {/* MAIN */}

      <main className="riwayat-main">

        <section className="riwayat-content">

          {/* HEADER */}

          <div className="riwayat-page-header">

            <div className="riwayat-page-title">

              <span>
                DATA ADMINISTRASI
              </span>

              <h2>
                Riwayat Surat
              </h2>

              <p>
                Surat yang telah dihapus dari daftar aktif
              </p>

            </div>

            <Link
              to="/surat"
              className="riwayat-btn-back"
            >
              ← Kembali ke Surat Masuk
            </Link>

          </div>

          {/* ERROR */}

          {error && (
            <div className="riwayat-error">
              {error}
            </div>
          )}

          {/* TABLE CARD */}

          <div className="riwayat-table-card">

            {/* TABLE TOP */}

            <div className="riwayat-table-top">

              <div>

                <strong>
                  Daftar Riwayat Surat
                </strong>

                {selectedSurat.length > 0 && (
                  <span className="riwayat-selected-info">
                    {selectedSurat.length} surat dipilih
                  </span>
                )}

              </div>

              <div className="riwayat-top-actions">

                <div className="riwayat-count">
                  Total {suratList.length} surat
                </div>

                {selectedSurat.length > 0 && (
                  <button
                    type="button"
                    className="riwayat-delete-selected"
                    onClick={handleDeleteSelected}
                  >
                    🗑 Hapus Terpilih (
                    {selectedSurat.length})
                  </button>
                )}

              </div>

            </div>

            {/* LOADING */}

            {loading ? (
              <div className="riwayat-empty">

                <div className="riwayat-loading-icon">
                  ↻
                </div>

                <p>
                  Memuat data riwayat surat...
                </p>

              </div>

            ) : error ? (

              <div className="riwayat-empty">

                <div className="riwayat-empty-icon">
                  !
                </div>

                <p>
                  Data riwayat surat belum dapat ditampilkan.
                </p>

              </div>

            ) : (

              <div className="riwayat-table-wrapper">

                <table className="riwayat-table">

                  <thead>

                    <tr>

                      <th className="riwayat-checkbox-column">

                        <input
                          type="checkbox"
                          checked={
                            suratList.length > 0 &&
                            selectedSurat.length ===
                              suratList.length
                          }
                          onChange={handleSelectAll}
                          title="Pilih semua surat"
                        />

                      </th>

                      <th className="riwayat-col-no">
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

                      <th>
                        Aksi
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {suratList.length > 0 ? (

                      suratList.map(
                        (row, index) => (

                          <tr
                            key={row._id}
                            className={
                              selectedSurat.includes(
                                row._id
                              )
                                ? "riwayat-row-selected"
                                : ""
                            }
                          >

                            <td className="riwayat-checkbox-column">

                              <input
                                type="checkbox"
                                checked={selectedSurat.includes(
                                  row._id
                                )}
                                onChange={() =>
                                  handleSelectSurat(
                                    row._id
                                  )
                                }
                              />

                            </td>

                            <td className="riwayat-row-number">
                              {index + 1}
                            </td>

                            <td>
                              <div className="riwayat-nomor">
                                {row.nomor_surat || "-"}
                              </div>
                            </td>

                            <td>
                              <div className="riwayat-asal">
                                {row.asal_surat || "-"}
                              </div>
                            </td>

                            <td>
                              <div className="riwayat-perihal">
                                {row.perihal || "-"}
                              </div>
                            </td>

                            <td>
                              <span className="riwayat-tanggal">
                                {formatTanggal(
                                  row.tanggal_surat
                                )}
                              </span>
                            </td>

                            <td>
                              <div>
                                <div className="riwayat-tanggal">
                                  {formatTanggal(
                                    row.tanggal_diterima
                                  )}
                                </div>

                                <div className="riwayat-jam">
                                  {formatJam(
                                    row.jam_diterima
                                  )}
                                </div>
                              </div>
                            </td>

                            <td>

                              <div className="riwayat-action">

                                <button
                                  type="button"
                                  className="riwayat-action-btn restore"
                                  onClick={() =>
                                    handleRestore(
                                      row._id
                                    )
                                  }
                                >
                                  ♻️ Pulihkan
                                </button>

                                <button
                                  type="button"
                                  className="riwayat-action-btn permanent"
                                  onClick={() =>
                                    handlePermanentDelete(
                                      row._id
                                    )
                                  }
                                >
                                  🗑️ Hapus Permanen
                                </button>

                              </div>

                            </td>

                          </tr>

                        )
                      )

                    ) : (

                      <tr>

                        <td
                          colSpan="8"
                          className="riwayat-empty-table"
                        >

                          <div className="riwayat-empty-icon">
                            ✓
                          </div>

                          <p>
                            Tidak ada surat di riwayat.
                          </p>

                          <small>
                            Surat yang dihapus dari Surat Masuk akan muncul di sini.
                          </small>

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

export default RiwayatSurat;