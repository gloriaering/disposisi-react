import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function PreviewSurat() {
  const { id } = useParams();

  const [surat, setSurat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getSurat = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/surat/${id}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Gagal mengambil data surat."
          );
        }

        setSurat(result.data || result);
      } catch (err) {
        console.error("Gagal mengambil surat:", err);

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

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "30px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Memuat arsip surat...
      </div>
    );
  }

  if (error || !surat) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: "30px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2>Arsip Tidak Ditemukan</h2>

        <p>
          {error || "Data surat tidak tersedia."}
        </p>

        <Link to={`/surat/${id}`}>
          ← Kembali ke Detail Surat
        </Link>
      </div>
    );
  }

  const arsipUrl =
    `http://localhost:5000/api/surat/preview/${id}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        padding: "30px",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
            }}
          >
            Preview Arsip Surat
          </h1>

          <p
            style={{
              marginTop: "7px",
              color: "#6b7280",
            }}
          >
            {surat.arsip_surat?.nama_file ||
              "Arsip Surat"}
          </p>
        </div>

        {/* TOMBOL KEMBALI */}

        <Link
          to={`/surat/${id}`}
          style={{
            padding: "10px 18px",
            background: "#173f5f",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600",
          }}
        >
          ← Kembali ke Detail Surat
        </Link>
      </div>

      {/* ARSIP */}

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #d9dee5",
        }}
      >
        {surat.arsip_surat?.url_file ? (
          surat.arsip_surat.tipe_file ===
          "application/pdf" ? (

            <iframe
              src={arsipUrl}
              title="Preview Arsip Surat"
              style={{
                width: "100%",
                height: "85vh",
                border: "none",
                display: "block",
              }}
            />

          ) : (

            <img
              src={arsipUrl}
              alt="Arsip Surat"
              style={{
                width: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                display: "block",
              }}
            />

          )
        ) : (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            Arsip surat belum tersedia.
          </div>
        )}
      </div>
    </div>
  );
}

export default PreviewSurat;