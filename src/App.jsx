import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import SuratMasuk from "./pages/SuratMasuk";
import TambahSurat from "./pages/Tambahsurat";
import DetailSurat from "./pages/DetailSurat";
import EditSurat from "./pages/EditSurat";
import CetakSurat from "./pages/CetakSurat";
import RiwayatSurat from "./pages/RiwayatSurat";


/* =========================================================
   PROTECTED ROUTE

   CEK APAKAH USER SUDAH LOGIN
========================================================= */

function ProtectedRoute({ children }) {

  const token = localStorage.getItem("token");

  if (!token) {

    return <Navigate to="/login" replace />;

  }

  return children;

}


/* =========================================================
   APP
========================================================= */

function App() {

  return (

    <BrowserRouter>

      <Routes>


        {/* =================================================
            LOGIN
        ================================================= */}

        <Route
          path="/login"
          element={

            localStorage.getItem("token")

              ? <Navigate to="/" replace />

              : <Login />

          }
        />


        {/* =================================================
            DASHBOARD
        ================================================= */}

        <Route
          path="/"
          element={

            <ProtectedRoute>

              <Dashboard />

            </ProtectedRoute>

          }
        />


        {/* =================================================
            SURAT MASUK
        ================================================= */}

        <Route
          path="/surat"
          element={

            <ProtectedRoute>

              <SuratMasuk />

            </ProtectedRoute>

          }
        />


        {/* =================================================
            TAMBAH SURAT
        ================================================= */}

        <Route
          path="/surat/tambah"
          element={

            <ProtectedRoute>

              <TambahSurat />

            </ProtectedRoute>

          }
        />


        {/* =================================================
            DETAIL SURAT
        ================================================= */}

        <Route
          path="/surat/detail/:id"
          element={

            <ProtectedRoute>

              <DetailSurat />

            </ProtectedRoute>

          }
        />


        {/* =================================================
            EDIT SURAT
        ================================================= */}

        <Route
          path="/surat/edit/:id"
          element={

            <ProtectedRoute>

              <EditSurat />

            </ProtectedRoute>

          }
        />


        {/* =================================================
            CETAK SURAT
        ================================================= */}

        <Route
          path="/surat/cetak/:id"
          element={

            <ProtectedRoute>

              <CetakSurat />

            </ProtectedRoute>

          }
        />


        {/* =================================================
            RIWAYAT SURAT
        ================================================= */}

        <Route
          path="/riwayat"
          element={

            <ProtectedRoute>

              <RiwayatSurat />

            </ProtectedRoute>

          }
        />


        {/* =================================================
            JIKA URL TIDAK DITEMUKAN
        ================================================= */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />


      </Routes>

    </BrowserRouter>

  );

}


export default App;