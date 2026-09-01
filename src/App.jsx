import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import SuratMasuk from "./pages/SuratMasuk";
import TambahSurat from "./pages/TambahSurat";
import DetailSurat from "./pages/DetailSurat";
import EditSurat from "./pages/EditSurat";
import CetakSurat from "./pages/CetakSurat";
import RiwayatSurat from "./pages/RiwayatSurat";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* DASHBOARD */}
        <Route
          path="/"
          element={<Dashboard />}
        />

        {/* SURAT MASUK */}
        <Route
          path="/surat"
          element={<SuratMasuk />}
        />

        {/* TAMBAH SURAT */}
        <Route
          path="/surat/tambah"
          element={<TambahSurat />}
        />

        {/* DETAIL SURAT */}
        <Route
          path="/surat/detail/:id"
          element={<DetailSurat />}
        />

        {/* EDIT SURAT */}
        <Route
          path="/surat/edit/:id"
          element={<EditSurat />}
        />

        {/* CETAK SURAT */}
        <Route
          path="/surat/cetak/:id"
          element={<CetakSurat />}
        />

        {/* RIWAYAT SURAT */}
        <Route
          path="/riwayat"
          element={<RiwayatSurat />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;