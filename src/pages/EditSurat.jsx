import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import logoSulut from "../assets/images/logo-sulut.png";
import "../assets/css/EditSurat.css";

const API_URL = "https://disposisi-react-8vdu.vercel.app";
const SCANNER_URL = "http://127.0.0.1:5050";

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
  // ARSIP LAMA DAN ARSIP BARU
  // =========================================================
  const [arsipLama, setArsipLama] = useState([]);
  const [arsipBaru, setArsipBaru] = useState([]);

  // =========================================================
  // SCAN EPSON
  // =========================================================
  const [scanSurat, setScanSurat] = useState([]);
  const [scanPreviews, setScanPreviews] = useState([]);
  const [loadingScan, setLoadingScan] = useState(false);

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
  // PDF HASIL SCAN
  // =========================================================
  const [pdfPreview, setPdfPreview] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [loadingPDF, setLoadingPDF] = useState(false);

  // =========================================================
  // PREVIEW PDF ARSIP LAMA
  // =========================================================
  const [pdfPreviewUrls, setPdfPreviewUrls] = useState({});

  // =========================================================
  // STATUS
  // =========================================================
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // KONVERSI JAM KE FORMAT 24 JAM
  // Contoh: 02:26 PM -> 14:26
  // =========================================================
  const convertTo24Hour = (time) => {
    if (!time) {
      return "";
    }

    const value = String(time).trim();

    // Sudah format 24 jam
    if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      return value;
    }

    // Format 12 jam
    const match = value.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (!match) {
      return value;
    }

    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const period = match[3].toUpperCase();

    if (period === "AM") {
      if (hour === 12) {
        hour = 0;
      }
    } else if (period === "PM") {
      if (hour !== 12) {
        hour += 12;
      }
    }

    return `${String(hour).padStart(2, "0")}:${minute}`;
  };

  // =========================================================
  // VALIDASI JAM 24 JAM
  // =========================================================
  const isValidTime = (value) => {
    if (!/^\d{2}:\d{2}$/.test(value)) {
      return false;
    }

    const [hours, minutes] = value.split(":").map(Number);

    return (
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59
    );
  };

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
  // FORMAT JAM 24 JAM
  // =========================================================
  const handleTimeChange = (e) => {
    let value = e.target.value.replace(/[^0-9:]/g, "");
    value = value.slice(0, 5);

    if (value.length === 2 && !value.includes(":")) {
      value = `${value}:`;
    }

    if (value.length >= 2) {
      const jam = Number(value.slice(0, 2));

      if (jam > 23) {
        value = `23${value.includes(":") ? ":" : ""}${value.slice(3)}`;
      }
    }

    if (value.length === 5 && value.includes(":")) {
      const menit = Number(value.slice(3, 5));

      if (menit > 59) {
        value = `${value.slice(0, 3)}59`;
      }
    }

    setForm((prev) => ({
      ...prev,
      jam_diterima: value,
    }));
  };

  // =========================================================
  // FORMAT TANGGAL SURAT
  // =========================================================
  const handleTanggalSuratChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    if (value.length > 2) {
      value = value.slice(0, 2) + "-" + value.slice(2);
    }

    if (value.length > 5) {
      value = value.slice(0, 5) + "-" + value.slice(5);
    }

    setForm((prev) => ({
      ...prev,
      tanggal_surat: value,
    }));
  };

  // =========================================================
  // CLEANUP CAMERA
  // =========================================================
  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  // =========================================================
  // AMBIL DATA SURAT
  // =========================================================
  useEffect(() => {
    const getSurat = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/api/surat/${id}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Gagal mengambil data surat."
          );
        }

        const surat = result.data || result;

        setForm({
          nomor_surat: surat.nomor_surat || "",
          asal_surat: surat.asal_surat || "",
          tanggal_surat: surat.tanggal_surat || "",
          nomor_agenda: surat.nomor_agenda || "",
          tanggal_diterima: surat.tanggal_diterima || "",
          jam_diterima: convertTo24Hour(surat.jam_diterima),
          perihal: surat.perihal || "",
          sifat_surat: surat.sifat_surat || "",
          diteruskan_kepada: Array.isArray(surat.diteruskan_kepada)
            ? surat.diteruskan_kepada
            : [],
          dengan_hormat_harap: Array.isArray(surat.dengan_hormat_harap)
            ? surat.dengan_hormat_harap
            : [],
          catatan: surat.catatan || "",
        });

        if (Array.isArray(surat.arsip_surat)) {
          setArsipLama(surat.arsip_surat);
        } else if (surat.arsip_surat) {
          setArsipLama([surat.arsip_surat]);
        } else {
          setArsipLama([]);
        }
      } catch (err) {
        console.error("Gagal mengambil surat:", err);

        setError(err.message || "Gagal mengambil data surat.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      getSurat();
    }
  }, [id]);

  // =========================================================
  // LOAD PDF ARSIP LAMA UNTUK PREVIEW
  // =========================================================
  useEffect(() => {
    if (!arsipLama.length) {
      setPdfPreviewUrls({});
      return;
    }

    let cancelled = false;
    const objectUrls = [];

    const loadPDF = async () => {
      const token = localStorage.getItem("token");
      const hasil = {};

      for (let index = 0; index < arsipLama.length; index++) {
        const arsip = arsipLama[index];

        const fileIsPDF =
          arsip?.tipe_file === "application/pdf" ||
          arsip?.nama_file?.toLowerCase().endsWith(".pdf");

        if (!fileIsPDF) {
          continue;
        }

        try {
          const response = await fetch(
            `${API_URL}/api/surat/preview/${id}/${index}`,
            {
              headers: token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {},
            }
          );

          if (!response.ok) {
            throw new Error(`Gagal mengambil PDF (${response.status})`);
          }

          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          objectUrls.push(blobUrl);
          hasil[index] = blobUrl;
        } catch (err) {
          console.error(`Gagal preview PDF ${index + 1}:`, err);
        }
      }

      if (!cancelled) {
        setPdfPreviewUrls(hasil);
      }
    };

    loadPDF();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [arsipLama, id]);

  // =========================================================
  // PREVIEW HASIL SCAN
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
      setError(`${file.name} terlalu besar. Maksimal 20 MB.`);
      return false;
    }

    return true;
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
    setArsipBaru([]);
    resetPDF();
  };

  // =========================================================
  // RESET CAMERA FILE
  // =========================================================
  const clearCameraFile = () => {
    if (cameraPreview) {
      URL.revokeObjectURL(cameraPreview);
    }

    setCameraFile(null);
    setCameraPreview("");
  };

  // =========================================================
  // TAMBAH FILE BARU
  // =========================================================
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    setError("");

    const fileValid = [];

    files.forEach((file) => {
      if (validateFile(file)) {
        fileValid.push(file);
      }
    });

    // Karena memilih file, hasil scan dan foto kamera tidak dipakai.
    setScanSurat([]);
    clearCameraFile();
    resetPDF();

    setArsipBaru((prev) => {
      const gabungan = [...prev, ...fileValid];

      if (gabungan.length > 20) {
        setError("Maksimal 20 file baru.");
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
    setArsipBaru((prev) => prev.filter((_, i) => i !== index));
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
      file?.type === "application/pdf" ||
      file?.nama_file?.toLowerCase().endsWith(".pdf")
    );
  };

  // =========================================================
  // SCAN DOKUMEN EPSON
  // MEKANISME INI SAMA DENGAN TAMBAH SURAT
  // =========================================================
  const handleScanDocument = async () => {
    if (loadingScan) {
      return;
    }

    try {
      setLoadingScan(true);

      // Karena memilih scan:
      // hapus file / foto kamera sebelumnya.
      // HASIL SCAN SEBELUMNYA TIDAK DIHAPUS,
      // sehingga bisa scan banyak halaman.
      clearUploadedFile();
      clearCameraFile();

      console.log("=================================");
      console.log("MEMULAI SCAN DOKUMEN");
      console.log("=================================");

      // -----------------------------------------------------
      // CEK SCANNER BRIDGE
      // -----------------------------------------------------
      const bridgeCheck = await fetch(`${SCANNER_URL}/`);

      if (!bridgeCheck.ok) {
        throw new Error("Scanner Bridge tidak dapat diakses.");
      }

      const bridgeData = await bridgeCheck.json();

      console.log("SCANNER BRIDGE:", bridgeData);

      // -----------------------------------------------------
      // JALANKAN SCAN
      // -----------------------------------------------------
      const response = await fetch(`${SCANNER_URL}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_file: `scan_${Date.now()}.jpg`,
        }),
      });

      console.log("STATUS SCANNER:", response.status);

      if (!response.ok) {
        let errorMessage = "Scanner gagal melakukan scan.";

        try {
          const errorData = await response.json();

          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Response bukan JSON.
        }

        throw new Error(errorMessage);
      }

      // -----------------------------------------------------
      // AMBIL HASIL SCAN
      // -----------------------------------------------------
      const blob = await response.blob();

      console.log("UKURAN HASIL SCAN:", blob.size);
      console.log("TIPE HASIL SCAN:", blob.type);

      if (!blob || blob.size === 0) {
        throw new Error("Hasil scan kosong.");
      }

      // -----------------------------------------------------
      // BUAT FILE JPG
      // -----------------------------------------------------
      const fileName = `scan_${Date.now()}.jpg`;

      const file = new File([blob], fileName, {
        type: "image/jpeg",
      });

      // -----------------------------------------------------
      // TAMBAHKAN KE DAFTAR SCAN
      // -----------------------------------------------------
      setScanSurat((prev) => {
        const halamanBerikutnya = prev.length + 1;

        console.log(
          `SCAN BERHASIL: halaman ${halamanBerikutnya}`
        );

        alert(
          `Scan berhasil!\n\nHalaman ke-${halamanBerikutnya} berhasil ditambahkan.`
        );

        return [...prev, file];
      });

      // PDF lama tidak berlaku lagi.
      resetPDF();

      console.log("Scan berhasil ditambahkan.");
    } catch (error) {
      console.error("=================================");
      console.error("GAGAL SCAN:");
      console.error(error);
      console.error("=================================");

      alert(error.message || "Gagal melakukan scan.");
    } finally {
      setLoadingScan(false);
    }
  };

  // =========================================================
  // HAPUS SATU HASIL SCAN
  // =========================================================
  const handleRemoveScan = (index) => {
    setScanSurat((prev) => prev.filter((_, i) => i !== index));
    resetPDF();
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

      // Karena memilih camera:
      // hapus scan dan file upload.
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

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (error) {
      console.error("GAGAL MEMBUKA KAMERA:", error);

      alert(error.message || "Kamera tidak dapat dibuka.");
    } finally {
      setCameraLoading(false);
    }
  };

  // =========================================================
  // AMBIL FOTO CAMERA
  // =========================================================
  const captureCameraPhoto = () => {
    const video = videoRef.current;

    if (!video) {
      alert("Kamera belum siap.");
      return;
    }

    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      alert("Kamera belum siap mengambil foto.");
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      alert("Canvas kamera tidak tersedia.");
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

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
          alert("Gagal mengambil foto.");
          return;
        }

        const fileName = `kamera_${Date.now()}.jpg`;

        const file = new File([blob], fileName, {
          type: "image/jpeg",
        });

        setCameraFile(file);

        if (cameraPreview) {
          URL.revokeObjectURL(cameraPreview);
        }

        const previewURL = URL.createObjectURL(file);
        setCameraPreview(previewURL);

        stopCamera();

        alert("Foto berhasil diambil.");
      },
      "image/jpeg",
      0.9
    );
  };

  // =========================================================
  // HAPUS FOTO CAMERA
  // =========================================================
  const handleRemoveCamera = () => {
    if (cameraPreview) {
      URL.revokeObjectURL(cameraPreview);
    }

    setCameraFile(null);
    setCameraPreview("");
  };

  // =========================================================
  // FILE -> DATA URL
  // =========================================================
  const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () =>
        reject(new Error("Gagal membaca file."));

      reader.readAsDataURL(file);
    });
  };

  // =========================================================
  // IMAGE -> JPEG
  // =========================================================
  const imageFileToJpeg = (file) => {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Canvas browser tidak tersedia."));
            return;
          }

          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;

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
        reject(new Error("Gagal membaca gambar."));
      };

      fileToDataURL(file)
        .then((dataURL) => {
          image.src = dataURL;
        })
        .catch(reject);
    });
  };

  // =========================================================
  // BUAT PDF DARI SEMUA HASIL SCAN
  // =========================================================
  const createPDF = async () => {
    if (scanSurat.length === 0) {
      throw new Error("Belum ada hasil scan.");
    }

    // Jika 1 file sudah PDF.
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

    // Hasil scan beberapa halaman harus berupa gambar.
    const hasPDF = scanSurat.some(
      (file) => file.type === "application/pdf"
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
      compress: true,
    });

    for (let i = 0; i < scanSurat.length; i++) {
      const file = scanSurat[i];

      console.log(
        `Memasukkan halaman ${i + 1} ke PDF...`
      );

      const jpegBlob = await imageFileToJpeg(file);

      const jpegFile = new File(
        [jpegBlob],
        `page_${i + 1}.jpg`,
        {
          type: "image/jpeg",
        }
      );

      const dataURL = await fileToDataURL(jpegFile);

      const image = new Image();

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () =>
          reject(
            new Error(`Gagal membaca halaman ${i + 1}.`)
          );
        image.src = dataURL;
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 5;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      const imageWidth = image.naturalWidth;
      const imageHeight = image.naturalHeight;

      if (imageWidth <= 0 || imageHeight <= 0) {
        throw new Error(
          `Ukuran halaman ${i + 1} tidak valid.`
        );
      }

      const ratio = imageWidth / imageHeight;

      let finalWidth = maxWidth;
      let finalHeight = finalWidth / ratio;

      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = finalHeight * ratio;
      }

      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;

      if (i > 0) {
        pdf.addPage("a4", "portrait");
      }

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

    const pdfBlob = pdf.output("blob");

    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error(
        "PDF berhasil diproses tetapi file PDF kosong."
      );
    }

    const finalPDF = new File(
      [pdfBlob],
      `surat_${Date.now()}.pdf`,
      {
        type: "application/pdf",
      }
    );

    console.log("PDF BERHASIL DIBUAT:", finalPDF.name);
    console.log("UKURAN PDF:", finalPDF.size);

    return finalPDF;
  };

  // =========================================================
  // BUAT PDF + PREVIEW
  // =========================================================
  const handleCreatePDF = async () => {
    if (loadingPDF) {
      return;
    }

    try {
      setLoadingPDF(true);

      if (scanSurat.length === 0) {
        alert("Silakan scan surat terlebih dahulu.");
        return;
      }

      console.log("=================================");
      console.log("MEMBUAT PDF");
      console.log("Jumlah halaman:", scanSurat.length);
      console.log("=================================");

      const resultPDF = await createPDF();

      if (!resultPDF) {
        throw new Error("PDF gagal dibuat.");
      }

      if (pdfPreview) {
        URL.revokeObjectURL(pdfPreview);
      }

      const previewURL = URL.createObjectURL(resultPDF);

      setPdfFile(resultPDF);
      setPdfPreview(previewURL);

      console.log("PDF PREVIEW SIAP");

      alert(
        `PDF berhasil dibuat!\n\n${scanSurat.length} halaman telah digabung menjadi 1 PDF.`
      );
    } catch (error) {
      console.error("Gagal membuat PDF:", error);

      alert(error.message || "Gagal membuat PDF.");
    } finally {
      setLoadingPDF(false);
    }
  };

  // =========================================================
  // TENTUKAN FILE YANG AKAN DIKIRIM
  // =========================================================
  const getFilesToUpload = () => {
    // Jika ada PDF hasil scan, kirim PDF tersebut.
    if (pdfFile) {
      return [pdfFile];
    }

    // Jika menggunakan kamera, kirim foto kamera.
    if (cameraFile) {
      return [cameraFile];
    }

    // Jika menggunakan pilih file, kirim semua file yang dipilih.
    return arsipBaru;
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
      !form.tanggal_diterima ||
      !form.jam_diterima ||
      !form.perihal.trim()
    ) {
      setError("Semua field bertanda * wajib diisi.");
      return;
    }

    if (!isValidTime(form.jam_diterima)) {
      setError(
        "Jam diterima harus menggunakan format 24 jam HH:mm, contoh 08:30 atau 23:59."
      );
      return;
    }

    const hasScan = scanSurat.length > 0;
    const hasCameraFile = !!cameraFile;
    const hasNewArchive = hasScan || arsipBaru.length > 0 || hasCameraFile;

    try {
      setSaving(true);

      // Jika ada scan tetapi PDF belum dibuat, buat PDF dulu.
      if (hasScan && !pdfFile) {
        const konfirmasi = window.confirm(
          "PDF hasil scan belum dibuat.\n\nBuat PDF sekarang?"
        );

        if (!konfirmasi) {
          setSaving(false);
          return;
        }

        const finalScanPDF = await createPDF();

        if (pdfPreview) {
          URL.revokeObjectURL(pdfPreview);
        }

        const previewURL = URL.createObjectURL(finalScanPDF);

        setPdfPreview(previewURL);
        setPdfFile(finalScanPDF);

        alert(
          "PDF berhasil dibuat dan ditampilkan sebagai preview.\n\nPeriksa PDF terlebih dahulu, kemudian klik 'Simpan Perubahan' lagi."
        );

        setSaving(false);
        return;
      }

      const filesToUpload = getFilesToUpload();

      const data = new FormData();

      data.append("nomor_surat", form.nomor_surat.trim());
      data.append("asal_surat", form.asal_surat.trim());
      data.append("tanggal_surat", form.tanggal_surat.trim());
      data.append("nomor_agenda", form.nomor_agenda.trim());
      data.append("tanggal_diterima", form.tanggal_diterima);
      data.append("jam_diterima", form.jam_diterima);
      data.append("perihal", form.perihal.trim());
      data.append("sifat_surat", form.sifat_surat || "");
      data.append(
        "diteruskan_kepada",
        JSON.stringify(form.diteruskan_kepada || [])
      );
      data.append(
        "dengan_hormat_harap",
        JSON.stringify(form.dengan_hormat_harap || [])
      );
      data.append("catatan", form.catatan || "");

      // File baru: pilih file / kamera / scan Epson.
      filesToUpload.forEach((file) => {
        data.append("arsip_surat", file);
      });

      const token = localStorage.getItem("token");

      if (!token) {
        alert(
          "Sesi login tidak ditemukan. Silakan login kembali."
        );
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/surat/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: data,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal memperbarui surat."
        );
      }

      alert("✓ Surat berhasil diperbarui.");
      navigate("/surat");
    } catch (err) {
      console.error("Gagal memperbarui surat:", err);

      setError(
        err.message || "Gagal memperbarui surat."
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
            <h2>DISNAKERTRANS</h2>
            <span>Sulawesi Utara</span>
          </div>
        </div>

        <nav className="tambah-menu">
          <p className="tambah-menu-title">MENU UTAMA</p>

          <Link to="/" className="tambah-menu-item">
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

          <Link to="/riwayat" className="tambah-menu-item">
            <span>↶</span>
            Riwayat Surat
          </Link>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="tambah-main">
        <header className="tambah-topbar">
          <div className="tambah-topbar-left">
            <h1>Edit Surat</h1>
            <p>Sistem Informasi Disposisi Surat</p>
          </div>
        </header>

        <section className="tambah-content">
          <div className="tambah-page-header">
            <div className="tambah-page-title">
              <span>DATA ADMINISTRASI</span>
              <h2>Edit Surat Masuk</h2>
              <p>
                Perbarui informasi surat yang telah tersimpan.
              </p>
            </div>

            <Link to="/surat" className="tambah-btn-back">
              ← Kembali
            </Link>
          </div>

          {error && <div className="tambah-error">{error}</div>}

          <form
            className="tambah-form-card"
            onSubmit={handleSubmit}
          >
            <div className="tambah-form-top">
              <div>
                <h3>Informasi Surat</h3>
                <p>
                  Periksa dan perbarui informasi surat.
                </p>
              </div>
            </div>

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
                />
              </div>

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

              <div className="tambah-form-group">
                <label>
                  Jam Diterima <b>*</b>
                </label>
                <input
                  type="text"
                  name="jam_diterima"
                  value={form.jam_diterima}
                  onChange={handleTimeChange}
                  placeholder="00:00"
                  maxLength={5}
                  inputMode="numeric"
                />
                <small>
                  Format waktu 24 jam (00:00 - 23:59)
                </small>
              </div>
            </div>

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
                PILIH ARSIP BARU
            ================================================= */}
            <div className="tambah-form-group tambah-full">
              <label>Tambah Arsip Surat</label>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "8px",
                }}
              >
                {/* PILIH FILE */}
                <label
                  htmlFor="edit-file-upload"
                  className="btn-upload-file"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "11px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: "1px solid #d1d5db",
                    background: "#fff",
                  }}
                >
                  📁 Pilih File
                </label>

                <input
                  id="edit-file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                {/* CAMERA */}
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={cameraLoading}
                  className="btn-camera"
                  style={{
                    padding: "11px 16px",
                    borderRadius: "8px",
                    cursor: cameraLoading
                      ? "not-allowed"
                      : "pointer",
                    border: "1px solid #d1d5db",
                    background: "#fff",
                  }}
                >
                  {cameraLoading
                    ? "⏳ Membuka Kamera..."
                    : "📷 Kamera"}
                </button>

                {/* SCAN EPSON */}
                <button
                  type="button"
                  onClick={handleScanDocument}
                  disabled={loadingScan}
                  className="btn-scan"
                >
                  {loadingScan
                    ? "⏳ Scanning..."
                    : "🖨️ Scan Epson"}
                </button>
              </div>

              <small>
                Pilih salah satu: file dari komputer, foto kamera,
                atau scan Epson. File maksimal 20 MB.
              </small>
            </div>

            {/* =================================================
                FILE BARU DIPILIH
            ================================================= */}
            {arsipBaru.length > 0 && (
              <div className="tambah-form-group tambah-full">
                <h3>File Baru yang Akan Ditambahkan</h3>

                {arsipBaru.map((file, index) => {
                  const previewURL = URL.createObjectURL(file);

                  return (
                    <div
                      key={`${file.name}-${index}`}
                      style={{
                        marginTop: "12px",
                        padding: "15px",
                        border: "1px solid #ddd",
                        borderRadius: "10px",
                      }}
                    >
                      <strong>
                        {isPDF(file) ? "📄 PDF" : "🖼️ Gambar"}{" "}
                        {file.name}
                      </strong>

                      {isImage(file) && (
                        <div style={{ marginTop: "15px" }}>
                          <img
                            src={previewURL}
                            alt={file.name}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "400px",
                              borderRadius: "8px",
                            }}
                            onLoad={() => URL.revokeObjectURL(previewURL)}
                          />
                        </div>
                      )}

                      {isPDF(file) && (
                        <div
                          style={{
                            marginTop: "15px",
                            padding: "15px",
                            background: "#f8fafc",
                            borderRadius: "8px",
                            color: "#64748b",
                          }}
                        >
                          📄 File PDF siap ditambahkan.
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveFileBaru(index)}
                        style={{
                          marginTop: "10px",
                          padding: "8px 12px",
                          cursor: "pointer",
                        }}
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* =================================================
                PREVIEW CAMERA
            ================================================= */}
            {cameraFile && cameraPreview && (
              <div className="tambah-form-group tambah-full">
                <h3>Foto Kamera yang Akan Ditambahkan</h3>

                <div
                  style={{
                    marginTop: "12px",
                    padding: "15px",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                  }}
                >
                  <strong>📷 {cameraFile.name}</strong>

                  <div style={{ marginTop: "15px" }}>
                    <img
                      src={cameraPreview}
                      alt="Hasil kamera"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "500px",
                        borderRadius: "8px",
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveCamera}
                    style={{
                      marginTop: "10px",
                      padding: "8px 12px",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Hapus Foto
                  </button>
                </div>
              </div>
            )}

            {/* =================================================
                PREVIEW HASIL SCAN
            ================================================= */}
            {scanSurat.length > 0 && (
              <div className="tambah-form-group tambah-full">
                <h3>Hasil Scan Epson</h3>

                <p style={{ marginTop: "6px", color: "#64748b" }}>
                  {scanSurat.length} halaman sudah dipindai.
                  Kamu bisa scan lagi untuk menambah halaman berikutnya.
                </p>

                <div
                  className="scan-preview-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "15px",
                    marginTop: "15px",
                  }}
                >
                  {scanPreviews.map((item, index) => (
                    <div
                      key={`${item.file.name}-${index}`}
                      className="scan-preview-card"
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "10px",
                        padding: "10px",
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "600",
                          marginBottom: "8px",
                        }}
                      >
                        Halaman {index + 1}
                      </div>

                      <img
                        src={item.url}
                        alt={`Scan halaman ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "220px",
                          objectFit: "contain",
                          background: "#f8fafc",
                          borderRadius: "6px",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveScan(index)}
                        style={{
                          width: "100%",
                          marginTop: "10px",
                          padding: "8px 10px",
                          cursor: "pointer",
                        }}
                      >
                        🗑️ Hapus Halaman
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "18px" }}>
                  <button
                    type="button"
                    onClick={handleCreatePDF}
                    disabled={loadingPDF}
                    className="btn-create-pdf"
                    style={{
                      padding: "11px 16px",
                      borderRadius: "8px",
                      cursor: loadingPDF
                        ? "not-allowed"
                        : "pointer",
                    }}
                  >
                    {loadingPDF
                      ? "⏳ Membuat PDF..."
                      : "📄 Buat PDF dari Hasil Scan"}
                  </button>
                </div>

                {pdfPreview && pdfFile && (
                  <div style={{ marginTop: "20px" }}>
                    <h3>Preview PDF Hasil Scan</h3>

                    <iframe
                      src={pdfPreview}
                      title="Preview PDF hasil scan"
                      style={{
                        width: "100%",
                        height: "650px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        marginTop: "12px",
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                ARSIP LAMA
            ================================================= */}
            <div className="tambah-form-group tambah-full">
              <h3>Arsip Surat yang Sudah Tersimpan</h3>

              {arsipLama.length === 0 && (
                <div
                  style={{
                    padding: "20px",
                    border: "1px dashed #ccc",
                    borderRadius: "10px",
                    textAlign: "center",
                  }}
                >
                  Belum ada arsip surat.
                </div>
              )}

              {arsipLama.map((arsip, index) => (
                <div
                  key={arsip.public_id || index}
                  style={{
                    marginTop: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "15px",
                      background: "#f5f5f5",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      flexWrap: "wrap",
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
                      {arsip.nama_file || "Arsip Surat"}
                    </span>
                  </div>

                  {isImage(arsip) && (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                      }}
                    >
                      <img
                        src={arsip.url_file}
                        alt={
                          arsip.nama_file || "Arsip Surat"
                        }
                        style={{
                          maxWidth: "100%",
                          maxHeight: "650px",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  )}

                  {isPDF(arsip) && (
                    <div
                      style={{
                        width: "100%",
                        height: "650px",
                        background: "#ffffff",
                      }}
                    >
                      {pdfPreviewUrls[index] ? (
                        <iframe
                          src={pdfPreviewUrls[index]}
                          title={
                            arsip.nama_file ||
                            `PDF ${index + 1}`
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            display: "block",
                            background: "#ffffff",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            gap: "10px",
                            color: "#64748b",
                          }}
                        >
                          <div style={{ fontSize: "32px" }}>📄</div>
                          <strong>Memuat PDF...</strong>
                          <span>Tunggu sebentar</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      padding: "15px",
                      borderTop: "1px solid #ddd",
                    }}
                  >
                    <a
                      href={arsip.url_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        padding: "10px 15px",
                        background: "#173f5f",
                        color: "#fff",
                        borderRadius: "8px",
                        textDecoration: "none",
                      }}
                    >
                      📂 Buka File
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* =================================================
                BUTTON
            ================================================= */
            <div className="tambah-form-actions">
              <Link to="/surat" className="tambah-btn-cancel">
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

      {/* =====================================================
          CAMERA MODAL
      ===================================================== */}
      {cameraOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "min(700px, 100%)",
              background: "#fff",
              borderRadius: "14px",
              padding: "20px",
              boxSizing: "border-box",
            }}
          >
            <h3 style={{ marginTop: 0 }}>📷 Ambil Foto Surat</h3>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                maxHeight: "65vh",
                objectFit: "contain",
                background: "#000",
                borderRadius: "10px",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "15px",
              }}
            >
              <button
                type="button"
                onClick={captureCameraPhoto}
                style={{
                  padding: "11px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                📸 Ambil Foto
              </button>

              <button
                type="button"
                onClick={stopCamera}
                style={{
                  padding: "11px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                ✕ Tutup Kamera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditSurat;
