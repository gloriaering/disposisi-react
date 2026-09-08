import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";

import "../assets/css/TambahSurat.css";

const API_URL = "https://disposisi-react-8vdu.vercel.app";
const SCANNER_URL = "http://127.0.0.1:5050";

const TambahSurat = () => {
  const navigate = useNavigate();

  // =========================================================
  // DATA FORM
  // =========================================================
  const [formData, setFormData] = useState({
    nomor_surat: "",
    asal_surat: "",
    tanggal_surat: "",
    nomor_agenda: "",
    tanggal_diterima: "",
    jam_diterima: "",
    perihal: "",
  });

  // =========================================================
  // HASIL SCAN
  // =========================================================
  const [scanSurat, setScanSurat] = useState([]);

  // =========================================================
  // PREVIEW GAMBAR SCAN
  // =========================================================
  const [scanPreviews, setScanPreviews] = useState([]);

  // =========================================================
  // PDF HASIL GABUNGAN
  // =========================================================
  const [pdfPreview, setPdfPreview] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  // =========================================================
  // LOADING
  // =========================================================
  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  // =========================================================
  // UPDATE PREVIEW GAMBAR SETIAP HASIL SCAN BERUBAH
  // =========================================================
  useEffect(() => {
    const newPreviews = scanSurat.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setScanPreviews(newPreviews);

    return () => {
      newPreviews.forEach((item) => {
        URL.revokeObjectURL(item.url);
      });
    };
  }, [scanSurat]);

  // =========================================================
  // CLEANUP PDF PREVIEW
  // =========================================================
  useEffect(() => {
    return () => {
      if (pdfPreview) {
        URL.revokeObjectURL(pdfPreview);
      }
    };
  }, [pdfPreview]);

  // =========================================================
  // HANDLE INPUT
  // =========================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // FILE → DATA URL
  // =========================================================
  const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(
          new Error("Gagal membaca file.")
        );
      };

      reader.readAsDataURL(file);
    });
  };

  // =========================================================
  // IMAGE → JPEG
  // =========================================================
  const imageFileToJpeg = (file) => {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        try {
          const canvas =
            document.createElement("canvas");

          const ctx =
            canvas.getContext("2d");

          if (!ctx) {
            reject(
              new Error(
                "Canvas browser tidak tersedia."
              )
            );
            return;
          }

          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;

          // Background putih
          ctx.fillStyle = "#ffffff";

          ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
          );

          ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(
                  new Error(
                    "Gagal mengubah gambar menjadi JPEG."
                  )
                );
                return;
              }

              resolve(blob);
            },
            "image/jpeg",
            0.9
          );
        } catch (error) {
          reject(error);
        }
      };

      image.onerror = () => {
        reject(
          new Error(
            "Gagal membaca gambar hasil scan."
          )
        );
      };

      fileToDataURL(file)
        .then((dataURL) => {
          image.src = dataURL;
        })
        .catch(reject);
    });
  };

  // =========================================================
  // SCAN DOKUMEN
  // =========================================================
  const handleScanDocument = async () => {
    if (loadingScan) {
      return;
    }

    try {
      setLoadingScan(true);

      console.log(
        "================================="
      );

      console.log(
        "MEMULAI SCAN DOKUMEN"
      );

      console.log(
        "================================="
      );

      // -----------------------------------------------------
      // CEK SCANNER BRIDGE
      // -----------------------------------------------------
      const bridgeCheck =
        await fetch(`${SCANNER_URL}/`);

      if (!bridgeCheck.ok) {
        throw new Error(
          "Scanner Bridge tidak dapat diakses."
        );
      }

      const bridgeData =
        await bridgeCheck.json();

      console.log(
        "SCANNER BRIDGE:",
        bridgeData
      );

      // -----------------------------------------------------
      // JALANKAN SCAN
      // -----------------------------------------------------
      const response =
        await fetch(
          `${SCANNER_URL}/scan`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              nama_file: `scan_${Date.now()}.jpg`,
            }),
          }
        );

      console.log(
        "STATUS SCANNER:",
        response.status
      );

      if (!response.ok) {
        let errorMessage =
          "Scanner gagal melakukan scan.";

        try {
          const errorData =
            await response.json();

          if (errorData?.message) {
            errorMessage =
              errorData.message;
          }
        } catch {
          // Response bukan JSON
        }

        throw new Error(
          errorMessage
        );
      }

      // -----------------------------------------------------
      // AMBIL HASIL SCAN
      // -----------------------------------------------------
      const blob =
        await response.blob();

      console.log(
        "UKURAN HASIL SCAN:",
        blob.size
      );

      console.log(
        "TIPE HASIL SCAN:",
        blob.type
      );

      if (
        !blob ||
        blob.size === 0
      ) {
        throw new Error(
          "Hasil scan kosong."
        );
      }

      // -----------------------------------------------------
      // BUAT FILE JPG
      // -----------------------------------------------------
      const fileName =
        `scan_${Date.now()}.jpg`;

      const file =
        new File(
          [blob],
          fileName,
          {
            type: "image/jpeg",
          }
        );

      // -----------------------------------------------------
      // TAMBAHKAN KE DAFTAR SCAN
      // -----------------------------------------------------
      setScanSurat((prev) => {
        const halamanBerikutnya =
          prev.length + 1;

        console.log(
          `SCAN BERHASIL: halaman ${halamanBerikutnya}`
        );

        alert(
          `Scan berhasil!\n\nHalaman ke-${halamanBerikutnya} berhasil ditambahkan.`
        );

        return [
          ...prev,
          file,
        ];
      });

      // -----------------------------------------------------
      // PDF LAMA TIDAK BERLAKU LAGI
      // -----------------------------------------------------
      if (pdfPreview) {
        URL.revokeObjectURL(
          pdfPreview
        );
      }

      setPdfPreview("");
      setPdfFile(null);

      console.log(
        "Scan berhasil ditambahkan."
      );
    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "GAGAL SCAN:"
      );

      console.error(
        error
      );

      console.error(
        "================================="
      );

      alert(
        error.message ||
          "Gagal melakukan scan."
      );
    } finally {
      setLoadingScan(false);
    }
  };

  // =========================================================
  // HAPUS SATU HASIL SCAN
  // =========================================================
  const handleRemoveScan = (index) => {
    setScanSurat((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );

    // PDF harus dibuat ulang
    if (pdfPreview) {
      URL.revokeObjectURL(
        pdfPreview
      );
    }

    setPdfPreview("");
    setPdfFile(null);
  };

  // =========================================================
  // BUAT PDF
  // =========================================================
  const createPDF = async () => {
    if (scanSurat.length === 0) {
      throw new Error(
        "Belum ada hasil scan."
      );
    }

    // -----------------------------------------------------
    // JIKA 1 FILE SUDAH PDF
    // -----------------------------------------------------
    if (
      scanSurat.length === 1 &&
      scanSurat[0].type ===
        "application/pdf"
    ) {
      return new File(
        [scanSurat[0]],
        `surat_${Date.now()}.pdf`,
        {
          type: "application/pdf",
        }
      );
    }

    // -----------------------------------------------------
    // CEK APAKAH ADA PDF DI ANTARA HASIL SCAN
    // -----------------------------------------------------
    const hasPDF =
      scanSurat.some(
        (file) =>
          file.type ===
          "application/pdf"
      );

    if (hasPDF) {
      throw new Error(
        "Untuk menggabungkan beberapa halaman, gunakan hasil scan gambar saja."
      );
    }

    // -----------------------------------------------------
    // BUAT PDF A4
    // -----------------------------------------------------
    const pdf =
      new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      });

    // -----------------------------------------------------
    // MASUKKAN SETIAP HASIL SCAN
    // -----------------------------------------------------
    for (
      let i = 0;
      i < scanSurat.length;
      i++
    ) {
      const file =
        scanSurat[i];

      console.log(
        `Memasukkan halaman ${i + 1} ke PDF...`
      );

      // ---------------------------------------------------
      // UBAH GAMBAR KE JPEG
      // ---------------------------------------------------
      const jpegBlob =
        await imageFileToJpeg(
          file
        );

      const jpegFile =
        new File(
          [jpegBlob],
          `page_${i + 1}.jpg`,
          {
            type: "image/jpeg",
          }
        );

      const dataURL =
        await fileToDataURL(
          jpegFile
        );

      // ---------------------------------------------------
      // BACA UKURAN GAMBAR
      // ---------------------------------------------------
      const image =
        new Image();

      await new Promise(
        (resolve, reject) => {
          image.onload =
            resolve;

          image.onerror =
            () =>
              reject(
                new Error(
                  `Gagal membaca halaman ${i + 1}.`
                )
              );

          image.src =
            dataURL;
        }
      );

      // ---------------------------------------------------
      // UKURAN A4
      // ---------------------------------------------------
      const pageWidth =
        210;

      const pageHeight =
        297;

      const margin =
        5;

      const maxWidth =
        pageWidth -
        margin * 2;

      const maxHeight =
        pageHeight -
        margin * 2;

      // ---------------------------------------------------
      // UKURAN ASLI
      // ---------------------------------------------------
      const imageWidth =
        image.naturalWidth;

      const imageHeight =
        image.naturalHeight;

      if (
        imageWidth <= 0 ||
        imageHeight <= 0
      ) {
        throw new Error(
          `Ukuran halaman ${i + 1} tidak valid.`
        );
      }

      const ratio =
        imageWidth /
        imageHeight;

      // ---------------------------------------------------
      // SESUAIKAN DENGAN A4
      // ---------------------------------------------------
      let finalWidth =
        maxWidth;

      let finalHeight =
        finalWidth /
        ratio;

      if (
        finalHeight >
        maxHeight
      ) {
        finalHeight =
          maxHeight;

        finalWidth =
          finalHeight *
          ratio;
      }

      // ---------------------------------------------------
      // POSISI TENGAH
      // ---------------------------------------------------
      const x =
        (pageWidth -
          finalWidth) /
        2;

      const y =
        (pageHeight -
          finalHeight) /
        2;

      // ---------------------------------------------------
      // HALAMAN BARU
      // ---------------------------------------------------
      if (i > 0) {
        pdf.addPage(
          "a4",
          "portrait"
        );
      }

      // ---------------------------------------------------
      // MASUKKAN GAMBAR
      // ---------------------------------------------------
      pdf.addImage(
        dataURL,
        "JPEG",
        x,
        y,
        finalWidth,
        finalHeight,
        undefined,
        "FAST"
      );
    }

    // -----------------------------------------------------
    // HASIL PDF
    // -----------------------------------------------------
    const pdfBlob =
      pdf.output(
        "blob"
      );

    if (
      !pdfBlob ||
      pdfBlob.size === 0
    ) {
      throw new Error(
        "PDF berhasil diproses tetapi file PDF kosong."
      );
    }

    const finalPDF =
      new File(
        [pdfBlob],
        `surat_${Date.now()}.pdf`,
        {
          type: "application/pdf",
        }
      );

    console.log(
      "PDF BERHASIL DIBUAT:",
      finalPDF.name
    );

    console.log(
      "UKURAN PDF:",
      finalPDF.size
    );

    return finalPDF;
  };

  // =========================================================
  // BUAT PDF + PREVIEW
  // =========================================================
  const handleCreatePDF =
    async () => {
      if (loadingPDF) {
        return;
      }

      try {
        setLoadingPDF(true);

        if (
          scanSurat.length === 0
        ) {
          alert(
            "Silakan scan surat terlebih dahulu."
          );

          return;
        }

        console.log(
          "================================="
        );

        console.log(
          "MEMBUAT PDF"
        );

        console.log(
          "Jumlah halaman:",
          scanSurat.length
        );

        console.log(
          "================================="
        );

        const resultPDF =
          await createPDF();

        if (!resultPDF) {
          throw new Error(
            "PDF gagal dibuat."
          );
        }

        // ---------------------------------------------------
        // HAPUS PREVIEW PDF LAMA
        // ---------------------------------------------------
        if (pdfPreview) {
          URL.revokeObjectURL(
            pdfPreview
          );
        }

        // ---------------------------------------------------
        // BUAT PREVIEW PDF
        // ---------------------------------------------------
        const previewURL =
          URL.createObjectURL(
            resultPDF
          );

        setPdfFile(
          resultPDF
        );

        setPdfPreview(
          previewURL
        );

        console.log(
          "PDF PREVIEW SIAP"
        );

        alert(
          `PDF berhasil dibuat!\n\n${scanSurat.length} halaman telah digabung menjadi 1 PDF.`
        );
      } catch (error) {
        console.error(
          "Gagal membuat PDF:",
          error
        );

        alert(
          error.message ||
            "Gagal membuat PDF."
        );
      } finally {
        setLoadingPDF(false);
      }
    };

  // =========================================================
  // SIMPAN SURAT
  // =========================================================
  const handleSubmit =
    async (e) => {
      e.preventDefault();

      if (loadingSave) {
        return;
      }

      try {
        // ---------------------------------------------------
        // VALIDASI FORM
        // ---------------------------------------------------
        if (
          !formData.nomor_surat.trim()
        ) {
          alert(
            "Nomor surat wajib diisi."
          );
          return;
        }

        if (
          !formData.asal_surat.trim()
        ) {
          alert(
            "Asal surat wajib diisi."
          );
          return;
        }

        if (
          !formData.tanggal_surat
        ) {
          alert(
            "Tanggal surat wajib diisi."
          );
          return;
        }

        if (
          !formData.nomor_agenda.trim()
        ) {
          alert(
            "Nomor agenda wajib diisi."
          );
          return;
        }

        if (
          !formData.tanggal_diterima
        ) {
          alert(
            "Tanggal diterima wajib diisi."
          );
          return;
        }

        if (
          !formData.jam_diterima
        ) {
          alert(
            "Jam diterima wajib diisi."
          );
          return;
        }

        if (
          !formData.perihal.trim()
        ) {
          alert(
            "Perihal wajib diisi."
          );
          return;
        }

        if (
          scanSurat.length === 0
        ) {
          alert(
            "Silakan scan surat terlebih dahulu."
          );
          return;
        }

        // ---------------------------------------------------
        // TOKEN LOGIN
        // ---------------------------------------------------
        const token =
          localStorage.getItem(
            "token"
          );

        if (!token) {
          alert(
            "Sesi login tidak ditemukan. Silakan login kembali."
          );

          navigate(
            "/login"
          );

          return;
        }

        // ---------------------------------------------------
        // PDF BELUM DIBUAT
        // ---------------------------------------------------
        let finalPDF =
          pdfFile;

        if (!finalPDF) {
          const konfirmasi =
            window.confirm(
              "PDF belum dibuat.\n\nBuat PDF sekarang?"
            );

          if (!konfirmasi) {
            return;
          }

          setLoadingSave(
            true
          );

          finalPDF =
            await createPDF();

          // -------------------------------------------------
          // TAMPILKAN PREVIEW
          // -------------------------------------------------
          if (pdfPreview) {
            URL.revokeObjectURL(
              pdfPreview
            );
          }

          const previewURL =
            URL.createObjectURL(
              finalPDF
            );

          setPdfPreview(
            previewURL
          );

          setPdfFile(
            finalPDF
          );

          alert(
            "PDF berhasil dibuat dan ditampilkan sebagai preview.\n\nPeriksa PDF terlebih dahulu, kemudian klik 'Simpan Surat' lagi."
          );

          return;
        }

        // ---------------------------------------------------
        // MULAI SIMPAN
        // ---------------------------------------------------
        setLoadingSave(
          true
        );

        // ---------------------------------------------------
        // FORMDATA
        // ---------------------------------------------------
        const data =
          new FormData();

        data.append(
          "nomor_surat",
          formData.nomor_surat
        );

        data.append(
          "asal_surat",
          formData.asal_surat
        );

        data.append(
          "tanggal_surat",
          formData.tanggal_surat
        );

        data.append(
          "nomor_agenda",
          formData.nomor_agenda
        );

        data.append(
          "tanggal_diterima",
          formData.tanggal_diterima
        );

        data.append(
          "jam_diterima",
          formData.jam_diterima
        );

        data.append(
          "perihal",
          formData.perihal
        );

        // ---------------------------------------------------
        // HANYA 1 PDF YANG DIKIRIM
        // ---------------------------------------------------
        data.append(
          "arsip_surat",
          finalPDF,
          finalPDF.name
        );

        console.log(
          "================================="
        );

        console.log(
          "MENGIRIM SURAT KE BACKEND"
        );

        console.log(
          "API:",
          `${API_URL}/api/surat`
        );

        console.log(
          "PDF:",
          finalPDF.name
        );

        console.log(
          "UKURAN PDF:",
          finalPDF.size
        );

        console.log(
          "================================="
        );

        // ---------------------------------------------------
        // POST BACKEND
        // ---------------------------------------------------
        const response =
          await fetch(
            `${API_URL}/api/surat`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              body: data,
            }
          );

        console.log(
          "STATUS SIMPAN:",
          response.status
        );

        // ---------------------------------------------------
        // BACA RESPONSE
        // ---------------------------------------------------
        let result;

        try {
          result =
            await response.json();
        } catch {
          result = {};
        }

        console.log(
          "HASIL SIMPAN:",
          result
        );

        // ---------------------------------------------------
        // TOKEN EXPIRED
        // ---------------------------------------------------
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "user"
          );

          alert(
            "Sesi login sudah berakhir. Silakan login kembali."
          );

          navigate(
            "/login"
          );

          return;
        }

        // ---------------------------------------------------
        // ERROR BACKEND
        // ---------------------------------------------------
        if (!response.ok) {
          throw new Error(
            result.message ||
              `Gagal menyimpan surat. Status: ${response.status}`
          );
        }

        // ---------------------------------------------------
        // BERHASIL
        // ---------------------------------------------------
        alert(
          `Surat berhasil disimpan!\n\n${scanSurat.length} halaman hasil scan telah digabung menjadi 1 PDF.`
        );

        navigate(
          "/surat"
        );
      } catch (error) {
        console.error(
          "================================="
        );

        console.error(
          "GAGAL MENYIMPAN SURAT"
        );

        console.error(
          error
        );

        console.error(
          "================================="
        );

        alert(
          error.message ||
            "Terjadi kesalahan saat menyimpan surat."
        );
      } finally {
        setLoadingSave(
          false
        );
      }
    };

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="tambah-container">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="tambah-header">

        <h1>
          Tambah Surat Masuk
        </h1>

        <button
          type="button"
          className="btn-kembali"
          onClick={() =>
            navigate("/surat")
          }
        >
          ← Kembali
        </button>

      </div>

      {/* =====================================================
          FORM
      ===================================================== */}
      <form
        className="tambah-form"
        onSubmit={
          handleSubmit
        }
      >

        {/* ===================================================
            DATA SURAT
        =================================================== */}
        <div className="form-section">

          <h2>
            Data Surat
          </h2>

          <div className="form-grid">

            {/* NOMOR SURAT */}
            <div className="form-group">

              <label>
                Nomor Surat
              </label>

              <input
                type="text"
                name="nomor_surat"
                value={
                  formData.nomor_surat
                }
                onChange={
                  handleChange
                }
                placeholder="Masukkan nomor surat"
              />

            </div>

            {/* ASAL SURAT */}
            <div className="form-group">

              <label>
                Asal Surat
              </label>

              <input
                type="text"
                name="asal_surat"
                value={
                  formData.asal_surat
                }
                onChange={
                  handleChange
                }
                placeholder="Masukkan asal surat"
              />

            </div>

            {/* TANGGAL SURAT */}
            <div className="form-group">

              <label>
                Tanggal Surat
              </label>

              <input
                type="date"
                name="tanggal_surat"
                value={
                  formData.tanggal_surat
                }
                onChange={
                  handleChange
                }
              />

            </div>

            {/* NOMOR AGENDA */}
            <div className="form-group">

              <label>
                Nomor Agenda
              </label>

              <input
                type="text"
                name="nomor_agenda"
                value={
                  formData.nomor_agenda
                }
                onChange={
                  handleChange
                }
                placeholder="Masukkan nomor agenda"
              />

            </div>

            {/* TANGGAL DITERIMA */}
            <div className="form-group">

              <label>
                Tanggal Diterima
              </label>

              <input
                type="date"
                name="tanggal_diterima"
                value={
                  formData.tanggal_diterima
                }
                onChange={
                  handleChange
                }
              />

            </div>

            {/* JAM DITERIMA */}
            <div className="form-group">

              <label>
                Jam Diterima
              </label>

              <input
                type="time"
                name="jam_diterima"
                value={
                  formData.jam_diterima
                }
                onChange={
                  handleChange
                }
              />

            </div>

            {/* PERIHAL */}
            <div className="form-group full-width">

              <label>
                Perihal
              </label>

              <textarea
                name="perihal"
                value={
                  formData.perihal
                }
                onChange={
                  handleChange
                }
                placeholder="Masukkan perihal surat"
                rows="4"
              />

            </div>

          </div>

        </div>

        {/* ===================================================
            SCAN SURAT
        =================================================== */}
        <div className="form-section">

          <h2>
            Scan Surat
          </h2>

          <p className="scan-info">
            Scanner:{" "}
            <strong>
              Epson L3210
            </strong>
          </p>

          {/* TOMBOL SCAN */}
          <button
            type="button"
            className="btn-scan"
            onClick={
              handleScanDocument
            }
            disabled={
              loadingScan
            }
          >
            {loadingScan
              ? "⏳ Sedang Scan..."
              : "📠 Scan Surat"}
          </button>

          {/* =================================================
              HASIL SCAN
          ================================================= */}
          {scanSurat.length > 0 && (

            <div className="scan-preview-section">

              <h3>
                Hasil Scan (
                {scanSurat.length}
                {" "}
                halaman)
              </h3>

              <div className="scan-preview-grid">

                {scanPreviews.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      className="scan-preview-card"
                      key={`${item.file.name}-${index}`}
                    >

                      <div className="scan-preview-header">

                        <strong>
                          Halaman{" "}
                          {index + 1}
                        </strong>

                        <button
                          type="button"
                          className="btn-remove-scan"
                          onClick={() =>
                            handleRemoveScan(
                              index
                            )
                          }
                        >
                          ✕
                        </button>

                      </div>

                      <img
                        src={item.url}
                        alt={`Hasil scan halaman ${
                          index + 1
                        }`}
                        className="scan-preview-image"
                      />

                    </div>

                  )
                )}

              </div>

              {/* =================================================
                  BUAT PDF
              ================================================= */}
              <div className="pdf-action-area">

                <button
                  type="button"
                  className="btn-create-pdf"
                  onClick={
                    handleCreatePDF
                  }
                  disabled={
                    loadingPDF
                  }
                >
                  {loadingPDF
                    ? "⏳ Membuat PDF..."
                    : "📄 Buat PDF & Preview"}
                </button>

              </div>

            </div>

          )}

          {/* =================================================
              PDF PREVIEW
          ================================================= */}
          {pdfPreview && (

            <div className="pdf-preview-section">

              <div className="pdf-preview-header">

                <div>

                  <h3>
                    Preview PDF
                  </h3>

                  <p>
                    {scanSurat.length}
                    {" "}
                    halaman sudah
                    digabung menjadi
                    satu PDF.
                  </p>

                </div>

                <span className="pdf-status">
                  ✓ PDF Siap
                </span>

              </div>

              <div className="pdf-viewer">

                <iframe
                  src={pdfPreview}
                  title="Preview PDF Surat"
                />

              </div>

              <div className="pdf-info">

                <span>
                  📄{" "}
                  {pdfFile?.name ||
                    "surat.pdf"}
                </span>

                <span>
                  {pdfFile
                    ? `${(
                        pdfFile.size /
                        1024
                      ).toFixed(
                        1
                      )} KB`
                    : ""}
                </span>

              </div>

              <p className="pdf-note">

                Periksa PDF di atas
                terlebih dahulu.
                Jika semua halaman
                sudah benar, klik{" "}
                <strong>
                  "Simpan Surat"
                </strong>
                .

              </p>

            </div>

          )}

        </div>

        {/* ===================================================
            TOMBOL AKHIR
        =================================================== */}
        <div className="form-actions">

          <button
            type="button"
            className="btn-batal"
            onClick={() =>
              navigate("/surat")
            }
            disabled={
              loadingSave
            }
          >
            Batal
          </button>

          <button
            type="submit"
            className="btn-simpan"
            disabled={
              loadingSave
            }
          >
            {loadingSave
              ? "⏳ Menyimpan..."
              : "💾 Simpan Surat"}
          </button>

        </div>

      </form>

      {/* =====================================================
          STYLE TAMBAHAN
      ===================================================== */}
      <style>{`

        .scan-info {
          margin-bottom: 15px;
          color: #555;
        }

        .btn-scan {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .btn-scan:disabled,
        .btn-create-pdf:disabled,
        .btn-simpan:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .scan-preview-section {
          margin-top: 20px;
        }

        .scan-preview-section h3 {
          margin-bottom: 15px;
        }

        .scan-preview-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(250px, 1fr)
          );
          gap: 20px;
        }

        .scan-preview-card {
          border: 1px solid #ddd;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
        }

        .scan-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: #f5f5f5;
        }

        .btn-remove-scan {
          border: none;
          background: transparent;
          color: #d00;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
        }

        .scan-preview-image {
          display: block;
          width: 100%;
          max-height: 500px;
          object-fit: contain;
          background: #eee;
        }

        .pdf-action-area {
          margin-top: 25px;
          text-align: center;
        }

        .btn-create-pdf {
          padding: 13px 22px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
        }

        .pdf-preview-section {
          margin-top: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 12px;
          background: #fafafa;
        }

        .pdf-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 15px;
        }

        .pdf-preview-header h3 {
          margin: 0 0 5px;
        }

        .pdf-preview-header p {
          margin: 0;
          color: #666;
        }

        .pdf-status {
          padding: 7px 12px;
          border-radius: 20px;
          background: #e8f7e8;
          color: #238523;
          font-weight: 700;
          white-space: nowrap;
        }

        .pdf-viewer {
          width: 100%;
          height: 700px;
          border: 1px solid #ccc;
          border-radius: 8px;
          overflow: hidden;
          background: #525659;
        }

        .pdf-viewer iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        .pdf-info {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 10px;
          font-size: 14px;
          color: #555;
        }

        .pdf-note {
          margin-top: 15px;
          padding: 12px;
          border-radius: 8px;
          background: #fff;
          border: 1px solid #ddd;
          color: #555;
        }

        @media (max-width: 650px) {

          .scan-preview-grid {
            grid-template-columns: 1fr;
          }

          .pdf-preview-section {
            padding: 12px;
          }

          .pdf-preview-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .pdf-viewer {
            height: 500px;
          }

          .pdf-info {
            flex-direction: column;
          }

        }

        @media (max-width: 400px) {

          .pdf-viewer {
            height: 450px;
          }

        }

      `}</style>

    </div>
  );
};

export default TambahSurat;