import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import logoSulut from "../assets/images/logo-sulut.png";

const API_URL = "https://disposisi-react-8vdu.vercel.app";

function DetailSurat() {
  const { id } = useParams();

  // =========================================================
  // STATE
  // =========================================================

  const [surat, setSurat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [arsipAktif, setArsipAktif] = useState(null);

  // URL Blob untuk preview PDF
  const [pdfPreviewUrls, setPdfPreviewUrls] = useState({});

  // =========================================================
  // AMBIL DATA SURAT
  // =========================================================

  useEffect(() => {
    const getSurat = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/api/surat/${id}`,
          {
            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {},
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Gagal mengambil data surat."
          );
        }

        const data =
          result.data || result;

        setSurat(data);

      } catch (err) {
        console.error(
          "Gagal mengambil detail surat:",
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
  // DAFTAR ARSIP
  // =========================================================

  const daftarArsip =
    Array.isArray(surat?.arsip_surat)
      ? surat.arsip_surat
      : surat?.arsip_surat
      ? [surat.arsip_surat]
      : [];

  // =========================================================
  // LOAD PDF UNTUK PREVIEW
  // =========================================================

  useEffect(() => {
    if (!surat) {
      return;
    }

    const arsipArray =
      Array.isArray(surat.arsip_surat)
        ? surat.arsip_surat
        : surat.arsip_surat
        ? [surat.arsip_surat]
        : [];

    if (arsipArray.length === 0) {
      return;
    }

    let cancelled = false;

    const objectUrls = [];

    const loadPDF = async () => {
      const token =
        localStorage.getItem("token");

      const hasil = {};

      for (
        let index = 0;
        index < arsipArray.length;
        index++
      ) {
        const arsip =
          arsipArray[index];

        const fileIsPDF =
          arsip?.tipe_file ===
            "application/pdf" ||
          arsip?.nama_file
            ?.toLowerCase()
            .endsWith(".pdf");

        if (!fileIsPDF) {
          continue;
        }

        try {
          const response =
            await fetch(
              `${API_URL}/api/surat/preview/${surat._id}/${index}`,
              {
                headers: token
                  ? {
                      Authorization:
                        `Bearer ${token}`,
                    }
                  : {},
              }
            );

          if (!response.ok) {
            throw new Error(
              `Gagal mengambil PDF (${response.status})`
            );
          }

          const blob =
            await response.blob();

          const blobUrl =
            URL.createObjectURL(blob);

          objectUrls.push(blobUrl);

          hasil[index] =
            blobUrl;

        } catch (err) {
          console.error(
            `Gagal preview PDF ${index + 1}:`,
            err
          );
        }
      }

      if (!cancelled) {
        setPdfPreviewUrls(hasil);
      }
    };

    loadPDF();

    return () => {
      cancelled = true;

      objectUrls.forEach(
        (url) => {
          URL.revokeObjectURL(url);
        }
      );
    };
  }, [surat]);

  // =========================================================
  // HELPER TANGGAL
  // =========================================================

  const parseDateLocal = (value) => {
    if (!value) {
      return null;
    }

    if (
      typeof value === "string" &&
      /^\d{2}-\d{2}-\d{4}$/.test(value)
    ) {
      const [
        tanggal,
        bulan,
        tahun,
      ] = value.split("-");

      return new Date(
        Number(tahun),
        Number(bulan) - 1,
        Number(tanggal)
      );
    }

    const date =
      new Date(value);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const formatTanggal = (value) => {
    const date =
      parseDateLocal(value);

    if (!date) {
      return "-";
    }

    return date.toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  const formatJam = (value) => {
    if (!value) {
      return "-";
    }

    if (
      typeof value === "string" &&
      /^\d{2}:\d{2}/.test(value)
    ) {
      return value.slice(0, 5);
    }

    const date =
      new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleTimeString(
      "id-ID",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =========================================================
  // CEK JENIS FILE
  // =========================================================

  const adalahPDF = (file) => {
    return (
      file?.tipe_file ===
        "application/pdf" ||
      file?.nama_file
        ?.toLowerCase()
        .endsWith(".pdf")
    );
  };

  const adalahGambar = (file) => {
    return (
      file?.tipe_file?.startsWith(
        "image/"
      ) ||
      /\.(jpg|jpeg|png|webp)$/i.test(
        file?.nama_file || ""
      )
    );
  };

  // =========================================================
  // PILIH FILE
  // =========================================================

  const bukaFullscreen = (arsip) => {
    setArsipAktif(arsip);
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        Memuat data surat...
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "40px",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <h2>
          Terjadi Kesalahan
        </h2>

        <p>{error}</p>

        <Link to="/surat">
          ← Kembali ke Surat Masuk
        </Link>
      </div>
    );
  }

  // =========================================================
  // JIKA DATA TIDAK ADA
  // =========================================================

  if (!surat) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
        }}
      >
        Data surat tidak ditemukan.
      </div>
    );
  }

  // =========================================================
  // TAMPILAN
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "#f8fafc",
        fontFamily:
          "Arial, sans-serif",
      }}
    >

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: "250px",
          background:
            "#173f5f",
          color: "#fff",
          padding: "25px 18px",
          boxSizing:
            "border-box",
        }}
      >

        {/* BRAND */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom:
              "40px",
          }}
        >

          <div
            style={{
              width: "48px",
              height: "48px",
              background: "#fff",
              borderRadius:
                "50%",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              overflow: "hidden",
            }}
          >

            <img
              src={logoSulut}
              alt="Logo Sulawesi Utara"
              style={{
                width: "42px",
                height: "42px",
                objectFit:
                  "contain",
              }}
            />

          </div>

          <div>

            <h2
              style={{
                margin: 0,
                fontSize:
                  "18px",
              }}
            >
              DISNAKERTRANS
            </h2>

            <span
              style={{
                fontSize:
                  "13px",
                opacity: 0.8,
              }}
            >
              Sulawesi Utara
            </span>

          </div>

        </div>

        {/* MENU */}

        <p
          style={{
            fontSize:
              "11px",
            opacity: 0.6,
            marginBottom:
              "12px",
          }}
        >
          MENU UTAMA
        </p>

        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding:
              "13px 14px",
            marginBottom:
              "6px",
            borderRadius:
              "8px",
            color: "#fff",
            textDecoration:
              "none",
          }}
        >
          <span>⌂</span>
          Dashboard
        </Link>

        <Link
          to="/surat"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding:
              "13px 14px",
            marginBottom:
              "6px",
            borderRadius:
              "8px",
            background:
              "rgba(255,255,255,0.15)",
            color: "#fff",
            textDecoration:
              "none",
          }}
        >
          <span>▣</span>
          Surat Masuk
        </Link>

        <Link
          to="/riwayat"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding:
              "13px 14px",
            marginBottom:
              "6px",
            borderRadius:
              "8px",
            color: "#fff",
            textDecoration:
              "none",
          }}
        >
          <span>↶</span>
          Riwayat Surat
        </Link>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main
        style={{
          marginLeft:
            "250px",
          minHeight:
            "100vh",
        }}
      >

        {/* TOPBAR */}

        <header
          style={{
            background:
              "#ffffff",
            borderBottom:
              "1px solid #e2e8f0",
            padding:
              "20px 30px",
          }}
        >

          <h1
            style={{
              margin: 0,
              fontSize:
                "24px",
              color:
                "#173f5f",
            }}
          >
            Detail Surat
          </h1>

          <p
            style={{
              margin:
                "5px 0 0",
              color:
                "#64748b",
            }}
          >
            Sistem Informasi Disposisi Surat
          </p>

        </header>

        {/* CONTENT */}

        <section
          style={{
            padding:
              "30px",
            maxWidth:
              "1400px",
            margin:
              "0 auto",
          }}
        >

          {/* HEADER */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              gap: "20px",
              marginBottom:
                "25px",
              flexWrap:
                "wrap",
            }}
          >

            <div>

              <span
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "bold",
                  color:
                    "#64748b",
                }}
              >
                DATA ADMINISTRASI
              </span>

              <h2
                style={{
                  margin:
                    "6px 0",
                  color:
                    "#173f5f",
                }}
              >
                Detail Surat Masuk
              </h2>

              <p
                style={{
                  margin: 0,
                  color:
                    "#64748b",
                }}
              >
                Informasi lengkap surat yang telah tersimpan.
              </p>

            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap:
                  "wrap",
              }}
            >

              <Link
                to="/surat"
                style={{
                  display:
                    "inline-block",
                  padding:
                    "10px 16px",
                  background:
                    "#e2e8f0",
                  color:
                    "#334155",
                  borderRadius:
                    "8px",
                  textDecoration:
                    "none",
                }}
              >
                ← Kembali
              </Link>

              <Link
                to={`/surat/edit/${surat._id}`}
                style={{
                  display:
                    "inline-block",
                  padding:
                    "10px 16px",
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
                ✎ Edit Surat
              </Link>

            </div>

          </div>

          {/* =================================================
              INFORMASI SURAT
          ================================================= */}

          <div
            style={{
              background:
                "#fff",
              border:
                "1px solid #e2e8f0",
              borderRadius:
                "12px",
              padding:
                "25px",
              marginBottom:
                "25px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >

            <h3
              style={{
                marginTop: 0,
                color:
                  "#173f5f",
              }}
            >
              Informasi Surat
            </h3>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap:
                  "20px",
              }}
            >

              {/* NOMOR SURAT */}

              <div>

                <small
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  Nomor Surat
                </small>

                <div
                  style={{
                    marginTop:
                      "5px",
                    fontWeight:
                      "600",
                  }}
                >
                  {surat.nomor_surat ||
                    "-"}
                </div>

              </div>

              {/* NOMOR AGENDA */}

              <div>

                <small
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  Nomor Agenda
                </small>

                <div
                  style={{
                    marginTop:
                      "5px",
                    fontWeight:
                      "600",
                  }}
                >
                  {surat.nomor_agenda ||
                    "-"}
                </div>

              </div>

              {/* SURAT DARI */}

              <div>

                <small
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  Surat Dari
                </small>

                <div
                  style={{
                    marginTop:
                      "5px",
                    fontWeight:
                      "600",
                  }}
                >
                  {surat.asal_surat ||
                    "-"}
                </div>

              </div>

              {/* SIFAT SURAT */}

              <div>

                <small
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  Sifat Surat
                </small>

                <div
                  style={{
                    marginTop:
                      "5px",
                    fontWeight:
                      "600",
                  }}
                >
                  {surat.sifat_surat ||
                    "-"}
                </div>

              </div>

              {/* TANGGAL SURAT */}

              <div>

                <small
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  Tanggal Surat
                </small>

                <div
                  style={{
                    marginTop:
                      "5px",
                    fontWeight:
                      "600",
                  }}
                >
                  {formatTanggal(
                    surat.tanggal_surat
                  )}
                </div>

              </div>

              {/* TANGGAL DITERIMA */}

              <div>

                <small
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  Tanggal Diterima
                </small>

                <div
                  style={{
                    marginTop:
                      "5px",
                    fontWeight:
                      "600",
                  }}
                >
                  {formatTanggal(
                    surat.tanggal_diterima
                  )}
                </div>

              </div>

              {/* JAM DITERIMA */}

              <div>

                <small
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  Jam Diterima
                </small>

                <div
                  style={{
                    marginTop:
                      "5px",
                    fontWeight:
                      "600",
                  }}
                >
                  {formatJam(
                    surat.jam_diterima
                  )}
                </div>

              </div>

            </div>

            {/* PERIHAL */}

            <div
              style={{
                marginTop:
                  "25px",
                paddingTop:
                  "20px",
                borderTop:
                  "1px solid #e2e8f0",
              }}
            >

              <small
                style={{
                  color:
                    "#64748b",
                }}
              >
                Perihal
              </small>

              <div
                style={{
                  marginTop:
                    "8px",
                  lineHeight:
                    "1.6",
                  whiteSpace:
                    "pre-wrap",
                }}
              >
                {surat.perihal ||
                  "-"}
              </div>

            </div>

          </div>

          {/* =================================================
              SCAN SURAT
          ================================================= */}

          <div
            style={{
              background:
                "#fff",
              border:
                "1px solid #e2e8f0",
              borderRadius:
                "12px",
              padding:
                "25px",
              marginBottom:
                "25px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >

            <h3
              style={{
                marginTop: 0,
                color:
                  "#173f5f",
              }}
            >
              Scan Surat
            </h3>

            {daftarArsip.length === 0 ? (

              <div
                style={{
                  padding:
                    "30px",
                  textAlign:
                    "center",
                  border:
                    "1px dashed #cbd5e1",
                  borderRadius:
                    "10px",
                  color:
                    "#64748b",
                }}
              >
                Belum ada scan surat.
              </div>

            ) : (

              daftarArsip.map(
                (arsip, index) => (

                  <div
                    key={
                      arsip.public_id ||
                      index
                    }
                    style={{
                      marginTop:
                        "20px",
                      border:
                        "1px solid #e2e8f0",
                      borderRadius:
                        "12px",
                      overflow:
                        "hidden",
                    }}
                  >

                    {/* HEADER FILE */}

                    <div
                      style={{
                        padding:
                          "15px",
                        background:
                          "#f8fafc",
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
                        {adalahPDF(
                          arsip
                        )
                          ? "📄 PDF"
                          : adalahGambar(
                              arsip
                            )
                          ? "🖼️ Gambar"
                          : "📁 File"}{" "}

                        {index + 1}
                      </strong>

                      <span
                        style={{
                          color:
                            "#64748b",
                          wordBreak:
                            "break-word",
                        }}
                      >
                        {arsip.nama_file ||
                          "Arsip Surat"}
                      </span>

                    </div>

                    {/* =================================================
                        PDF PREVIEW
                    ================================================= */}

                    {adalahPDF(
                      arsip
                    ) && (

                      <div
                        style={{
                          width:
                            "100%",
                          height:
                            "700px",
                          background:
                            "#ffffff",
                        }}
                      >

                        {pdfPreviewUrls[
                          index
                        ] ? (

                          <iframe
                            title={`Preview PDF ${
                              index + 1
                            }`}
                            src={
                              pdfPreviewUrls[
                                index
                              ]
                            }
                            style={{
                              width:
                                "100%",
                              height:
                                "100%",
                              border:
                                "none",
                              display:
                                "block",
                              background:
                                "#ffffff",
                            }}
                          />

                        ) : (

                          <div
                            style={{
                              width:
                                "100%",
                              height:
                                "100%",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              flexDirection:
                                "column",
                              gap:
                                "10px",
                              color:
                                "#64748b",
                            }}
                          >

                            <div
                              style={{
                                fontSize:
                                  "35px",
                              }}
                            >
                              📄
                            </div>

                            <strong>
                              Memuat PDF...
                            </strong>

                            <span>
                              Tunggu sebentar
                            </span>

                          </div>

                        )}

                      </div>

                    )}

                    {/* =================================================
                        GAMBAR
                    ================================================= */}

                    {adalahGambar(
                      arsip
                    ) && (

                      <div
                        style={{
                          padding:
                            "20px",
                          textAlign:
                            "center",
                          background:
                            "#f8fafc",
                        }}
                      >

                        <img
                          src={
                            arsip.url_file
                          }
                          alt={
                            arsip.nama_file ||
                            "Scan Surat"
                          }
                          style={{
                            maxWidth:
                              "100%",
                            maxHeight:
                              "700px",
                            borderRadius:
                              "8px",
                            objectFit:
                              "contain",
                          }}
                        />

                      </div>

                    )}

                    {/* =================================================
                        BUTTON
                    ================================================= */}

                    <div
                      style={{
                        padding:
                          "15px",
                        borderTop:
                          "1px solid #e2e8f0",
                        display:
                          "flex",
                        gap:
                          "10px",
                        flexWrap:
                          "wrap",
                      }}
                    >

                      {/* FULLSCREEN */}

                      <button
                        type="button"
                        onClick={() =>
                          bukaFullscreen(
                            arsip
                          )
                        }
                        style={{
                          padding:
                            "10px 15px",
                          border:
                            "none",
                          borderRadius:
                            "8px",
                          background:
                            "#173f5f",
                          color:
                            "#fff",
                          cursor:
                            "pointer",
                        }}
                      >
                        ⛶ Lihat Layar Penuh
                      </button>

                      {/* BUKA FILE */}

                      <a
                        href={
                          arsip.url_file
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display:
                            "inline-block",
                          padding:
                            "10px 15px",
                          background:
                            "#e2e8f0",
                          color:
                            "#334155",
                          borderRadius:
                            "8px",
                          textDecoration:
                            "none",
                        }}
                      >
                        📂 Buka File
                      </a>

                      {/* DOWNLOAD */}

                      <a
                        href={
                          arsip.url_file
                        }
                        download
                        style={{
                          display:
                            "inline-block",
                          padding:
                            "10px 15px",
                          background:
                            "#16a34a",
                          color:
                            "#fff",
                          borderRadius:
                            "8px",
                          textDecoration:
                            "none",
                        }}
                      >
                        ⬇ Download
                      </a>

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </section>

      </main>

      {/* =========================================================
          FULLSCREEN MODAL
      ========================================================= */}

      {arsipAktif && (

        <div
          style={{
            position:
              "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display:
              "flex",
            flexDirection:
              "column",
          }}
        >

          {/* HEADER MODAL */}

          <div
            style={{
              height:
                "70px",
              flexShrink: 0,
              background:
                "#173f5f",
              color:
                "#fff",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              padding:
                "0 20px",
              boxSizing:
                "border-box",
              gap:
                "10px",
            }}
          >

            <strong
              style={{
                overflow:
                  "hidden",
                textOverflow:
                  "ellipsis",
                whiteSpace:
                  "nowrap",
              }}
            >
              {arsipAktif.nama_file ||
                "Preview Surat"}
            </strong>

            <button
              type="button"
              onClick={() =>
                setArsipAktif(null)
              }
              style={{
                border:
                  "none",
                background:
                  "#fff",
                color:
                  "#173f5f",
                borderRadius:
                  "8px",
                padding:
                  "9px 15px",
                cursor:
                  "pointer",
                fontWeight:
                  "bold",
              }}
            >
              ✕ Tutup
            </button>

          </div>

          {/* =====================================================
              FULLSCREEN PDF
          ===================================================== */}

          {adalahPDF(
            arsipAktif
          ) && (

            <div
              style={{
                flex: 1,
                background:
                  "#f8fafc",
                minHeight: 0,
              }}
            >

              {(() => {

                const index =
                  daftarArsip.indexOf(
                    arsipAktif
                  );

                return pdfPreviewUrls[
                  index
                ] ? (

                  <iframe
                    title="PDF Fullscreen"
                    src={
                      pdfPreviewUrls[
                        index
                      ]
                    }
                    style={{
                      width:
                        "100%",
                      height:
                        "100%",
                      minHeight:
                        "calc(100vh - 70px)",
                      border:
                        "none",
                      display:
                        "block",
                    }}
                  />

                ) : (

                  <div
                    style={{
                      height:
                        "calc(100vh - 70px)",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      flexDirection:
                        "column",
                      gap:
                        "10px",
                      color:
                        "#64748b",
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          "35px",
                      }}
                    >
                      📄
                    </div>

                    <strong>
                      Memuat PDF...
                    </strong>

                  </div>

                );

              })()}

            </div>

          )}

          {/* =====================================================
              FULLSCREEN GAMBAR
          ===================================================== */}

          {adalahGambar(
            arsipAktif
          ) && (

            <div
              style={{
                flex: 1,
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                padding:
                  "20px",
                boxSizing:
                  "border-box",
                overflow:
                  "auto",
              }}
            >

              <img
                src={
                  arsipAktif.url_file
                }
                alt={
                  arsipAktif.nama_file ||
                  "Preview Surat"
                }
                style={{
                  maxWidth:
                    "100%",
                  maxHeight:
                    "100%",
                  objectFit:
                    "contain",
                }}
              />

            </div>

          )}

        </div>

      )}

    </div>
  );
}

export default DetailSurat;