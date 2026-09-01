import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";
import "../assets/css/RiwayatSurat.css";

function RiwayatSurat() {
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     STATE SURAT YANG DIPILIH
  ========================================================= */

  const [selectedSurat, setSelectedSurat] = useState([]);

  /* =========================================================
     AMBIL DATA RIWAYAT SURAT
  ========================================================= */

  const fetchRiwayat = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/surat/riwayat"
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil riwayat surat."
        );
      }

      setSuratList(
        Array.isArray(result.data) ? result.data : []
      );

      /* Reset pilihan */

      setSelectedSurat([]);

    } catch (error) {
      console.error(
        "Gagal mengambil riwayat surat:",
        error
      );

      setError(
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
          (selectedId) => selectedId !== id
        );
      }

      return [...prev, id];

    });
  };

  /* =========================================================
     PILIH SEMUA SURAT
  ========================================================= */

  const handleSelectAll = () => {

    /* Kalau semua sudah dipilih → kosongkan */

    if (
      selectedSurat.length === suratList.length &&
      suratList.length > 0
    ) {

      setSelectedSurat([]);

    } else {

      /* Pilih semua ID */

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

    try {
      const response = await fetch(
        `http://localhost:5000/api/surat/${id}/pulihkan`,
        {
          method: "PUT",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal memulihkan surat."
        );
      }

      setSuratList((prev) =>
        prev.filter(
          (surat) =>
            String(surat._id) !== String(id)
        )
      );

      /* Hapus dari pilihan */

      setSelectedSurat((prev) =>
        prev.filter(
          (selectedId) =>
            String(selectedId) !== String(id)
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
        "Gagal memulihkan surat. Pastikan backend sedang berjalan."
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

    try {

      const response = await fetch(
        `http://localhost:5000/api/surat/${id}/permanen`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          "Gagal menghapus surat secara permanen."
        );
      }

      setSuratList((prev) =>
        prev.filter(
          (surat) =>
            String(surat._id) !== String(id)
        )
      );

      /* Hapus dari selected */

      setSelectedSurat((prev) =>
        prev.filter(
          (selectedId) =>
            String(selectedId) !== String(id)
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
        "Gagal menghapus surat secara permanen."
      );

    }
  };

  /* =========================================================
     HAPUS BEBERAPA SURAT SEKALIGUS
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

    try {

      /* Hapus semua surat yang dipilih */

      const hasil = await Promise.all(

        selectedSurat.map(async (id) => {

          const response = await fetch(
            `http://localhost:5000/api/surat/${id}/permanen`,
            {
              method: "DELETE",
            }
          );

          const result = await response.json();

          if (!response.ok) {

            throw new Error(
              result.message ||
              "Gagal menghapus salah satu surat."
            );

          }

          return id;

        })

      );


      /* Hapus dari tampilan */

      setSuratList((prev) =>
        prev.filter(
          (surat) =>
            !hasil.includes(surat._id)
        )
      );


      /* Kosongkan pilihan */

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

      /* Refresh data */

      fetchRiwayat();

    }

  };

  /* =========================================================
     TAMPILAN
  ========================================================= */

  return (

    <div className="riwayat-page">

      {/* SIDEBAR */}

      <aside className="riwayat-sidebar">

        <div className="riwayat-brand">

          <div className="riwayat-brand-logo">

            <img
              src={logoSulut}
              alt="Logo Sulawesi Utara"
            />

          </div>

          <div className="riwayat-brand-text">

            <h2>
              DISNAKERTRANS
            </h2>

            <span>
              Sulawesi Utara
            </span>

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


            {/* TABLE HEADER */}

            <div className="riwayat-table-top">

              <div>

                <strong>
                  Daftar Riwayat Surat
                </strong>

                {/* INFO SURAT TERPILIH */}

                {selectedSurat.length > 0 && (

                  <span className="riwayat-selected-info">

                    {selectedSurat.length} surat dipilih

                  </span>

                )}

              </div>


              <div className="riwayat-top-actions">

                {/* TOTAL */}

                <div className="riwayat-count">

                  Total {suratList.length} surat

                </div>


                {/* HAPUS TERPILIH */}

                {selectedSurat.length > 0 && (

                  <button
                    type="button"
                    className="riwayat-delete-selected"
                    onClick={handleDeleteSelected}
                  >
                    🗑 Hapus Terpilih
                    ({selectedSurat.length})
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


                      {/* CHECKBOX PILIH SEMUA */}

                      <th className="riwayat-checkbox-column">

                        <input
                          type="checkbox"
                          checked={
                            suratList.length > 0 &&
                            selectedSurat.length === suratList.length
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
                              selectedSurat.includes(row._id)
                                ? "riwayat-row-selected"
                                : ""
                            }
                          >


                            {/* CHECKBOX */}

                            <td className="riwayat-checkbox-column">

                              <input
                                type="checkbox"
                                checked={
                                  selectedSurat.includes(row._id)
                                }
                                onChange={() =>
                                  handleSelectSurat(row._id)
                                }
                              />

                            </td>


                            {/* NO */}

                            <td className="riwayat-row-number">

                              {index + 1}

                            </td>


                            {/* NOMOR SURAT */}

                            <td>

                              <div className="riwayat-nomor">

                                {row.nomor_surat || "-"}

                              </div>

                            </td>


                            {/* SURAT DARI */}

                            <td>

                              <div className="riwayat-asal">

                                {row.asal_surat || "-"}

                              </div>

                            </td>


                            {/* PERIHAL */}

                            <td>

                              <div className="riwayat-perihal">

                                {row.perihal || "-"}

                              </div>

                            </td>


                            {/* TANGGAL SURAT */}

                            <td>

                              <span className="riwayat-tanggal">

                                {formatTanggal(
                                  row.tanggal_surat
                                )}

                              </span>

                            </td>


                            {/* DITERIMA */}

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


                            {/* AKSI */}

                            <td>

                              <div className="riwayat-action">


                                {/* PULIHKAN */}

                                <button
                                  type="button"
                                  className="riwayat-action-btn restore"
                                  onClick={() =>
                                    handleRestore(row._id)
                                  }
                                >
                                  ♻️ Pulihkan
                                </button>


                                {/* HAPUS SATU */}

                                <button
                                  type="button"
                                  className="riwayat-action-btn permanent"
                                  onClick={() =>
                                    handlePermanentDelete(row._id)
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