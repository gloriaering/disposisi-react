import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://disposisi-react-8vdu.vercel.app";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);
      setError("");

      // =================================================
      // DEBUG
      // =================================================

      console.log("=================================");
      console.log("LOGIN DIMULAI");
      console.log("API URL:", API_URL);
      console.log(
        "LOGIN URL:",
        `${API_URL}/api/auth/login`
      );
      console.log("USERNAME:", username);
      console.log("=================================");

      // =================================================
      // REQUEST LOGIN
      // =================================================

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: username.trim(),
            password: password,
          }),
        }
      );

      // =================================================
      // DEBUG RESPONSE
      // =================================================

      console.log(
        "STATUS LOGIN:",
        response.status
      );

      console.log(
        "STATUS TEXT:",
        response.statusText
      );

      // =================================================
      // AMBIL RESPONSE
      // =================================================

      const result = await response.json();

      console.log(
        "HASIL LOGIN:",
        result
      );

      // =================================================
      // JIKA LOGIN GAGAL
      // =================================================

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Login gagal. Status: ${response.status}`
        );
      }

      // =================================================
      // CEK TOKEN
      // =================================================

      if (!result.token) {
        throw new Error(
          "Token login tidak diterima dari server."
        );
      }

      // =================================================
      // CEK DATA USER
      // =================================================

      if (!result.user) {
        throw new Error(
          "Data user tidak diterima dari server."
        );
      }

      // =================================================
      // SIMPAN TOKEN
      // =================================================

      localStorage.setItem(
        "token",
        result.token
      );

      // =================================================
      // SIMPAN DATA USER
      // =================================================

      localStorage.setItem(
        "user",
        JSON.stringify(result.user)
      );

      // =================================================
      // SIMPAN BIDANG
      // =================================================

      localStorage.setItem(
        "bidang",
        result.user?.bidang || ""
      );

      // =================================================
      // DEBUG BERHASIL
      // =================================================

      console.log("=================================");
      console.log("LOGIN BERHASIL");
      console.log("USER:", result.user);
      console.log("TOKEN BERHASIL DISIMPAN");
      console.log("=================================");

      // =================================================
      // PINDAH KE DASHBOARD
      // =================================================

      navigate("/");
    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "LOGIN ERROR:",
        error
      );

      console.error(
        "ERROR MESSAGE:",
        error?.message
      );

      console.error(
        "================================="
      );

      // =================================================
      // PESAN ERROR
      // =================================================

      if (
        error?.message ===
        "Failed to fetch"
      ) {
        setError(
          "Tidak dapat terhubung ke server. Periksa koneksi internet atau server backend."
        );
      } else {
        setError(
          error?.message ||
            "Terjadi kesalahan saat login."
        );
      }
    } finally {
      // =================================================
      // STOP LOADING
      // =================================================

      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "25px",
        boxSizing: "border-box",
        background: "#eef2f6",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      {/* =================================================
          LOGIN CARD
      ================================================= */}

      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#ffffff",
          padding: "38px 34px 30px",
          boxSizing: "border-box",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 10px 30px rgba(30, 50, 70, 0.10)",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <h1
            style={{
              margin: "0 0 8px",
              color: "#1e3a56",
              fontSize: "24px",
              fontWeight: "700",
              letterSpacing: "-0.3px",
            }}
          >
            SISTEM DISPOSISI SURAT
          </h1>

          <p
            style={{
              margin: "0 0 5px",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            Sistem Informasi Disposisi Surat
          </p>

          <p
            style={{
              margin: 0,
              color: "#94a3b8",
              fontSize: "12px",
              lineHeight: "1.5",
            }}
          >
            Dinas Tenaga Kerja dan Transmigrasi
            <br />
            Provinsi Sulawesi Utara
          </p>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            style={{
              background: "#fff5f5",
              border:
                "1px solid #fecaca",
              color: "#b91c1c",
              padding: "11px 13px",
              borderRadius: "7px",
              marginBottom: "18px",
              fontSize: "12px",
              lineHeight: "1.5",
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <form onSubmit={handleLogin}>
          {/* USERNAME */}

          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                color: "#334155",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Masukkan username"
              autoComplete="username"
              required
              disabled={loading}
              style={{
                width: "100%",
                height: "43px",
                padding: "0 12px",
                boxSizing: "border-box",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "7px",
                background: "#ffffff",
                color: "#1e293b",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          {/* PASSWORD */}

          <div
            style={{
              marginBottom: "23px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                color: "#334155",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              Password
            </label>

            <div
              style={{
                position: "relative",
              }}
            >
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Masukkan password"
                autoComplete="current-password"
                required
                disabled={loading}
                style={{
                  width: "100%",
                  height: "43px",
                  padding:
                    "0 45px 0 12px",
                  boxSizing:
                    "border-box",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "7px",
                  background:
                    "#ffffff",
                  color: "#1e293b",
                  fontSize: "13px",
                  outline: "none",
                }}
              />

              {/* LIHAT PASSWORD */}

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                disabled={loading}
                style={{
                  position: "absolute",
                  right: "9px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  border: "none",
                  background:
                    "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "16px",
                  padding: "4px",
                }}
                title={
                  showPassword
                    ? "Sembunyikan password"
                    : "Lihat password"
                }
              >
                {showPassword
                  ? "🙈"
                  : "👁"}
              </button>
            </div>
          </div>

          {/* =================================================
              TOMBOL MASUK
          ================================================= */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "43px",
              border: "none",
              borderRadius: "7px",
              background: loading
                ? "#8aa8c2"
                : "#315f87",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "700",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              boxShadow:
                "0 3px 8px rgba(49, 95, 135, 0.18)",
            }}
          >
            {loading
              ? "Memproses..."
              : "MASUK"}
          </button>
        </form>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          style={{
            textAlign: "center",
            marginTop: "27px",
            paddingTop: "16px",
            borderTop:
              "1px solid #e5e7eb",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#94a3b8",
              fontSize: "11px",
            }}
          >
            © 2026 DISNAKERTRANS
          </p>

          <p
            style={{
              margin: "4px 0 0",
              color: "#a1a1aa",
              fontSize: "10px",
            }}
          >
            Provinsi Sulawesi Utara
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;