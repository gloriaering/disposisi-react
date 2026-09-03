import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";
import "../assets/css/TambahSurat.css";

const API_URL = "https://disposisi-react-8vdu.vercel.app";

function EditSurat() {
  const { id } = useParams();
  const navigate = useNavigate();

  // =========================================================
  // FORM DATA
  // =========================================================

  const [form, setForm] = useState({
    nomor_surat: "",
    asal_surat: "",
    tanggal_surat: "",
    nomor_agenda: "",
    tanggal_diterima: "",
    jam_diterima: "",
    perihal: "",
    sifat_surat: "",
    diteruskan_kepada: [],
    dengan_hormat_harap: [],
    catatan: "",
  });

  // =========================================================
  // ARSIP
  // =========================================================

  const [arsipLama, setArsipLama] = useState([]);
  const [arsipBaru, setArsipBaru] = useState([]);

  // =========================================================
  // STATUS
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // AMBIL DATA SURAT
  // =========================================================

  useEffect(() => {
    const getSurat = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/surat/${id}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
            "Gagal mengambil data surat."
          );
        }

        const surat = result.data || result;

        // =====================================================
        // FORM
        // =====================================================

        setForm({
          nomor_surat:
            surat.nomor_surat || "",

          asal_surat:
            surat.asal_surat || "",

          tanggal_surat:
            surat.tanggal_surat || "",

          nomor_agenda:
            surat.nomor_agenda || "",

          tanggal_diterima:
            surat.tanggal_diterima || "",

          jam_diterima:
            surat.jam_diterima || "",

          perihal:
            surat.perihal || "",

          sifat_surat:
            surat.sifat_surat || "",

          diteruskan_kepada:
            Array.isArray(surat.diteruskan_kepada)
              ? surat.diteruskan_kepada
              : [],

          dengan_hormat_harap:
            Array.isArray(surat.dengan_hormat_harap)
              ? surat.dengan_hormat_harap
              : [],

          catatan:
            surat.catatan || "",
        });

        // =====================================================
        // ARSIP LAMA
        // =====================================================

        if (Array.isArray(surat.arsip_surat)) {
          setArsipLama(surat.arsip_surat);
        } else if (surat.arsip_surat) {
          // Untuk jaga-jaga kalau data lama masih object
          setArsipLama([surat.arsip_surat]);
        } else {
          setArsipLama([]);
        }

      } catch (err) {

        console.error(
          "Gagal mengambil surat:",
          err
        );

        setError(
          err.message ||
          "Gagal mengambil data surat."
        );

      } finally {

        setLoading(false);

      }
    };

    if (id) {
      getSurat();
    }

  }, [id]);

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

  };

  // =========================================================
  // FORMAT TANGGAL SURAT
  // =========================================================

  const handleTanggalSuratChange = (e) => {

    let value =
      e.target.value.replace(/\D/g, "");

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

    setForm((prev) => ({
      ...prev,
      tanggal_surat: value,
    }));

  };

  // =========================================================
  // VALIDASI FILE
  // =========================================================

  const validFileTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const validateFile = (file) => {

    if (!file) {
      return false;
    }

    if (!validFileTypes.includes(file.type)) {

      setError(
        `${file.name} tidak didukung. Gunakan PDF, JPG, JPEG, PNG, atau WEBP.`
      );

      return false;

    }

    if (file.size > 20 * 1024 * 1024) {

      setError(
        `${file.name} terlalu besar. Maksimal 20 MB.`
      );

      return false;

    }

    return true;

  };

  // =========================================================
  // TAMBAH FILE BARU
  // =========================================================

  const handleFileChange = (e) => {

    const files =
      Array.from(e.target.files || []);

    setError("");

    const fileValid = [];

    files.forEach((file) => {

      if (validateFile(file)) {
        fileValid.push(file);
      }

    });

    setArsipBaru((prev) => {

      const gabungan = [
        ...prev,
        ...fileValid,
      ];

      if (gabungan.length > 20) {

        setError(
          "Maksimal 20 file baru."
        );

        return gabungan.slice(0, 20);

      }

      return gabungan;

    });

    e.target.value = "";

  };

  // =========================================================
  // HAPUS FILE BARU
  // =========================================================

  const handleRemoveFileBaru = (index) => {

    setArsipBaru((prev) =>
      prev.filter((_, i) => i !== index)
    );

  };

  // =========================================================
  // CEK JENIS FILE
  // =========================================================

  const isImage = (file) => {

    return (
      file?.tipe_file?.startsWith("image/") ||
      file?.type?.startsWith("image/")
    );

  };

  const isPDF = (file) => {

    return (
      file?.tipe_file === "application/pdf" ||
      file?.type === "application/pdf"
    );

  };

  // =========================================================
  // SIMPAN PERUBAHAN
  // =========================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");

    // =======================================================
    // VALIDASI
    // =======================================================

    if (
      !form.nomor_surat.trim() ||
      !form.asal_surat.trim() ||
      !form.tanggal_surat.trim() ||
      !form.nomor_agenda.trim() ||
      !form.tanggal_diterima ||
      !form.jam_diterima ||
      !form.perihal.trim()
    ) {

      setError(
        "Semua field bertanda * wajib diisi."
      );

      return;

    }

    try {

      setSaving(true);

      const data = new FormData();

      // =====================================================
      // DATA FORM
      // =====================================================

      data.append(
        "nomor_surat",
        form.nomor_surat.trim()
      );

      data.append(
        "asal_surat",
        form.asal_surat.trim()
      );

      data.append(
        "tanggal_surat",
        form.tanggal_surat.trim()
      );

      data.append(
        "nomor_agenda",
        form.nomor_agenda.trim()
      );

      data.append(
        "tanggal_diterima",
        form.tanggal_diterima
      );

      data.append(
        "jam_diterima",
        form.jam_diterima
      );

      data.append(
        "perihal",
        form.perihal.trim()
      );

      data.append(
        "sifat_surat",
        form.sifat_surat || ""
      );

      data.append(
        "diteruskan_kepada",
        JSON.stringify(
          form.diteruskan_kepada || []
        )
      );

      data.append(
        "dengan_hormat_harap",
        JSON.stringify(
          form.dengan_hormat_harap || []
        )
      );

      data.append(
        "catatan",
        form.catatan || ""
      );

      // =====================================================
      // MASUKKAN FILE BARU
      // =====================================================

      arsipBaru.forEach((file) => {

        data.append(
          "arsip_surat",
          file
        );

      });

      // =====================================================
      // KIRIM KE BACKEND
      // =====================================================

      const response = await fetch(
        `${API_URL}/api/surat/${id}`,
        {
          method: "PUT",
          body: data,
        }
      );

      const result =
        await response.json();

      if (!response.ok) {

        throw new Error(
          result.message ||
          "Gagal memperbarui surat."
        );

      }

      alert(
        "✓ Surat berhasil diperbarui."
      );

      navigate("/surat");

    } catch (err) {

      console.error(
        "Gagal memperbarui surat:",
        err
      );

      setError(
        err.message ||
        "Gagal memperbarui surat."
      );

    } finally {

      setSaving(false);

    }

  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div
        style={{
          padding: "50px",
          textAlign: "center",
        }}
      >
        Memuat data surat...
      </div>

    );

  }

  // =========================================================
  // TAMPILAN
  // =========================================================

  return (

    <div className="tambah-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="tambah-sidebar">

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


        <nav className="tambah-menu">

          <p className="tambah-menu-title">
            MENU UTAMA
          </p>

          <Link
            to="/"
            className="tambah-menu-item"
          >
            <span>⌂</span>
            Dashboard
          </Link>


          <Link
            to="/surat"
            className="tambah-menu-item active"
          >
            <span>▣</span>
            Surat Masuk
          </Link>


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


        {/* TOPBAR */}

        <header className="tambah-topbar">

          <div className="tambah-topbar-left">

            <h1>
              Edit Surat
            </h1>

            <p>
              Sistem Informasi Disposisi Surat
            </p>

          </div>

        </header>


        {/* CONTENT */}

        <section className="tambah-content">


          {/* HEADER */}

          <div className="tambah-page-header">

            <div className="tambah-page-title">

              <span>
                DATA ADMINISTRASI
              </span>

              <h2>
                Edit Surat Masuk
              </h2>

              <p>
                Perbarui informasi surat yang telah tersimpan.
              </p>

            </div>


            <Link
              to="/surat"
              className="tambah-btn-back"
            >
              ← Kembali
            </Link>

          </div>


          {/* ERROR */}

          {error && (

            <div className="tambah-error">
              {error}
            </div>

          )}


          {/* =================================================
              FORM
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
                  Periksa dan perbarui informasi surat.
                </p>

              </div>

            </div>


            {/* =================================================
                FORM GRID
            ================================================= */}

            <div className="tambah-form-grid">


              {/* SURAT DARI */}

              <div className="tambah-form-group">

                <label>
                  Surat Dari <b>*</b>
                </label>

                <input
                  type="text"
                  name="asal_surat"
                  value={form.asal_surat}
                  onChange={handleChange}
                />

              </div>


              {/* TANGGAL DITERIMA */}

              <div className="tambah-form-group">

                <label>
                  Tanggal Diterima <b>*</b>
                </label>

                <input
                  type="text"
                  value={form.tanggal_diterima}
                  readOnly
                />

              </div>


              {/* NOMOR SURAT */}

              <div className="tambah-form-group">

                <label>
                  Nomor Surat <b>*</b>
                </label>

                <input
                  type="text"
                  name="nomor_surat"
                  value={form.nomor_surat}
                  onChange={handleChange}
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
                  value={form.nomor_agenda}
                  onChange={handleChange}
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
                  value={form.tanggal_surat}
                  onChange={handleTanggalSuratChange}
                  placeholder="28-08-2026"
                  maxLength={10}
                  inputMode="numeric"
                />

              </div>


              {/* JAM DITERIMA */}

              <div className="tambah-form-group">

                <label>
                  Jam Diterima <b>*</b>
                </label>

                <input
                  type="time"
                  value={form.jam_diterima}
                  readOnly
                />

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
                value={form.perihal}
                onChange={handleChange}
                rows="4"
              />

            </div>


            {/* =================================================
                FILE BARU
            ================================================= */}

            <div className="tambah-form-group tambah-full">

              <label>
                Tambah Scan Surat
              </label>

              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
              />

              <small>
                Kamu dapat menambahkan PDF, JPG, JPEG,
                PNG, atau WEBP. Maksimal 20 MB setiap file.
              </small>

            </div>


            {/* =================================================
                FILE BARU DIPILIH
            ================================================= */}

            {arsipBaru.length > 0 && (

              <div
                className="tambah-form-group tambah-full"
              >

                <h3>
                  File Baru yang Akan Ditambahkan
                </h3>


                {arsipBaru.map(
                  (file, index) => (

                    <div
                      key={index}
                      style={{
                        marginTop: "12px",
                        padding: "15px",
                        border:
                          "1px solid #ddd",
                        borderRadius: "10px",
                      }}
                    >

                      <strong>
                        {isPDF(file)
                          ? "📄 PDF"
                          : "🖼️ Gambar"}{" "}

                        {file.name}
                      </strong>


                      {/* PREVIEW GAMBAR BARU */}

                      {isImage(file) && (

                        <div
                          style={{
                            marginTop: "15px",
                          }}
                        >

                          <img
                            src={
                              URL.createObjectURL(file)
                            }
                            alt={file.name}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "400px",
                              borderRadius: "8px",
                            }}
                          />

                        </div>

                      )}


                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveFileBaru(index)
                        }
                        style={{
                          marginTop: "10px",
                          padding: "8px 12px",
                          cursor: "pointer",
                        }}
                      >
                        🗑️ Hapus
                      </button>

                    </div>

                  )
                )}

              </div>

            )}


            {/* =================================================
                ARSIP LAMA
            ================================================= */}

            <div
              className="tambah-form-group tambah-full"
            >

              <h3>
                Arsip Surat yang Sudah Tersimpan
              </h3>


              {arsipLama.length === 0 && (

                <div
                  style={{
                    padding: "20px",
                    border:
                      "1px dashed #ccc",
                    borderRadius: "10px",
                    textAlign: "center",
                  }}
                >
                  Belum ada arsip surat.
                </div>

              )}


              {/* =================================================
                  TAMPILKAN SEMUA FILE LAMA
              ================================================= */}

              {arsipLama.map(
                (arsip, index) => (

                  <div
                    key={
                      arsip.public_id ||
                      index
                    }
                    style={{
                      marginTop: "20px",
                      border:
                        "1px solid #ddd",
                      borderRadius:
                        "12px",
                      overflow:
                        "hidden",
                    }}
                  >


                    {/* HEADER FILE */}

                    <div
                      style={{
                        padding: "15px",
                        background:
                          "#f5f5f5",
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: "10px",
                        flexWrap:
                          "wrap",
                      }}
                    >

                      <strong>

                        {isPDF(arsip)
                          ? "📄 PDF"
                          : isImage(arsip)
                          ? "🖼️ Gambar"
                          : "📁 File"}{" "}

                        {index + 1}

                      </strong>


                      <span>
                        {arsip.nama_file ||
                          "Arsip Surat"}
                      </span>

                    </div>


                    {/* =================================================
                        GAMBAR
                    ================================================= */}

                    {isImage(arsip) && (

                      <div
                        style={{
                          padding: "20px",
                          textAlign:
                            "center",
                        }}
                      >

                        <img
                          src={arsip.url_file}
                          alt={
                            arsip.nama_file ||
                            "Arsip Surat"
                          }
                          style={{
                            maxWidth: "100%",
                            maxHeight: "650px",
                            borderRadius:
                              "8px",
                          }}
                        />

                      </div>

                    )}


                    {/* =================================================
                        PDF
                    ================================================= */}

                    {isPDF(arsip) && (

                      <iframe
                        src={arsip.url_file}
                        title={
                          arsip.nama_file ||
                          `PDF ${index + 1}`
                        }
                        style={{
                          width: "100%",
                          height: "650px",
                          border: "none",
                        }}
                      />

                    )}


                    {/* =================================================
                        BUTTON BUKA
                    ================================================= */}

                    <div
                      style={{
                        padding: "15px",
                        borderTop:
                          "1px solid #ddd",
                      }}
                    >

                      <a
                        href={arsip.url_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display:
                            "inline-block",

                          padding:
                            "10px 15px",

                          background:
                            "#173f5f",

                          color:
                            "#fff",

                          borderRadius:
                            "8px",

                          textDecoration:
                            "none",
                        }}
                      >
                        📂 Buka File
                      </a>

                    </div>

                  </div>

                )
              )}

            </div>


            {/* =================================================
                BUTTON
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
                disabled={saving}
              >

                {saving
                  ? "Menyimpan..."
                  : "✓ Simpan Perubahan"}

              </button>

            </div>

          </form>

        </section>

      </main>

    </div>

  );
}

export default EditSurat;