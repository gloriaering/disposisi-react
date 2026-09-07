import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";

import "./TambahSurat.css";

const API_URL = "https://disposisi-react-8vdu.vercel.app";
const SCANNER_URL = "http://127.0.0.1:5050";

const TambahSurat = () => {
  const navigate = useNavigate();

  // =========================
  // DATA FORM
  // =========================
  const [formData, setFormData] = useState({
    nomor_surat: "",
    asal_surat: "",
    tanggal_surat: "",
    nomor_agenda: "",
    tanggal_diterima: "",
    jam_diterima: "",
    perihal: "",
  });

  // =========================
  // FILE HASIL SCAN
  // =========================
  const [scanSurat, setScanSurat] = useState([]);

  // =========================
  // PDF HASIL GABUNGAN
  // =========================
  const [pdfPreview, setPdfPreview] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  // =========================
  // CLEANUP PDF BLOB
  // =========================
  useEffect(() => {
    return () => {
      if (pdfPreview) {
        URL.revokeObjectURL(pdfPreview);
      }
    };
  }, [pdfPreview]);

  // =========================
  // HANDLE INPUT
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // FORMAT FILE
  // =========================
  const validFileTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  // =========================
  // FILE → DATA URL
  // =========================
  const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Gagal membaca file."));

      reader.readAsDataURL(file);
    });
  };

  // =========================
  // IMAGE → JPEG
  // =========================
  const imageFileToJpeg = (file) => {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;

          // Background putih
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

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
                  new Error("Gagal mengubah gambar menjadi JPEG.")
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
        reject(new Error("Gagal membaca gambar hasil scan."));
      };

      fileToDataURL(file)
        .then((dataURL) => {
          image.src = dataURL;
        })
        .catch(reject);
    });
  };

  // =========================
  // SCAN DOKUMEN
  // =========================
  const handleScanDocument = async () => {
    if (loadingScan) return;

    try {
      setLoadingScan(true);

      console.log("=================================");
      console.log("MEMULAI SCAN DOKUMEN");
      console.log("=================================");

      // Cek scanner bridge
      const bridgeCheck = await fetch(`${SCANNER_URL}/`);

      if (!bridgeCheck.ok) {
        throw new Error(
          "Scanner Bridge tidak dapat diakses."
        );
      }

      // Jalankan scan
      const response = await fetch(`${SCANNER_URL}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_file: `scan_${Date.now()}.jpg`,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Scanner gagal melakukan scan.";

        try {
          const errorData = await response.json();

          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Abaikan jika response bukan JSON
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();

      if (!blob || blob.size === 0) {
        throw new Error(
          "Hasil scan kosong."
        );
      }

      const fileName = `scan_${Date.now()}.jpg`;

      const file = new File(
        [blob],
        fileName,
        {
          type: "image/jpeg",
        }
      );

      // Tambahkan scan baru
      setScanSurat((prev) => [
        ...prev,
        file,
      ]);

      // Kalau ada PDF preview lama,
      // hapus karena jumlah halaman berubah
      if (pdfPreview) {
        URL.revokeObjectURL(pdfPreview);
        setPdfPreview("");
      }

      setPdfFile(null);

      console.log(
        "SCAN BERHASIL:",
        file.name
      );

      alert(
        `Scan berhasil!\n\nHalaman ke-${scanSurat.length + 1} berhasil ditambahkan.`
      );
    } catch (error) {
      console.error(
        "Gagal scan:",
        error
      );

      alert(
        error.message ||
          "Gagal melakukan scan."
      );
    } finally {
      setLoadingScan(false);
    }
  };

  // =========================
  // HAPUS SATU HASIL SCAN
  // =========================
  const handleRemoveScan = (index) => {
    setScanSurat((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );

    // Reset PDF preview
    if (pdfPreview) {
      URL.revokeObjectURL(pdfPreview);
    }

    setPdfPreview("");
    setPdfFile(null);
  };

  // =========================
  // BUAT PDF
  // =========================
  const createPDF = async () => {
    if (scanSurat.length === 0) {
      throw new Error(
        "Belum ada hasil scan."
      );
    }

    // Kalau hanya satu file dan file tersebut PDF
    if (
      scanSurat.length === 1 &&
      scanSurat[0].type === "application/pdf"
    ) {
      return new File(
        [scanSurat[0]],
        `surat_${Date.now()}.pdf`,
        {
          type: "application/pdf",
        }
      );
    }

    // Pastikan semua adalah gambar
    const hasPDF = scanSurat.some(
      (file) =>
        file.type === "application/pdf"
    );

    if (hasPDF) {
      throw new Error(
        "Untuk menggabungkan beberapa halaman, gunakan hasil scan gambar saja."
      );
    }

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    for (
      let i = 0;
      i < scanSurat.length;
      i++
    ) {
      const file = scanSurat[i];

      console.log(
        `Memasukkan halaman ${i + 1} ke PDF...`
      );

      const jpegBlob =
        await imageFileToJpeg(file);

      const dataURL =
        await fileToDataURL(
          new File(
            [jpegBlob],
            `page_${i + 1}.jpg`,
            {
              type: "image/jpeg",
            }
          )
        );

      const image = new Image();

      await new Promise(
        (resolve, reject) => {
          image.onload = resolve;
          image.onerror = () =>
            reject(
              new Error(
                `Gagal membaca halaman ${i + 1}.`
              )
            );

          image.src = dataURL;
        }
      );

      const pageWidth = 210;
      const pageHeight = 297;

      const margin = 5;

      const maxWidth =
        pageWidth - margin * 2;

      const maxHeight =
        pageHeight - margin * 2;

      const imageWidth =
        image.naturalWidth;

      const imageHeight =
        image.naturalHeight;

      const ratio =
        imageWidth / imageHeight;

      let finalWidth = maxWidth;
      let finalHeight =
        finalWidth / ratio;

      if (
        finalHeight > maxHeight
      ) {
        finalHeight = maxHeight;
        finalWidth =
          finalHeight * ratio;
      }

      const x =
        (pageWidth - finalWidth) / 2;

      const y =
        (pageHeight - finalHeight) / 2;

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        dataURL,
        "JPEG",
        x,
        y,
        finalWidth,
        finalHeight
      );
    }

    const pdfBlob =
      pdf.output("blob");

    return new File(
      [pdfBlob],
      `surat_${Date.now()}.pdf`,
      {
        type: "application/pdf",
      }
    );
  };

  // =========================
  // BUAT PDF + PREVIEW
  // =========================
  const handleCreatePDF = async () => {
    if (loadingPDF) return;

    try {
      setLoadingPDF(true);

      if (scanSurat.length === 0) {
        alert(
          "Silakan scan surat terlebih dahulu."
        );
        return;
      }

      console.log(
        "Membuat PDF dari",
        scanSurat.length,
        "halaman..."
      );

      const resultPDF =
        await createPDF();

      if (!resultPDF) {
        throw new Error(
          "PDF gagal dibuat."
        );
      }

      // Hapus preview lama
      if (pdfPreview) {
        URL.revokeObjectURL(pdfPreview);
      }

      // Buat URL untuk preview
      const previewURL =
        URL.createObjectURL(
          resultPDF
        );

      setPdfFile(resultPDF);
      setPdfPreview(previewURL);

      console.log(
        "PDF BERHASIL DIBUAT:",
        resultPDF.name
      );

      alert(
        `PDF berhasil dibuat!\n\n${scanSurat.length} halaman digabung menjadi 1 PDF.`
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

  // =========================
  // SIMPAN SURAT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loadingSave) return;

    try {
      // =========================
      // VALIDASI
      // =========================
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

      if (scanSurat.length === 0) {
        alert(
          "Silakan scan surat terlebih dahulu."
        );
        return;
      }

      // =========================
      // TOKEN
      // =========================
      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        alert(
          "Sesi login tidak ditemukan. Silakan login kembali."
        );

        navigate("/login");
        return;
      }

      // =========================
      // KALAU PDF BELUM DIBUAT
      // =========================
      let finalPDF = pdfFile;

      if (!finalPDF) {
        const konfirmasi = window.confirm(
          "PDF belum dibuat.\n\nBuat PDF sekarang?"
        );

        if (!konfirmasi) {
          return;
        }

        setLoadingSave(true);

        finalPDF =
          await createPDF();

        const previewURL =
          URL.createObjectURL(
            finalPDF
          );

        if (pdfPreview) {
          URL.revokeObjectURL(
            pdfPreview
          );
        }

        setPdfPreview(previewURL);
        setPdfFile(finalPDF);

        alert(
          "PDF berhasil dibuat dan sekarang ditampilkan sebagai preview.\n\nSilakan periksa PDF lalu klik Simpan Surat lagi."
        );

        return;
      }

      setLoadingSave(true);

      // =========================
      // FORMDATA
      // =========================
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

      // =========================
      // PENTING:
      // HANYA 1 PDF YANG DIKIRIM
      // =========================
      data.append(
        "arsip_surat",
        finalPDF
      );

      console.log(
        "Mengirim 1 PDF ke backend:",
        finalPDF.name,
        finalPDF.size
      );

      // =========================
      // POST BACKEND
      // =========================
      const response =
        await fetch(
          `${API_URL}/api/surat`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: data,
          }
        );

      console.log(
        "STATUS SIMPAN:",
        response.status
      );

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

      // =========================
      // TOKEN EXPIRED
      // =========================
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

        navigate("/login");
        return;
      }

      // =========================
      // ERROR
      // =========================
      if (!response.ok) {
        throw new Error(
          result.message ||
            "Gagal menyimpan surat."
        );
      }

      // =========================
      // BERHASIL
      // =========================
      alert(
        `Surat berhasil disimpan!\n\n${scanSurat.length} hasil scan telah digabung menjadi 1 PDF.`
      );

      navigate("/surat");
    } catch (error) {
      console.error(
        "Gagal menyimpan surat:",
        error
      );

      alert(
        error.message ||
          "Terjadi kesalahan saat menyimpan surat."
      );
    } finally {
      setLoadingSave(false);
    }
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="tambah-container">
      <div className="tambah-header">
        <h1>Tambah Surat Masuk</h1>

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

      <form
        className="tambah-form"
        onSubmit={handleSubmit}
      >
        {/* =========================
            DATA SURAT
        ========================= */}
        <div className="form-section">
          <h2>Data Surat</h2>

          <div className="form-grid">
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

        {/* =========================
            SCAN SURAT
        ========================= */}
        <div className="form-section">
          <h2>Scan Surat</h2>

          <p className="scan-info">
            Scanner:{" "}
            <strong>
              Epson L3210
            </strong>
          </p>

          <button
            type="button"
            className="btn-scan"
            onClick={
              handleScanDocument
            }
            disabled={loadingScan}
          >
            {loadingScan
              ? "⏳ Sedang Scan..."
              : "📠 Scan Surat"}
          </button>

          {/* =========================
              PREVIEW HASIL SCAN
          ========================= */}
          {scanSurat.length >
            0 && (
            <div className="scan-preview-section">
              <h3>
                Hasil Scan (
                {scanSurat.length} halaman)
              </h3>

              <div className="scan-preview-grid">
                {scanSurat.map(
                  (
                    file,
                    index
                  ) => {
                    const preview =
                      URL.createObjectURL(
                        file
                      );

                    return (
                      <div
                        className="scan-preview-card"
                        key={`${file.name}-${index}`}
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
                          src={preview}
                          alt={`Hasil scan halaman ${
                            index + 1
                          }`}
                          className="scan-preview-image"
                          onLoad={() =>
                            URL.revokeObjectURL(
                              preview
                            )
                          }
                        />
                      </div>
                    );
                  }
                )}
              </div>

              {/* =========================
                  BUAT PDF
              ========================= */}
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

          {/* =========================
              PDF PREVIEW
          ========================= */}
          {pdfPreview && (
            <div className="pdf-preview-section">
              <div className="pdf-preview-header">
                <div>
                  <h3>
                    Preview PDF
                  </h3>

                  <p>
                    {scanSurat.length} halaman
                    sudah digabung menjadi
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
                      ).toFixed(1)} KB`
                    : ""}
                </span>
              </div>

              <p className="pdf-note">
                Periksa PDF di atas terlebih
                dahulu. Jika semua halaman
                sudah benar, klik{" "}
                <strong>
                  "Simpan Surat"
                </strong>
                .
              </p>
            </div>
          )}
        </div>

        {/* =========================
            TOMBOL SIMPAN
        ========================= */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-batal"
            onClick={() =>
              navigate("/surat")
            }
            disabled={loadingSave}
          >
            Batal
          </button>

          <button
            type="submit"
            className="btn-simpan"
            disabled={loadingSave}
          >
            {loadingSave
              ? "⏳ Menyimpan..."
              : "💾 Simpan Surat"}
          </button>
        </div>
      </form>

      {/* =========================
          STYLE TAMBAHAN
      ========================= */}
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