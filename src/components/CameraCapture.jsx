import { useEffect, useRef, useState } from "react";

function CameraCapture({ onCapture, onClose }) {

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  /* =========================================================
     BUKA KAMERA
  ========================================================= */

  useEffect(() => {

    const startCamera = async () => {

      try {

        setLoading(true);
        setError("");

        const stream =
          await navigator.mediaDevices.getUserMedia({

            video: {
              facingMode: "environment",
            },

            audio: false,

          });


        streamRef.current = stream;


        if (videoRef.current) {

          videoRef.current.srcObject = stream;

        }


        setLoading(false);

      } catch (error) {

        console.error(
          "Gagal membuka kamera:",
          error
        );


        setError(
          "Kamera tidak dapat dibuka. Pastikan kamu sudah memberikan izin kamera."
        );

        setLoading(false);

      }

    };


    startCamera();


    return () => {

      if (streamRef.current) {

        streamRef.current
          .getTracks()
          .forEach((track) => {

            track.stop();

          });

      }

    };

  }, []);


  /* =========================================================
     TUTUP KAMERA
  ========================================================= */

  const handleClose = () => {

    if (streamRef.current) {

      streamRef.current
        .getTracks()
        .forEach((track) => {

          track.stop();

        });

    }


    onClose();

  };


  /* =========================================================
     AMBIL FOTO
  ========================================================= */

  const handleCapture = () => {

    if (!videoRef.current) {

      return;

    }


    const video =
      videoRef.current;


    const canvas =
      document.createElement("canvas");


    canvas.width =
      video.videoWidth;


    canvas.height =
      video.videoHeight;


    const context =
      canvas.getContext("2d");


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

          return;

        }


        const file =
          new File(

            [blob],

            `scan-surat-${Date.now()}.jpg`,

            {

              type: "image/jpeg",

            }

          );


        onCapture(file);


        handleClose();

      },

      "image/jpeg",

      0.9

    );

  };


  /* =========================================================
     TAMPILAN
  ========================================================= */

  return (

    <div
      style={{

        position: "fixed",

        top: 0,

        left: 0,

        width: "100%",

        height: "100%",

        background:
          "rgba(0,0,0,0.75)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        zIndex: 9999,

        padding: "20px",

        boxSizing: "border-box",

      }}
    >

      <div
        style={{

          width: "100%",

          maxWidth: "700px",

          background: "#ffffff",

          borderRadius: "15px",

          padding: "20px",

          boxSizing: "border-box",

        }}
      >

        {/* JUDUL */}

        <div
          style={{

            display: "flex",

            justifyContent:
              "space-between",

            alignItems: "center",

            marginBottom: "15px",

          }}
        >

          <h2
            style={{

              margin: 0,

              fontSize: "20px",

            }}
          >
            📷 Kamera Scan Surat
          </h2>


          <button
            type="button"
            onClick={handleClose}
            style={{

              border: "none",

              background: "transparent",

              fontSize: "24px",

              cursor: "pointer",

            }}
          >
            ✕
          </button>

        </div>


        {/* ERROR */}

        {error && (

          <div
            style={{

              padding: "12px",

              background: "#fee2e2",

              color: "#b91c1c",

              borderRadius: "8px",

              marginBottom: "15px",

            }}
          >
            {error}
          </div>

        )}


        {/* LOADING */}

        {loading && !error && (

          <p>
            Membuka kamera...
          </p>

        )}


        {/* VIDEO */}

        {!error && (

          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{

              width: "100%",

              maxHeight: "500px",

              background: "#000000",

              borderRadius: "10px",

              display: "block",

            }}
          />

        )}


        {/* BUTTON */}

        {!error && !loading && (

          <div
            style={{

              display: "flex",

              gap: "10px",

              marginTop: "15px",

              justifyContent: "center",

              flexWrap: "wrap",

            }}
          >

            <button
              type="button"
              onClick={handleClose}
              style={{

                padding:
                  "10px 20px",

                border:
                  "1px solid #d1d5db",

                background:
                  "#ffffff",

                borderRadius:
                  "8px",

                cursor:
                  "pointer",

              }}
            >
              Batal
            </button>


            <button
              type="button"
              onClick={handleCapture}
              style={{

                padding:
                  "10px 20px",

                border:
                  "none",

                background:
                  "#123b5d",

                color:
                  "#ffffff",

                borderRadius:
                  "8px",

                cursor:
                  "pointer",

                fontWeight:
                  "bold",

              }}
            >
              📸 Ambil Foto
            </button>

          </div>

        )}


        {error && (

          <div
            style={{

              marginTop: "15px",

              textAlign: "center",

            }}
          >

            <button
              type="button"
              onClick={handleClose}
              style={{

                padding:
                  "10px 20px",

                border:
                  "none",

                background:
                  "#123b5d",

                color:
                  "#ffffff",

                borderRadius:
                  "8px",

                cursor:
                  "pointer",

              }}
            >
              Tutup
            </button>

          </div>

        )}

      </div>

    </div>

  );

}

export default CameraCapture;               