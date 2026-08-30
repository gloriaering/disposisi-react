import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../assets/css/CetakSurat.css";
import logoSulut from "../assets/images/logo-sulut.png";

/* =========================================================
   FORMAT TANGGAL LOKAL
   Bisa membaca:
   - YYYY-MM-DD
   - YYYY-MM-DDTHH:mm:ss
   - Date dari MongoDB
   - format tanggal lainnya
========================================================= */

function parseDateLocal(value) {
  if (!value) return null;

  const text = String(value).trim();

  // Format YYYY-MM-DD
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const tahun = Number(match[1]);
    const bulan = Number(match[2]);
    const tanggal = Number(match[3]);

    const date = new Date(
      tahun,
      bulan - 1,
      tanggal
    );

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  // Coba format Date biasa
  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  return null;
}

/* =========================================================
   FORMAT TANGGAL SURAT
   Contoh:
   2026-08-28
   menjadi:
   28/08/2026
========================================================= */

function formatTanggal(value) {
  if (!value) return "-";

  const date = parseDateLocal(value);

  if (!date) {
    return String(value);
  }

  const tanggal = String(
    date.getDate()
  ).padStart(2, "0");

  const bulan = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const tahun = date.getFullYear();

  return `${tanggal}/${bulan}/${tahun}`;
}

/* =========================================================
   FORMAT TANGGAL DITERIMA
   Contoh:
   2026-08-28
   menjadi:
   28 Agustus -
========================================================= */

function formatTanggalDiterima(value) {
  if (!value) return "-";

  const date = parseDateLocal(value);

  if (!date) {
    return String(value);
  }

  const namaBulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const tanggal = String(
    date.getDate()
  ).padStart(2, "0");

  return `${tanggal} ${namaBulan[date.getMonth()]} -`;
}

/* =========================================================
   FORMAT TAHUN
========================================================= */

function formatTahun(value) {
  if (!value) return "";

  const date = parseDateLocal(value);

  if (!date) return "";

  return date.getFullYear();
}

/* =========================================================
   FORMAT JAM
   Contoh:
   14:30
   menjadi:
   14.30
========================================================= */

function formatJam(value) {
  if (!value) return "";

  const text = String(value).trim();

  const match = text.match(
    /^(\d{1,2}):(\d{2})/
  );

  if (!match) {
    return text;
  }

  return `${String(match[1]).padStart(
    2,
    "0"
  )}.${match[2]}`;
}

/* =========================================================
   PILIHAN DISPOSISI
========================================================= */

function Pilihan({ text }) {
  return (
    <div className="pilihan">
      <span className="checkbox"></span>

      <span className="pilihan-text">
        {text}
      </span>
    </div>
  );
}

/* =========================================================
   DITERUSKAN KEPADA
========================================================= */

const diteruskanList = [
  "Sekretaris",
  "Kabid. HI & Jaminan Sosial Tenaga Kerja",
  "Kabid. Pengawasan Ketenagakerjaan",
  "Kabid. Pelatihan & penempatan T.K",
  "Kabid. Ketransmigrasian",
  "Ka. UPTD Balai Pengawasan Tenaga Kerja",
  "Ka. UPTD Balai Pelatihan Tenaga Kerja",
];

/* =========================================================
   DENGAN HORMAT HARAP
========================================================= */

const hormatList = [
  "Buat Tanggapan dan saran",
  "Tangani / Proses lebih Lanjut",
  "Proses Sesuai Ketentuan",
  "Laporkan Kepada Saya",
  "Koordinasi",
  "Untuk Minta Perhatian",
  "Tindak Lanjut",
  "Buatkan Materi / Sambutan",
  "Mewakili",
  "File",
];

/* =========================================================
   COMPONENT
========================================================= */

