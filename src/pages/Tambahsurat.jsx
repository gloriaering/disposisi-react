import React, { useEffect, useRef, useState } from "react";
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
  // FILE UPLOAD
  // =========================================================
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState("");

  // =========================================================
  // CAMERA
  // =========================================================
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraFile, setCameraFile] = useState(null);
  const [cameraPreview, setCameraPreview] = useState("");
  const [cameraLoading, setCameraLoading] = useState(false);

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

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
  // PREVIEW FILE UPLOAD
  // =========================================================
  useEffect(() => {
    if (!uploadedFile) {
      setUploadedPreview("");
      return;
    }

    const url = URL.createObjectURL(uploadedFile);

    setUploadedPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [uploadedFile]);

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
  // CLEANUP CAMERA SAAT COMPONENT DIHAPUS
  // =========================================================
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
  // VALIDASI JAM 24 JAM
  // FORMAT: HH:mm
  // =========================================================
  const handleTimeChange = (e) => {
    let value = e.target.value;

    // Hanya angka dan titik dua
    value = value.replace(/[^0-9:]/g, "");

    // Maksimal 5 karakter
    value = value.slice(0, 5);

    // Tambahkan ":" otomatis setelah 2 angka
    if (
      value.length === 2 &&
      !value.includes(":")
    ) {
      value = `${value}:`;
    }

    // Batasi jam
    if (value.length >= 2) {
      const jam = Number(
        value.slice(0, 2)
      );

      if (jam > 23) {
        value = `23${value.includes(":") ? ":" : ""}${value.slice(3)}`;
      }
    }

    // Batasi menit
    if (
      value.length === 5 &&
      value.includes(":")
    ) {
      const menit = Number(
        value.slice(3, 5)
      );

      if (menit > 59) {
        value = `${value.slice(0, 3)}59`;
      }
    }

    setFormData((prev) => ({
      ...prev,
      jam_diterima: value,
    }));
  };

  // =========================================================
  // VALIDASI JAM SEBELUM SIMPAN
  // =========================================================
  const isValidTime = (value) => {
    if (!/^\d{2}:\d{2}$/.test(value)) {
      return false;
    }

    const [hours, minutes] =
      value.split(":").map(Number);

    return (
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59
    );
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
            document.createElement(
              "canvas"
            );

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

          canvas.width =
            image.naturalWidth;

          canvas.height =
            image.naturalHeight;

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
            "Gagal membaca gambar."
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
  // RESET PDF
  // =========================================================
  const resetPDF = () => {
    if (pdfPreview) {
      URL.revokeObjectURL(pdfPreview);
    }

    setPdfPreview("");
    setPdfFile(null);
  };

  // =========================================================
  // RESET FILE UPLOAD
  // =========================================================
  const clearUploadedFile = () => {
    setUploadedFile(null);
    setUploadedPreview("");
    resetPDF();
  };

  // =========================================================
  // RESET CAMERA
  // =========================================================
  const clearCameraFile = () => {
    setCameraFile(null);
    setCameraPreview("");
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

      // -----------------------------------------------------
      // KARENA MEMILIH SCAN:
      // HAPUS FILE / FOTO KAMERA SEBELUMNYA
      // -----------------------------------------------------
      clearUploadedFile();
      clearCameraFile();

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
              nama_file:
                `scan_${Date.now()}.jpg`,
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
      resetPDF();

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

      console.error(error);

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
    resetPDF();
  };

  // =========================================================
  // PILIH FILE
  // =========================================================
  const handleFileSelect = (e) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      alert(
        "Format file tidak didukung.\n\nGunakan PDF, JPG, JPEG, PNG, atau WEBP."
      );

      e.target.value = "";
      return;
    }

    if (
      file.size >
      20 * 1024 * 1024
    ) {
      alert(
        "Ukuran file terlalu besar.\n\nMaksimal 20 MB."
      );

      e.target.value = "";
      return;
    }

    // -------------------------------------------------------
    // KARENA MEMILIH FILE:
    // HAPUS HASIL SCAN DAN FOTO KAMERA
    // -------------------------------------------------------
    setScanSurat([]);
    clearCameraFile();
    resetPDF();

    setUploadedFile(file);

    console.log(
      "FILE DIPILIH:",
      file.name
    );

    console.log(
      "TIPE FILE:",
      file.type
    );

    console.log(
      "UKURAN FILE:",
      file.size
    );
  };

  // =========================================================
  // BUKA CAMERA
  // =========================================================
  const startCamera = async () => {
    if (cameraLoading) {
      return;
    }

    try {
      setCameraLoading(true);

      // -----------------------------------------------------
      // KARENA MEMILIH CAMERA:
      // HAPUS SCAN DAN FILE UPLOAD
      // -----------------------------------------------------
      setScanSurat([]);
      clearUploadedFile();
      resetPDF();

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Browser ini tidak mendukung akses kamera."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              facingMode: "environment",
            },

            audio: false,
          }
        );

      cameraStreamRef.current =
        stream;

      setCameraOpen(true);

      // Tunggu video muncul
      setTimeout(() => {
        if (
          videoRef.current
        ) {
          videoRef.current.srcObject =
            stream;

          videoRef.current
            .play()
            .catch(() => {});
        }
      }, 100);
    } catch (error) {
      console.error(
        "GAGAL MEMBUKA KAMERA:",
        error
      );

      alert(
        error.message ||
          "Kamera tidak dapat dibuka."
      );
    } finally {
      setCameraLoading(false);
    }
  };

  // =========================================================
  // STOP CAMERA
  // =========================================================
  const stopCamera = () => {
    if (
      cameraStreamRef.current
    ) {
      cameraStreamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      cameraStreamRef.current =
        null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    setCameraOpen(false);
  };

  // =========================================================
  // AMBIL FOTO DARI CAMERA
  // =========================================================
  const captureCameraPhoto =
    () => {
      const video =
        videoRef.current;

      if (!video) {
        alert(
          "Kamera belum siap."
        );
        return;
      }

      if (
        video.videoWidth <= 0 ||
        video.videoHeight <= 0
      ) {
        alert(
          "Kamera belum siap mengambil foto."
        );
        return;
      }

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        video.videoWidth;

      canvas.height =
        video.videoHeight;

      const context =
        canvas.getContext("2d");

      if (!context) {
        alert(
          "Canvas kamera tidak tersedia."
        );
        return;
      }

      // Background putih
      context.fillStyle =
        "#ffffff";

      context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            alert(
              "Gagal mengambil foto."
            );
            return;
          }

          const fileName =
            `kamera_${Date.now()}.jpg`;

          const file =
            new File(
              [blob],
              fileName,
              {
                type: "image/jpeg",
              }
            );

          setCameraFile(file);

          if (cameraPreview) {
            URL.revokeObjectURL(
              cameraPreview
            );
          }

          const previewURL =
            URL.createObjectURL(
              file
            );

          setCameraPreview(
            previewURL
          );

          stopCamera();

          alert(
            "Foto berhasil diambil."
          );
        },
        "image/jpeg",
        0.9
      );
    };

  // =========================================================
  // HAPUS FOTO KAMERA
  // =========================================================
  const handleRemoveCamera =
    () => {
      if (cameraPreview) {
        URL.revokeObjectURL(
          cameraPreview
        );
      }

      setCameraFile(null);
      setCameraPreview("");
    };

  // =========================================================
  // BUAT PDF
  // =========================================================
  const createPDF = async () => {
    if (
      scanSurat.length === 0
    ) {
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
        orientation:
          "portrait",
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
      pdf.output("blob");

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
  // TENTUKAN FILE YANG AKAN DIKIRIM
  // =========================================================
  const getFileToUpload = () => {
    // -------------------------------------------------------
    // PRIORITAS:
    // PDF HASIL SCAN
    // FILE UPLOAD
    // FOTO CAMERA
    // -------------------------------------------------------

    if (pdfFile) {
      return pdfFile;
    }

    if (uploadedFile) {
      return uploadedFile;
    }

    if (cameraFile) {
      return cameraFile;
    }

    return null;
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
            "Surat Dari wajib diisi."
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

        // ---------------------------------------------------
        // VALIDASI JAM 24 JAM
        // ---------------------------------------------------
        if (
          !isValidTime(
            formData.jam_diterima
          )
        ) {
          alert(
            "Jam diterima harus menggunakan format 24 jam HH:mm.\n\nContoh: 08:30 atau 23:59."
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

        // ---------------------------------------------------
        // VALIDASI ARSIP
        // ---------------------------------------------------
        const hasScan =
          scanSurat.length > 0;

        const hasUploadedFile =
          !!uploadedFile;

        const hasCameraFile =
          !!cameraFile;

        const hasPDF =
          !!pdfFile;

        if (
          !hasScan &&
          !hasUploadedFile &&
          !hasCameraFile
        ) {
          alert(
            "Silakan pilih salah satu arsip surat:\n\n• Scan Epson\n• Upload File\n• Kamera"
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

          navigate("/login");

          return;
        }

        // ---------------------------------------------------
        // SIAPKAN FILE
        // ---------------------------------------------------
        let finalFile =
          getFileToUpload();

        // ---------------------------------------------------
        // JIKA ADA SCAN TAPI PDF BELUM DIBUAT
        // ---------------------------------------------------
        if (
          hasScan &&
          !hasPDF
        ) {
          const konfirmasi =
            window.confirm(
              "PDF belum dibuat.\n\nBuat PDF sekarang?"
            );

          if (!konfirmasi) {
            return;
          }

          setLoadingSave(true);

          finalFile =
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
              finalFile
            );

          setPdfPreview(
            previewURL
          );

          setPdfFile(
            finalFile
          );

          alert(
            "PDF berhasil dibuat dan ditampilkan sebagai preview.\n\nPeriksa PDF terlebih dahulu, kemudian klik 'Simpan Surat' lagi."
          );

          return;
        }

        // ---------------------------------------------------
        // PASTIKAN FILE ADA
        // ---------------------------------------------------
        if (!finalFile) {
          throw new Error(
            "Arsip surat belum dipilih."
          );
        }

        // ---------------------------------------------------
        // MULAI SIMPAN
        // ---------------------------------------------------
        setLoadingSave(true);

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
        // KIRIM SATU ARSIP
        // ---------------------------------------------------
        data.append(
          "arsip_surat",
          finalFile,
          finalFile.name
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
          "ARSIP:",
          finalFile.name
        );

        console.log(
          "TIPE:",
          finalFile.type
        );

        console.log(
          "UKURAN:",
          finalFile.size
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

          navigate("/login");

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
        // PESAN BERHASIL
        // ---------------------------------------------------
        let successMessage =
          "Surat berhasil disimpan!";

        if (hasScan) {
          successMessage +=
            `\n\n${scanSurat.length} halaman hasil scan telah digabung menjadi 1 PDF.`;
        } else if (
          hasUploadedFile
        ) {
          successMessage +=
            `\n\nFile "${uploadedFile.name}" berhasil disimpan.`;
        } else if (
          hasCameraFile
        ) {
          successMessage +=
            "\n\nFoto dari kamera berhasil disimpan.";
        }

        alert(
          successMessage
        );

        navigate("/surat");
      } catch (error) {
        console.error(
          "================================="
        );

        console.error(
          "GAGAL MENYIMPAN SURAT"
        );

        console.error(error);

        console.error(
          "================================="
        );

        alert(
          error.message ||
            "Terjadi kesalahan saat menyimpan surat."
        );
      } finally {
        setLoadingSave(false);
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

            {/* SURAT DARI */}
            <div className="form-group">

              <label>
                Surat Dari
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

            {/* JAM DITERIMA */}
            <div className="form-group">

              <label>
                Jam Diterima
              </label>

              <input
                type="text"
                name="jam_diterima"
                value={
                  formData.jam_diterima
                }
                onChange={
                  handleTimeChange
                }
                placeholder="00:00"
                maxLength={5}
                inputMode="numeric"
                autoComplete="off"
              />

              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                  color: "#777",
                }}
              >
                Format 24 jam, contoh:
                08:30 atau 23:59
              </small>

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
            ARSIP SURAT
        =================================================== */}
        <div className="form-section">

          <h2>
            Arsip Surat
          </h2>

          <p
            style={{
              marginTop: 0,
              color: "#666",
              lineHeight: 1.6,
            }}
          >
            Pilih salah satu cara untuk
            memasukkan arsip surat:
            <strong>
              {" "}
              Upload File, Kamera,
              atau Scan Epson.
            </strong>
          </p>

          {/* =================================================
              PILIHAN FILE / CAMERA / SCAN
          ================================================= */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >

            {/* UPLOAD FILE */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                minHeight: "90px",
                padding: "15px",
                border:
                  "1px solid #ddd",
                borderRadius: "10px",
                background:
                  "#fafafa",
                cursor: "pointer",
                fontWeight: 700,
                textAlign: "center",
              }}
            >

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                onChange={
                  handleFileSelect
                }
                disabled={
                  loadingSave ||
                  loadingScan ||
                  cameraLoading
                }
                style={{
                  display: "none",
                }}
              />

              📄 Upload File

            </label>

            {/* CAMERA */}
            <button
              type="button"
              onClick={
                startCamera
              }
              disabled={
                loadingSave ||
                loadingScan ||
                cameraLoading
              }
              style={{
                minHeight: "90px",
                padding: "15px",
                border:
                  "1px solid #ddd",
                borderRadius: "10px",
                background:
                  "#fafafa",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              {cameraLoading
                ? "⏳ Membuka Kamera..."
                : "📷 Gunakan Kamera"}
            </button>

            {/* SCAN */}
            <button
              type="button"
              className="btn-scan"
              onClick={
                handleScanDocument
              }
              disabled={
                loadingScan ||
                loadingSave ||
                cameraLoading
              }
              style={{
                minHeight: "90px",
                marginBottom: 0,
              }}
            >
              {loadingScan
                ? "⏳ Sedang Scan..."
                : "📠 Scan Epson"}
            </button>

          </div>

          {/* =================================================
              FILE UPLOAD PREVIEW
          ================================================= */}
          {uploadedFile && (

            <div
              style={{
                marginTop: "20px",
                padding: "18px",
                border:
                  "1px solid #ddd",
                borderRadius: "12px",
                background: "#fafafa",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "10px",
                  marginBottom:
                    "15px",
                }}
              >

                <div>

                  <h3
                    style={{
                      margin:
                        "0 0 5px",
                    }}
                  >
                    📄 File Dipilih
                  </h3>

                  <div
                    style={{
                      color: "#666",
                      fontSize:
                        "14px",
                    }}
                  >
                    {uploadedFile.name}
                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    clearUploadedFile
                  }
                  disabled={
                    loadingSave
                  }
                  style={{
                    border: "none",
                    background:
                      "transparent",
                    color: "#d00",
                    fontSize:
                      "20px",
                    fontWeight:
                      "bold",
                    cursor:
                      "pointer",
                  }}
                >
                  ✕
                </button>

              </div>

              {uploadedFile.type ===
                "application/pdf" ? (

                <div
                  style={{
                    width: "100%",
                    height: "600px",
                    border:
                      "1px solid #ccc",
                    borderRadius:
                      "8px",
                    overflow:
                      "hidden",
                    background:
                      "#525659",
                  }}
                >

                  <iframe
                    src={
                      uploadedPreview
                    }
                    title="Preview file PDF"
                    style={{
                      width:
                        "100%",
                      height:
                        "100%",
                      border:
                        "none",
                    }}
                  />

                </div>

              ) : (

                <div
                  style={{
                    textAlign:
                      "center",
                  }}
                >

                  <img
                    src={
                      uploadedPreview
                    }
                    alt="Preview file"
                    style={{
                      maxWidth:
                        "100%",
                      maxHeight:
                        "600px",
                      objectFit:
                        "contain",
                      borderRadius:
                        "8px",
                      border:
                        "1px solid #ddd",
                    }}
                  />

                </div>

              )}

            </div>

          )}

          {/* =================================================
              HASIL CAMERA
          ================================================= */}
          {cameraFile && (

            <div
              style={{
                marginTop: "20px",
                padding: "18px",
                border:
                  "1px solid #ddd",
                borderRadius: "12px",
                background: "#fafafa",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "10px",
                  marginBottom:
                    "15px",
                }}
              >

                <div>

                  <h3
                    style={{
                      margin:
                        "0 0 5px",
                    }}
                  >
                    📷 Foto Kamera
                  </h3>

                  <div
                    style={{
                      color: "#666",
                      fontSize:
                        "14px",
                    }}
                  >
                    {cameraFile.name}
                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    handleRemoveCamera
                  }
                  disabled={
                    loadingSave
                  }
                  style={{
                    border: "none",
                    background:
                      "transparent",
                    color: "#d00",
                    fontSize:
                      "20px",
                    fontWeight:
                      "bold",
                    cursor:
                      "pointer",
                  }}
                >
                  ✕
                </button>

              </div>

              <div
                style={{
                  textAlign:
                    "center",
                }}
              >

                <img
                  src={
                    cameraPreview
                  }
                  alt="Foto dari kamera"
                  style={{
                    maxWidth:
                      "100%",
                    maxHeight:
                      "600px",
                    objectFit:
                      "contain",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid #ddd",
                  }}
                />

              </div>

            </div>

          )}

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
                    loadingPDF ||
                    loadingSave
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
          CAMERA MODAL
      ===================================================== */}
      {cameraOpen && (

        <div
          style={{
            position:
              "fixed",
            inset: 0,
            zIndex: 9999,
            background:
              "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding: "20px",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth:
                "800px",
              background:
                "#fff",
              borderRadius:
                "14px",
              padding: "20px",
              boxSizing:
                "border-box",
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "15px",
              }}
            >

              <h2
                style={{
                  margin: 0,
                }}
              >
                📷 Ambil Foto Surat
              </h2>

              <button
                type="button"
                onClick={
                  stopCamera
                }
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  fontSize:
                    "24px",
                  cursor:
                    "pointer",
                }}
              >
                ✕
              </button>

            </div>

            <div
              style={{
                width: "100%",
                background:
                  "#000",
                borderRadius:
                  "10px",
                overflow:
                  "hidden",
              }}
            >

              <video
                ref={
                  videoRef
                }
                autoPlay
                playsInline
                muted
                style={{
                  display:
                    "block",
                  width:
                    "100%",
                  maxHeight:
                    "70vh",
                  objectFit:
                    "contain",
                }}
              />

            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "center",
                gap: "10px",
                marginTop:
                  "15px",
                flexWrap:
                  "wrap",
              }}
            >

              <button
                type="button"
                onClick={
                  captureCameraPhoto
                }
                style={{
                  padding:
                    "12px 22px",
                  border:
                    "none",
                  borderRadius:
                    "8px",
                  cursor:
                    "pointer",
                  fontWeight:
                    700,
                }}
              >
                📸 Ambil Foto
              </button>

              <button
                type="button"
                onClick={
                  stopCamera
                }
                style={{
                  padding:
                    "12px 22px",
                  border:
                    "1px solid #ccc",
                  borderRadius:
                    "8px",
                  cursor:
                    "pointer",
                  fontWeight:
                    600,
                  background:
                    "#fff",
                }}
              >
                Batal
              </button>

            </div>

          </div>

        </div>

      )}

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