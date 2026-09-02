import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";
import "../assets/css/TambahSurat.css";

function EditSurat() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  const [arsipFile, setArsipFile] = useState(null);
  const [arsipLama, setArsipLama] = useState(null);
  const [previewBaru, setPreviewBaru] = useState("");

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
          "http://localhost:5000/api/surat/" + id
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Gagal mengambil data surat."
          );
        }

        const surat = result.data || result;

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
            Array.isArray(
              surat.diteruskan_kepada
            )
              ? surat.diteruskan_kepada
              : [],

          dengan_hormat_harap:
            Array.isArray(
              surat.dengan_hormat_harap
            )
              ? surat.dengan_hormat_harap
              : [],

          catatan:
            surat.catatan || "",
        });

        // =====================================================
        // ARSIP LAMA
        // =====================================================

        if (
          surat.arsip_surat &&
          typeof surat.arsip_surat === "object" &&
          surat.arsip_surat.url_file
        ) {
          setArsipLama(
            surat.arsip_surat
          );
        } else {
          setArsipLama(null);
        }

      } catch (err) {

        console.error(
          "Gagal mengambil data surat:",
          err
        );

        setError(
          err.message ||
            "Gagal mengambil data surat. Pastikan backend sedang berjalan."
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
  // BERSIHKAN PREVIEW FILE BARU
  // =========================================================

  useEffect(() => {

    return () => {

      if (previewBaru) {
        URL.revokeObjectURL(
          previewBaru
        );
      }

    };

  }, [previewBaru]);


  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

  };


  // =========================================================
  // HANDLE TANGGAL SURAT
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
  // CEK FILE YANG DIIZINKAN
  // =========================================================

  const fileDiizinkan = (file) => {

    const tipeDiizinkan = [

      "application/pdf",

      "image/jpeg",

      "image/jpg",

      "image/png",

      "image/webp",

      "application/zip",

      "application/x-zip-compressed",

    ];

    return tipeDiizinkan.includes(
      file.type
    );

  };


  // =========================================================
  // PROSES FILE BARU
  // =========================================================

  const prosesArsip = (file, inputElement = null) => {

    setError("");

    if (!file) {

      setArsipFile(null);

      if (previewBaru) {

        URL.revokeObjectURL(
          previewBaru
        );

      }

      setPreviewBaru("");

      return;

    }


    // CEK TIPE FILE

    if (!fileDiizinkan(file)) {

      setError(
        "Format file tidak didukung. Gunakan PDF, JPG, JPEG, PNG, WEBP, atau ZIP."
      );

      if (inputElement) {
        inputElement.value = "";
      }

      setArsipFile(null);

      setPreviewBaru("");

      return;

    }


    // CEK UKURAN FILE

    if (
      file.size >
      20 * 1024 * 1024
    ) {

      setError(
        "Ukuran file maksimal 20 MB."
      );

      if (inputElement) {
        inputElement.value = "";
      }

      setArsipFile(null);

      setPreviewBaru("");

      return;

    }


    // HAPUS PREVIEW LAMA

    if (previewBaru) {

      URL.revokeObjectURL(
        previewBaru
      );

    }


    // BUAT PREVIEW BARU

    const url =
      URL.createObjectURL(file);

    setArsipFile(file);

    setPreviewBaru(url);

  };


  // =========================================================
  // HANDLE PILIH FILE
  // =========================================================

  const handleArsipChange = (e) => {

    const file =
      e.target.files?.[0] || null;

    prosesArsip(
      file,
      e.target
    );

  };


  // =========================================================
  // HANDLE FOTO DARI KAMERA
  // =========================================================

  const handleCameraChange = (e) => {

    const file =
      e.target.files?.[0] || null;

    prosesArsip(
      file,
      e.target
    );

  };


  // =========================================================
  // CEK JENIS FILE
  // =========================================================

  const adalahGambar = (file) => {

    if (!file) return false;

    return file.type.startsWith(
      "image/"
    );

  };

  const adalahPDF = (file) => {

    if (!file) return false;

    return file.type ===
      "application/pdf";

  };

  const adalahZIP = (file) => {

    if (!file) return false;

    return (

      file.type ===
        "application/zip" ||

      file.type ===
        "application/x-zip-compressed"

    );

  };


  // =========================================================
  // SIMPAN PERUBAHAN
  // =========================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");

    if (

      !form.nomor_surat.trim() ||

      !form.asal_surat.trim() ||

      !form.tanggal_surat.trim() ||

      !form.nomor_agenda.trim() ||

      !form.tanggal_diterima.trim() ||

      !form.jam_diterima.trim() ||

      !form.perihal.trim()

    ) {

      setError(
        "Semua field bertanda * wajib diisi."
      );

      return;

    }


    // CEK FILE BARU JIKA ADA

    if (arsipFile) {

      if (!fileDiizinkan(arsipFile)) {

        setError(
          "Format file tidak didukung."
        );

        return;

      }

      if (
        arsipFile.size >
        20 * 1024 * 1024
      ) {

        setError(
          "Ukuran file maksimal 20 MB."
        );

        return;

      }

    }


    try {

      setSaving(true);

      const data =
        new FormData();

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


      // FILE BARU

      if (arsipFile) {

        data.append(
          "arsip_surat",
          arsipFile
        );

      }

      const response =
        await fetch(

          "http://localhost:5000/api/surat/" +
            id,

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

      <div className="tambah-page">

        <main
          className="tambah-main"
          style={{
            marginLeft: 0,
            width: "100%",
          }}
        >

          <div
            style={{
              padding: "60px",
              textAlign: "center",
            }}
          >
            Memuat data surat...
          </div>

        </main>

      </div>

    );

  }


  // =========================================================
  // TAMPILAN
  // =========================================================

  return (

    <div className="tambah-page">

      {/* SIDEBAR */}

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


      {/* MAIN */}

      <main className="tambah-main">

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


        <section className="tambah-content">

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


          {/* FORM */}

          <form
            className="tambah-form-card"
            onSubmit={handleSubmit}
          >

            <div className="tambah-form-top">

              <div>

                <h3>
                  Informasi Surat
                </h3>

                <p>
                  Periksa dan perbarui informasi surat dengan benar.
                </p>

              </div>

            </div>


            {/* FORM GRID */}

            <div className="tambah-form-grid">


              <div className="tambah-form-group">

                <label>
                  Surat Dari <b>*</b>
                </label>

                <input
                  type="text"
                  name="asal_surat"
                  value={form.asal_surat}
                  onChange={handleChange}
                  placeholder="Contoh: Dinas Pendidikan"
                  autoComplete="off"
                />

              </div>


              <div className="tambah-form-group">

                <label>
                  Tanggal Diterima <b>*</b>
                </label>

                <input
                  type="text"
                  name="tanggal_diterima"
                  value={form.tanggal_diterima}
                  readOnly
                />

              </div>


              <div className="tambah-form-group">

                <label>
                  Nomor Surat <b>*</b>
                </label>

                <input
                  type="text"
                  name="nomor_surat"
                  value={form.nomor_surat}
                  onChange={handleChange}
                  placeholder="Contoh: 005/123/DISNAKERTRANS"
                  autoComplete="off"
                />

              </div>


              <div className="tambah-form-group">

                <label>
                  Nomor Agenda <b>*</b>
                </label>

                <input
                  type="text"
                  name="nomor_agenda"
                  value={form.nomor_agenda}
                  onChange={handleChange}
                  placeholder="Contoh: 001"
                  autoComplete="off"
                />

              </div>


              <div className="tambah-form-group">

                <label>
                  Tanggal Surat <b>*</b>
                </label>

                <input
                  type="text"
                  name="tanggal_surat"
                  value={form.tanggal_surat}
                  onChange={handleTanggalSuratChange}
                  placeholder="Contoh: 28-08-2026"
                  maxLength={10}
                  inputMode="numeric"
                  autoComplete="off"
                />

              </div>


              <div className="tambah-form-group">

                <label>
                  Jam Diterima <b>*</b>
                </label>

                <input
                  type="time"
                  name="jam_diterima"
                  value={form.jam_diterima}
                  readOnly
                />

              </div>

            </div>


            {/* PERIHAL */}

            <div className="tambah-form-group tambah-full">

              <label>
                Perihal <b>*</b>
              </label>

              <textarea
                name="perihal"
                value={form.perihal}
                onChange={handleChange}
                placeholder="Masukkan perihal surat"
                rows="4"
              />

            </div>


            {/* =================================================
                ARSIP SURAT
            ================================================= */}

            <div className="tambah-form-group tambah-full">

              <label>
                Arsip Surat
              </label>


              {/* PILIH FILE */}

              <input
                type="file"
                accept="
                  application/pdf,
                  image/jpeg,
                  image/png,
                  image/webp,
                  application/zip,
                  application/x-zip-compressed,
                  .pdf,
                  .jpg,
                  .jpeg,
                  .png,
                  .webp,
                  .zip
                "
                onChange={handleArsipChange}
              />


              {/* KAMERA */}

              <div
                style={{
                  marginTop: "12px",
                }}
              >

                <label
                  style={{
                    display: "inline-block",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  📷 Ambil Foto Langsung
                </label>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraChange}
                />

              </div>


              <small>

                Kamu dapat memilih PDF, JPG, JPEG,
                PNG, WEBP, ZIP atau langsung mengambil
                foto menggunakan kamera.

                <br />

                Maksimal ukuran file 20 MB.

              </small>


              {/* FILE BARU */}

              {arsipFile && (

                <div
                  style={{
                    marginTop: "18px",
                    border:
                      "1px solid #d9dee5",
                    borderRadius:
                      "12px",
                    overflow:
                      "hidden",
                    background:
                      "#f7f8fa",
                  }}
                >

                  <div
                    style={{
                      padding:
                        "12px 16px",

                      background:
                        "#eef1f5",

                      borderBottom:
                        "1px solid #d9dee5",

                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      alignItems:
                        "center",

                      gap:
                        "10px",

                      flexWrap:
                        "wrap",
                    }}
                  >

                    <strong>

                      {adalahPDF(arsipFile)
                        ? "📄 Preview PDF Baru"
                        : adalahGambar(arsipFile)
                        ? "🖼️ Preview Gambar Baru"
                        : adalahZIP(arsipFile)
                        ? "📦 File ZIP Baru"
                        : "📁 File Baru"}

                    </strong>

                    <span>
                      {arsipFile.name}
                    </span>

                  </div>


                  {/* PREVIEW PDF */}

                  {adalahPDF(arsipFile) && (

                    <iframe
                      src={previewBaru}
                      title="Preview PDF Baru"
                      style={{
                        width: "100%",
                        height: "650px",
                        border: "none",
                        display: "block",
                      }}
                    />

                  )}


                  {/* PREVIEW GAMBAR */}

                  {adalahGambar(arsipFile) && (

                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                      }}
                    >

                      <img
                        src={previewBaru}
                        alt="Preview Arsip Baru"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "650px",
                          borderRadius: "8px",
                        }}
                      />

                    </div>

                  )}


                  {/* ZIP */}

                  {adalahZIP(arsipFile) && (

                    <div
                      style={{
                        padding: "25px",
                        textAlign: "center",
                        color: "#555",
                      }}
                    >

                      <div
                        style={{
                          fontSize: "40px",
                          marginBottom: "10px",
                        }}
                      >
                        📦
                      </div>

                      <strong>
                        File ZIP siap diupload
                      </strong>

                      <p>
                        File ZIP tidak memiliki preview langsung.
                      </p>

                    </div>

                  )}

                </div>

              )}


              {/* =================================================
                  ARSIP LAMA
              ================================================= */}

              {!arsipFile &&
                arsipLama &&
                arsipLama.url_file && (

                <div
                  style={{
                    marginTop: "18px",
                    border:
                      "1px solid #d9dee5",
                    borderRadius:
                      "12px",
                    overflow:
                      "hidden",
                    background:
                      "#f7f8fa",
                  }}
                >

                  <div
                    style={{
                      padding:
                        "12px 16px",

                      background:
                        "#eef1f5",

                      borderBottom:
                        "1px solid #d9dee5",

                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      alignItems:
                        "center",

                      gap:
                        "10px",

                      flexWrap:
                        "wrap",
                    }}
                  >

                    <strong>
                      📁 Arsip Surat Saat Ini
                    </strong>

                    <span>
                      {arsipLama.nama_file ||
                        "Arsip Surat"}
                    </span>

                  </div>


                  {/* CEK PDF ATAU GAMBAR */}

                  {(arsipLama.tipe_file ===
                    "application/pdf" ||
                    arsipLama.nama_file
                      ?.toLowerCase()
                      .endsWith(".pdf")) ? (

                    /* PDF LAMA */

                    <iframe
                      src={
                        "http://localhost:5000/api/surat/preview/" +
                        id
                      }
                      title="Preview Arsip Surat"
                      style={{
                        width: "100%",
                        height: "650px",
                        border: "none",
                        display: "block",
                        background: "#fff",
                      }}
                    />

                  ) : (

                    arsipLama.tipe_file?.startsWith(
                      "image/"
                    ) ||
                    /\.(jpg|jpeg|png|webp)$/i.test(
                      arsipLama.nama_file || ""
                    )

                  ) ? (

                    /* GAMBAR LAMA */

                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        background: "#ffffff",
                      }}
                    >

                      <img
                        src={
                          "http://localhost:5000/api/surat/preview/" +
                          id
                        }
                        alt="Arsip Surat"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "650px",
                          borderRadius: "8px",
                        }}
                      />

                    </div>

                  ) : (

                    /* FILE LAIN */

                    <div
                      style={{
                        padding: "25px",
                        textAlign: "center",
                      }}
                    >

                      📦 File arsip tersimpan.

                    </div>

                  )}


                  {/* BUKA FILE */}

                  <div
                    style={{
                      padding:
                        "12px 16px",

                      borderTop:
                        "1px solid #d9dee5",

                      background:
                        "#fff",
                    }}
                  >

                    <a
                      href={
                        "http://localhost:5000/api/surat/preview/" +
                        id
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display:
                          "inline-block",

                        padding:
                          "9px 15px",

                        borderRadius:
                          "8px",

                        background:
                          "#173f5f",

                        color:
                          "#fff",

                        textDecoration:
                          "none",

                        fontWeight:
                          "600",
                      }}
                    >
                      📂 Buka Arsip
                    </a>

                  </div>

                </div>

              )}


              {/* BELUM ADA ARSIP */}

              {!arsipFile &&
                !arsipLama && (

                <div
                  style={{
                    marginTop: "15px",
                    padding: "20px",
                    textAlign: "center",
                    border:
                      "1px dashed #cfd5dc",
                    borderRadius: "10px",
                    color: "#777",
                  }}
                >
                  Belum ada arsip untuk surat ini.
                </div>

              )}

            </div>


            {/* BUTTON */}

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