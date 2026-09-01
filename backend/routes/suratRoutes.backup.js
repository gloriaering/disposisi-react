const express = require("express");
const router = express.Router();

const Surat = require("../models/Surat");

/* =========================================================
   GET SEMUA SURAT AKTIF
   GET /api/surat
========================================================= */

router.get("/", async (req, res) => {
  try {
    /*
      Hanya mengambil surat yang BELUM dihapus.

      $ne: true digunakan supaya data lama yang
      belum memiliki field isDeleted tetap muncul.
    */

    const surat = await Surat.find({
      isDeleted: { $ne: true },
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: surat,
    });
  } catch (error) {
    console.error(
      "Gagal mengambil data surat:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data surat.",
    });
  }
});


/* =========================================================
   GET RIWAYAT SURAT
   GET /api/surat/riwayat
========================================================= */

router.get("/riwayat", async (req, res) => {
  try {
    /*
      Hanya mengambil surat yang sudah dihapus
      / masuk ke riwayat.
    */

    const surat = await Surat.find({
      isDeleted: true,
    }).sort({
      updatedAt: -1,
    });

    res.json({
      success: true,
      data: surat,
    });
  } catch (error) {
    console.error(
      "Gagal mengambil riwayat surat:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat surat.",
    });
  }
});


/* =========================================================
   GET SATU SURAT
   GET /api/surat/:id
========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const surat = await Surat.findById(
      req.params.id
    );

    if (!surat) {
      return res.status(404).json({
        success: false,
        message: "Surat tidak ditemukan.",
      });
    }

    res.json({
      success: true,
      data: surat,
    });
  } catch (error) {
    console.error(
      "Gagal mengambil surat:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Gagal mengambil surat.",
    });
  }
});


/* =========================================================
   TAMBAH SURAT
   POST /api/surat
========================================================= */

router.post("/", async (req, res) => {
  try {
    const suratBaru = new Surat({
      nomor_surat: req.body.nomor_surat,
      asal_surat: req.body.asal_surat,
      tanggal_surat: req.body.tanggal_surat,
      nomor_agenda: req.body.nomor_agenda,
      tanggal_diterima:
        req.body.tanggal_diterima,
      jam_diterima:
        req.body.jam_diterima,
      perihal: req.body.perihal,

      /*
        Sifat boleh kosong.
      */

      sifat_surat:
        req.body.sifat_surat || "",

      diteruskan_kepada:
        req.body.diteruskan_kepada || [],

      dengan_hormat_harap:
        req.body.dengan_hormat_harap || [],

      catatan:
        req.body.catatan || "",

      /*
        Surat baru selalu aktif.
      */

      isDeleted: false,
    });

    const suratTersimpan =
      await suratBaru.save();

    res.status(201).json({
      success: true,
      message: "Surat berhasil disimpan.",
      data: suratTersimpan,
    });
  } catch (error) {
    console.error(
      "Gagal menyimpan surat:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Gagal menyimpan surat.",
      error: error.message,
    });
  }
});


/* =========================================================
   UPDATE SURAT
   PUT /api/surat/:id
========================================================= */

router.put("/:id", async (req, res) => {
  try {
    const suratDiperbarui =
      await Surat.findByIdAndUpdate(
        req.params.id,
        {
          nomor_surat:
            req.body.nomor_surat,

          asal_surat:
            req.body.asal_surat,

          tanggal_surat:
            req.body.tanggal_surat,

          nomor_agenda:
            req.body.nomor_agenda,

          tanggal_diterima:
            req.body.tanggal_diterima,

          jam_diterima:
            req.body.jam_diterima,

          perihal:
            req.body.perihal,

          sifat_surat:
            req.body.sifat_surat || "",

          diteruskan_kepada:
            req.body.diteruskan_kepada || [],

          dengan_hormat_harap:
            req.body.dengan_hormat_harap || [],

          catatan:
            req.body.catatan || "",
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!suratDiperbarui) {
      return res.status(404).json({
        success: false,
        message: "Surat tidak ditemukan.",
      });
    }

    res.json({
      success: true,
      message:
        "Surat berhasil diperbarui.",
      data: suratDiperbarui,
    });
  } catch (error) {
    console.error(
      "Gagal memperbarui surat:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Gagal memperbarui surat.",
      error: error.message,
    });
  }
});


/* =========================================================
   HAPUS SURAT → MASUK RIWAYAT
   DELETE /api/surat/:id
========================================================= */

router.delete("/:id", async (req, res) => {
  try {
    /*
      TIDAK menghapus data dari MongoDB.

      Surat hanya diberi:
      isDeleted = true

      sehingga surat masuk ke Riwayat Surat.
    */

    const suratDihapus =
      await Surat.findOneAndUpdate(
        {
          _id: req.params.id,
          isDeleted: { $ne: true },
        },
        {
          isDeleted: true,
        },
        {
          new: true,
        }
      );

    if (!suratDihapus) {
      return res.status(404).json({
        success: false,
        message:
          "Surat tidak ditemukan atau sudah berada di riwayat.",
      });
    }

    res.json({
      success: true,
      message:
        "Surat berhasil dipindahkan ke riwayat.",
      data: suratDihapus,
    });
  } catch (error) {
    console.error(
      "Gagal memindahkan surat ke riwayat:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Gagal memindahkan surat ke riwayat.",
      error: error.message,
    });
  }
});


/* =========================================================
   PULIHKAN SURAT DARI RIWAYAT
   PUT /api/surat/:id/pulihkan
========================================================= */

router.put(
  "/:id/pulihkan",
  async (req, res) => {
    try {
      const suratDipulihkan =
        await Surat.findOneAndUpdate(
          {
            _id: req.params.id,
            isDeleted: true,
          },
          {
            isDeleted: false,
          },
          {
            new: true,
          }
        );

      if (!suratDipulihkan) {
        return res.status(404).json({
          success: false,
          message:
            "Surat tidak ditemukan di riwayat.",
        });
      }

      res.json({
        success: true,
        message:
          "Surat berhasil dipulihkan.",
        data: suratDipulihkan,
      });
    } catch (error) {
      console.error(
        "Gagal memulihkan surat:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Gagal memulihkan surat.",
        error: error.message,
      });
    }
  }
);


/* =========================================================
   HAPUS PERMANEN
   DELETE /api/surat/:id/permanen
========================================================= */

router.delete(
  "/:id/permanen",
  async (req, res) => {
    try {
      /*
        Hapus benar-benar dari MongoDB.

        Hanya surat yang sudah berada
        di Riwayat yang boleh dihapus permanen.
      */

      const suratDihapusPermanen =
        await Surat.findOneAndDelete({
          _id: req.params.id,
          isDeleted: true,
        });

      if (!suratDihapusPermanen) {
        return res.status(404).json({
          success: false,
          message:
            "Surat tidak ditemukan di riwayat.",
        });
      }

      res.json({
        success: true,
        message:
          "Surat berhasil dihapus secara permanen.",
        data: suratDihapusPermanen,
      });
    } catch (error) {
      console.error(
        "Gagal menghapus surat secara permanen:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Gagal menghapus surat secara permanen.",
        error: error.message,
      });
    }
  }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;