export default function CetakSurat() {
  const { id } = useParams();

  const [surat, setSurat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     AMBIL DATA SURAT
  ======================================================= */

  useEffect(() => {
    const fetchSurat = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/surat/${id}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Data surat tidak ditemukan."
          );
        }

        if (!result.data) {
          throw new Error(
            "Data surat tidak tersedia."
          );
        }

        console.log(
          "DATA SURAT DARI DATABASE:",
          result.data
        );

        console.log(
          "TANGGAL SURAT:",
          result.data.tanggal_surat
        );

        console.log(
          "TANGGAL DITERIMA:",
          result.data.tanggal_diterima
        );

        console.log(
          "JAM DITERIMA:",
          result.data.jam_diterima
        );

        setSurat(result.data);

      } catch (error) {
        console.error(
          "Gagal mengambil data surat:",
          error
        );

        setError(
          error.message ||
            "Gagal mengambil data surat."
        );

        setSurat(null);

      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSurat();
    } else {
      setLoading(false);

      setError(
        "ID surat tidak ditemukan."
      );
    }
  }, [id]);

  /* =======================================================
     CETAK
  ======================================================= */

  const handlePrint = () => {
    window.print();
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="not-found">
        <div className="not-found-box">
          <h2>
            Memuat data surat...
          </h2>

          <p>
            Sedang mengambil data surat
            dari database.
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     DATA TIDAK ADA
  ======================================================= */

  if (!surat) {
    return (
      <div className="not-found">
        <div className="not-found-box">

          <h2>
            Data surat tidak ditemukan.
          </h2>

          <p>
            {error ||
              "Surat yang ingin dicetak tidak tersedia di database."}
          </p>

          <Link
            to="/surat"
            className="not-found-button"
          >
            ← Kembali ke Data Surat
          </Link>

        </div>
      </div>
    );
  }

  /* =======================================================
     DATA TANGGAL & JAM
  ======================================================= */

  const tanggalSurat =
    surat.tanggal_surat;

  const tanggalDiterima =
    surat.tanggal_diterima;

  const jamDiterima =
    surat.jam_diterima;

  /* =======================================================
     DEBUG
  ======================================================= */

  console.log(
    "Tanggal Surat:",
    tanggalSurat
  );

  console.log(
    "Hasil Format Tanggal Surat:",
    formatTanggal(tanggalSurat)
  );

  console.log(
    "Tanggal Diterima:",
    tanggalDiterima
  );

  console.log(
    "Hasil Format Tanggal Diterima:",
    formatTanggalDiterima(
      tanggalDiterima
    )
  );

  /* =======================================================
     TAHUN TANDA TANGAN
  ======================================================= */

  const tahunSekarang =
    new Date().getFullYear();

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* ===================================================
          TOMBOL NAVIGASI
      =================================================== */}

      <div className="print-controls">

        <Link
          to="/surat"
          className="back-button"
        >
          ← Kembali
        </Link>

        <button
          type="button"
          className="print-button"
          onClick={handlePrint}
        >
          🖨 Cetak
        </button>

      </div>

      {/* ===================================================
          HALAMAN A4
      =================================================== */}

      <main className="print-page">

        {/* =================================================
            KOP SURAT
        ================================================= */}

        <header className="kop">

          <img
            src={logoSulut}
            className="logo"
            alt="Logo Pemerintah Provinsi Sulawesi Utara"
          />

          <div className="kop-text">

            <div className="pemerintah">
              PEMERINTAH PROVINSI SULAWESI UTARA
            </div>

            <div className="dinas">
              DINAS TENAGA KERJA DAN
            </div>

            <div className="dinas">
              TRANSMIGRASI DAERAH
            </div>

            <div className="alamat">
              Jl. 17 Agustus Rike Telp.
              0431-852833, Fax. 0431-864309
              Manado 95119
            </div>

            <div className="email">
              HOME PAGE : http://www.sulut.go.id,
              {" "}
              E-MAIL :
              disnakertrans.sulut@gmail.com
            </div>

          </div>

        </header>

        {/* =================================================
            GARIS KOP
        ================================================= */}

        <div className="garis-kop">

          <div className="garis-atas"></div>

          <div className="garis-bawah"></div>

        </div>

        {/* =================================================
            JUDUL
        ================================================= */}

        <div className="judul">
          L E M B A R&nbsp;&nbsp;&nbsp;
          D I S P O S I S I
        </div>

        {/* =================================================
            INFORMASI SURAT
        ================================================= */}

        <section className="info-box">

          <div className="info-top">

            {/* =============================================
                KOLOM KIRI
            ============================================== */}

            <div className="info-left">

              {/* SURAT DARI */}

              <div className="info-row surat-dari">

                <span className="info-label">
                  Surat Dari
                </span>

                <span className="info-colon">
                  :
                </span>

                <span className="info-value">
                  {surat.asal_surat || "-"}
                </span>

              </div>

              {/* NO SURAT */}

              <div className="info-row no-surat">

                <span className="info-label">
                  No.Surat
                </span>

                <span className="info-colon">
                  :
                </span>

                <span className="info-value">
                  {surat.nomor_surat || "-"}
                </span>

              </div>

              {/* TGL SURAT */}

              <div className="info-row tgl-surat">

                <span className="info-label">
                  Tgl.Surat
                </span>

                <span className="info-colon">
                  :
                </span>

                <span className="info-value">
                  {formatTanggal(
                    tanggalSurat
                  )}
                </span>

              </div>

            </div>

            {/* =============================================
                KOLOM KANAN
            ============================================== */}

            <div className="info-right">

              {/* DITERIMA TANGGAL */}

              <div className="info-row diterima-row">

                <span className="info-label">
                  Diterima Tgl
                </span>

                <span className="info-colon">
                  :
                </span>

                <span className="info-value diterima-value">

                  <span className="tanggal-tahun">

                    <span className="tanggal-diterima">
                      {formatTanggalDiterima(
                        tanggalDiterima
                      )}
                    </span>

                    <span className="tahun">
                      {formatTahun(
                        tanggalDiterima
                      )}
                    </span>

                  </span>

                  {formatJam(jamDiterima) && (
                    <span className="jam">
                      {formatJam(
                        jamDiterima
                      )}
                    </span>
                  )}

                </span>

              </div>

              {/* NOMOR AGENDA */}

              <div className="info-row">

                <span className="info-label">
                  No.Agenda
                </span>

                <span className="info-colon">
                  :
                </span>

                <span className="info-value">
                  {surat.nomor_agenda || "-"}
                </span>

              </div>

              {/* SEKRETARIS */}

              <div className="info-row">

                <span className="info-label">
                  Sekretaris
                </span>

                <span className="info-colon">
                  :
                </span>

                <span className="info-value">
                </span>

              </div>

              {/* KASUBAG UMUM */}

              <div className="info-row">

                <span className="info-label">
                  Kasubag Umum
                </span>

                <span className="info-colon">
                  :
                </span>

                <span className="info-value">
                </span>

              </div>

              {/* SIFAT */}

              <div className="sifat-row">

                <span className="info-label sifat-label">
                  Sifat
                </span>

                <div className="sifat">

                  <span className="sifat-item">

                    <span className="checkbox">
                    </span>

                    <span>
                      Sangat Rahasia
                    </span>

                  </span>

                  <span className="sifat-item">

                    <span className="checkbox">
                    </span>

                    <span>
                      Segera
                    </span>

                  </span>

                  <span className="sifat-item">

                    <span className="checkbox">
                    </span>

                    <span>
                      Rahasia
                    </span>

                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              HAL
          ================================================= */}

          <div className="hal-box">

            <div className="hal-label">

              <span>
                Hal
              </span>

              <span className="info-colon">
                :
              </span>

            </div>

            <div className="hal-value">
              {surat.perihal || "-"}
            </div>

          </div>

        </section>

        {/* =================================================
            HEADER DISPOSISI
        ================================================= */}

        <div className="disposisi-head">

          <div className="disposisi-head-kiri">
            Diteruskan Kepada
          </div>

          <div className="disposisi-head-kanan">
            Dengan Hormat Harap
          </div>

        </div>

        {/* =================================================
            ISI DISPOSISI
        ================================================= */}

        <div className="disposisi-body">

          <div className="disposisi-kiri">

            {diteruskanList.map(
              (item) => (
                <Pilihan
                  key={item}
                  text={item}
                />
              )
            )}

          </div>

          <div className="disposisi-kanan">

            {hormatList.map(
              (item) => (
                <Pilihan
                  key={item}
                  text={item}
                />
              )
            )}

          </div>

        </div>

        {/* =================================================
            CATATAN + TANDA TANGAN
        ================================================= */}

        <div className="bottom">

          {/* CATATAN */}

          <div className="catatan">

            <div className="catatan-title">
              C a t a t a n
            </div>

            <div className="catatan-content">
              {surat.catatan || ""}
            </div>

          </div>

          {/* TANDA TANGAN */}

          <div className="ttd">

            <div className="ttd-kota">

              <span>
                Manado,
              </span>

              <span className="ttd-tahun">
                {tahunSekarang}
              </span>

            </div>

            <div className="ttd-jabatan">
              KEPALA DINAS :
            </div>

            <div className="ruang-ttd">
            </div>

            <div className="nama-kepala">
              Dr.Ir. Deicy Paath, ST, M.Si
            </div>

            <div className="nip">
              NIP 196712181994032005
            </div>

          </div>

        </div>

      </main>
    </>
  );
}