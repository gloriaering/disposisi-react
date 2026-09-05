const express = require("express");
const router = express.Router();

const multer = require("multer");
const mongoose = require("mongoose");

const Surat = require("../models/Surat");
const cloudinary = require("../cloudinary");
const authMiddleware = require("../middleware/authMiddleware");

console.log("=================================");
console.log("SURAT ROUTES BERHASIL DIMUAT");
console.log("=================================");


/* =========================================================
   AUTHENTICATION

   SEMUA ROUTE SURAT WAJIB LOGIN
========================================================= */

router.use(authMiddleware);


/* =========================================================
   MULTER

   FILE YANG DIIZINKAN:
   - PDF
   - JPG
   - JPEG
   - PNG
   - WEBP

   MAKSIMAL 20 MB
========================================================= */

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Format file tidak didukung. Gunakan PDF, JPG, JPEG, PNG, atau WEBP."
        )
      );
    }
  },
});


/* =========================================================
   HELPER
   PARSE ARRAY DARI FORM DATA
========================================================= */

const parseList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    // Bukan JSON
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};


/* =========================================================
   HELPER
   UPLOAD FILE KE CLOUDINARY
========================================================= */

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "surat",
        resource_type: "auto",
      },

      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};


/* =========================================================
   GET SEMUA SURAT

   SURAT YANG BELUM DIHAPUS
========================================================= */

router.get("/", async (req, res) => {
  try {
    const surat = await Surat.find({
      isDeleted: {
        $ne: true,
      },
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      data: surat,
    });

  } catch (error) {
    console.error(
      "Error mengambil data surat:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data surat.",
      error: error.message,
    });
  }
});


/* =========================================================
   GET RIWAYAT SURAT

   SURAT YANG SUDAH DIHAPUS
========================================================= */

router.get("/riwayat", async (req, res) => {
  try {
    const surat = await Surat.find({
      isDeleted: true,
    }).sort({
      updatedAt: -1,
    });

    return res.json({
      success: true,
      data: surat,
    });

  } catch (error) {
    console.error(
      "Error mengambil riwayat surat:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat surat.",
      error: error.message,
    });
  }
});


/* =========================================================
   PREVIEW FILE SURAT

   /api/surat/preview/ID/0

   PDF:
   - DITAMPILKAN DI BROWSER
   - TIDAK OTOMATIS DOWNLOAD
========================================================= */

router.get(
  "/preview/:id/:index",
  async (req, res) => {
    try {
      const { id, index } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID surat tidak valid.",
        });
      }

      const surat = await Surat.findById(id);

      if (!surat) {
        return res.status(404).json({
          success: false,
          message: "Surat tidak ditemukan.",
        });
      }

      const fileIndex = Number(index);

      if (
        Number.isNaN(fileIndex) ||
        fileIndex < 0 ||
        !surat.arsip_surat ||
        fileIndex >= surat.arsip_surat.length
      ) {
        return res.status(404).json({
          success: false,
          message: "File surat tidak ditemukan.",
        });
      }

      const file = surat.arsip_surat[fileIndex];

      if (!file || !file.url_file) {
        return res.status(404).json({
          success: false,
          message: "URL file tidak ditemukan.",
        });
      }


      /* =====================================================
         PDF
      ===================================================== */

      if (file.tipe_file === "application/pdf") {
        try {
          const response = await fetch(file.url_file);

          if (!response.ok) {
            return res.status(502).json({
              success: false,
              message:
                "PDF tidak dapat diambil dari Cloudinary.",
            });
          }

          const buffer = Buffer.from(
            await response.arrayBuffer()
          );

          res.setHeader(
            "Content-Type",
            "application/pdf"
          );

          res.setHeader(
            "Content-Disposition",
            "inline"
          );

          res.setHeader(
            "Content-Length",
            buffer.length
          );

          return res.send(buffer);

        } catch (fetchError) {
          console.error(
            "Gagal mengambil PDF dari Cloudinary:",
            fetchError
          );

          return res.status(502).json({
            success: false,
            message:
              "Gagal mengambil PDF dari Cloudinary.",
            error: fetchError.message,
          });
        }
      }


      /* =====================================================
         GAMBAR
      ===================================================== */

      if (
        file.tipe_file &&
        file.tipe_file.startsWith("image/")
      ) {
        return res.redirect(file.url_file);
      }


      /* =====================================================
         FILE LAINNYA
      ===================================================== */

      return res.redirect(file.url_file);

    } catch (error) {
      console.error(
        "Error preview surat:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Gagal menampilkan file surat.",
        error: error.message,
      });
    }
  }
);


/* =========================================================
   PREVIEW FILE PERTAMA

   /api/surat/preview/ID

   PDF:
   - DITAMPILKAN DI BROWSER
   - TIDAK OTOMATIS DOWNLOAD
========================================================= */

router.get(
  "/preview/:id",
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID surat tidak valid.",
        });
      }

      const surat = await Surat.findById(id);

      if (!surat) {
        return res.status(404).json({
          success: false,
          message: "Surat tidak ditemukan.",
        });
      }

      if (
        !surat.arsip_surat ||
        surat.arsip_surat.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message: "File surat tidak ditemukan.",
        });
      }

      const file = surat.arsip_surat[0];

      if (!file || !file.url_file) {
        return res.status(404).json({
          success: false,
          message: "URL file tidak ditemukan.",
        });
      }


      /* =====================================================
         PDF
      ===================================================== */

      if (file.tipe_file === "application/pdf") {
        try {
          const response = await fetch(file.url_file);

          if (!response.ok) {
            return res.status(502).json({
              success: false,
              message:
                "PDF tidak dapat diambil dari Cloudinary.",
            });
          }

          const buffer = Buffer.from(
            await response.arrayBuffer()
          );

          res.setHeader(
            "Content-Type",
            "application/pdf"
          );

          res.setHeader(
            "Content-Disposition",
            "inline"
          );

          res.setHeader(
            "Content-Length",
            buffer.length
          );

          return res.send(buffer);

        } catch (fetchError) {
          console.error(
            "Gagal mengambil PDF dari Cloudinary:",
            fetchError
          );

          return res.status(502).json({
            success: false,
            message:
              "Gagal mengambil PDF dari Cloudinary.",
            error: fetchError.message,
          });
        }
      }


      /* =====================================================
         GAMBAR
      ===================================================== */

      if (
        file.tipe_file &&
        file.tipe_file.startsWith("image/")
      ) {
        return res.redirect(file.url_file);
      }


      /* =====================================================
         FILE LAINNYA
      ===================================================== */

      return res.redirect(file.url_file);

    } catch (error) {
      console.error(
        "Error preview surat:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Gagal menampilkan file surat.",
        error: error.message,
      });
    }
  }
);


/* =========================================================
   DOWNLOAD FILE SURAT

   /api/surat/download/ID/0
========================================================= */

router.get(
  "/download/:id/:index",
  async (req, res) => {
    try {
      const { id, index } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID surat tidak valid.",
        });
      }

      const surat = await Surat.findById(id);

      if (!surat) {
        return res.status(404).json({
          success: false,
          message: "Surat tidak ditemukan.",
        });
      }

      const fileIndex = Number(index);

      if (
        Number.isNaN(fileIndex) ||
        fileIndex < 0 ||
        fileIndex >= surat.arsip_surat.length
      ) {
        return res.status(404).json({
          success: false,
          message: "File surat tidak ditemukan.",
        });
      }

      const file = surat.arsip_surat[fileIndex];

      if (!file || !file.url_file) {
        return res.status(404).json({
          success: false,
          message: "URL file tidak ditemukan.",
        });
      }

      return res.redirect(file.url_file);

    } catch (error) {
      console.error(
        "Error download surat:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Gagal mengunduh file surat.",
        error: error.message,
      });
    }
  }
);


/* =========================================================
   GET DETAIL SURAT
========================================================= */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID surat tidak valid.",
      });
    }

    const surat = await Surat.findById(id);

    if (!surat) {
      return res.status(404).json({
        success: false,
        message: "Surat tidak ditemukan.",
      });
    }

    return res.json({
      success: true,
      data: surat,
    });

  } catch (error) {
    console.error(
      "Error mengambil detail surat:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail surat.",
      error: error.message,
    });
  }
});


/* =========================================================
   TAMBAH SURAT
========================================================= */

router.post(
  "/",
  upload.array("arsip_surat", 10),
  async (req, res) => {
    try {

      const {
        nomor_surat,
        asal_surat,
        tanggal_surat,
        tanggal_diterima,
        perihal,
        nomor_agenda,
        jam_diterima,
        sifat_surat,
        catatan,
      } = req.body;


      /* =====================================================
         BIDANG
         
         TIDAK DITAMPILKAN DI FRONTEND
         SEMUA SURAT = SEKRETARIAT
      ===================================================== */

      const bidang = "Sekretariat";


      /* =====================================================
         DISPOSISI
      ===================================================== */

      const diteruskan_kepada =
        parseList(
          req.body.diteruskan_kepada
        );

      const dengan_hormat_harap =
        parseList(
          req.body.dengan_hormat_harap
        );


      /* =====================================================
         UPLOAD FILE
      ===================================================== */

      const arsip_surat = [];

      if (
        req.files &&
        req.files.length > 0
      ) {

        for (
          const file of req.files
        ) {

          const result =
            await uploadToCloudinary(file);

          arsip_surat.push({
            nama_file:
              file.originalname,

            url_file:
              result.secure_url,

            public_id:
              result.public_id,

            tipe_file:
              file.mimetype,

            resource_type:
              result.resource_type,
          });
        }
      }


      /* =====================================================
         BUAT DATA SURAT
      ===================================================== */

      const surat =
        await Surat.create({
          bidang,

          nomor_surat,
          asal_surat,
          tanggal_surat,
          tanggal_diterima,
          perihal,
          nomor_agenda,
          jam_diterima,
          sifat_surat,
          catatan,

          diteruskan_kepada,
          dengan_hormat_harap,

          arsip_surat,

          isDeleted: false,
        });


      return res.status(201).json({
        success: true,
        message: "Surat berhasil ditambahkan.",
        data: surat,
      });

    } catch (error) {

      console.error(
        "Error menambahkan surat:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Gagal menambahkan surat.",
      });
    }
  }
);


/* =========================================================
   EDIT SURAT
========================================================= */

router.put(
  "/:id",
  upload.array("arsip_surat", 10),
  async (req, res) => {
    try {

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID surat tidak valid.",
        });
      }


      const surat =
        await Surat.findById(id);

      if (!surat) {
        return res.status(404).json({
          success: false,
          message: "Surat tidak ditemukan.",
        });
      }


      const {
        nomor_surat,
        asal_surat,
        tanggal_surat,
        tanggal_diterima,
        perihal,
        nomor_agenda,
        jam_diterima,
        sifat_surat,
        catatan,
      } = req.body;


      if (nomor_surat !== undefined) {
        surat.nomor_surat =
          nomor_surat;
      }

      if (asal_surat !== undefined) {
        surat.asal_surat =
          asal_surat;
      }

      if (tanggal_surat !== undefined) {
        surat.tanggal_surat =
          tanggal_surat;
      }

      if (tanggal_diterima !== undefined) {
        surat.tanggal_diterima =
          tanggal_diterima;
      }

      if (perihal !== undefined) {
        surat.perihal =
          perihal;
      }

      if (nomor_agenda !== undefined) {
        surat.nomor_agenda =
          nomor_agenda;
      }

      if (jam_diterima !== undefined) {
        surat.jam_diterima =
          jam_diterima;
      }

      if (sifat_surat !== undefined) {
        surat.sifat_surat =
          sifat_surat;
      }

      if (catatan !== undefined) {
        surat.catatan =
          catatan;
      }


      /* =====================================================
         DISPOSISI
      ===================================================== */

      if (
        req.body.diteruskan_kepada !==
        undefined
      ) {
        surat.diteruskan_kepada =
          parseList(
            req.body.diteruskan_kepada
          );
      }

      if (
        req.body.dengan_hormat_harap !==
        undefined
      ) {
        surat.dengan_hormat_harap =
          parseList(
            req.body.dengan_hormat_harap
          );
      }


      /* =====================================================
         TAMBAH FILE BARU
      ===================================================== */

      if (
        req.files &&
        req.files.length > 0
      ) {

        for (
          const file of req.files
        ) {

          const result =
            await uploadToCloudinary(file);

          surat.arsip_surat.push({
            nama_file:
              file.originalname,

            url_file:
              result.secure_url,

            public_id:
              result.public_id,

            tipe_file:
              file.mimetype,

            resource_type:
              result.resource_type,
          });
        }
      }


      await surat.save();


      return res.json({
        success: true,
        message:
          "Surat berhasil diperbarui.",
        data: surat,
      });

    } catch (error) {

      console.error(
        "Error mengedit surat:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Gagal memperbarui surat.",
      });
    }
  }
);


/* =========================================================
   HAPUS FILE ARSIP
========================================================= */

router.delete(
  "/:id/arsip/:index",
  async (req, res) => {
    try {

      const { id, index } =
        req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID surat tidak valid.",
        });
      }


      const surat =
        await Surat.findById(id);

      if (!surat) {
        return res.status(404).json({
          success: false,
          message: "Surat tidak ditemukan.",
        });
      }


      const fileIndex =
        Number(index);

      if (
        Number.isNaN(fileIndex) ||
        fileIndex < 0 ||
        fileIndex >=
          surat.arsip_surat.length
      ) {
        return res.status(404).json({
          success: false,
          message: "File surat tidak ditemukan.",
        });
      }


      const file =
        surat.arsip_surat[fileIndex];


      /* =====================================================
         HAPUS FILE DARI CLOUDINARY
      ===================================================== */

      if (
        file &&
        file.public_id
      ) {

        try {

          await cloudinary.uploader.destroy(
            file.public_id,
            {
              resource_type:
                file.resource_type ||
                "image",
            }
          );

        } catch (cloudinaryError) {

          console.error(
            "Gagal menghapus file Cloudinary:",
            cloudinaryError
          );

        }
      }


      /* =====================================================
         HAPUS FILE DARI DATABASE
      ===================================================== */

      const arsipBaru =
        surat.arsip_surat.filter(
          (_, i) =>
            i !== fileIndex
        );

      const hasil =
        await Surat.updateOne(
          { _id: id },
          {
            $set: {
              arsip_surat:
                arsipBaru,
            },
          }
        );


      if (
        hasil.modifiedCount === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "File gagal dihapus.",
        });
      }


      return res.json({
        success: true,
        message:
          "File berhasil dihapus.",
      });

    } catch (error) {

      console.error(
        "Error menghapus file:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Gagal menghapus file.",
        error: error.message,
      });
    }
  }
);


/* =========================================================
   HAPUS SURAT

   SOFT DELETE
   SURAT MASUK → RIWAYAT
========================================================= */

router.delete(
  "/:id",
  async (req, res) => {
    try {

      const { id } =
        req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message:
            "ID surat tidak valid.",
        });
      }


      const surat =
        await Surat.findById(id);

      if (!surat) {
        return res.status(404).json({
          success: false,
          message:
            "Surat tidak ditemukan.",
        });
      }


      const hasil =
        await Surat.updateOne(
          {
            _id: id,
          },
          {
            $set: {
              isDeleted: true,
            },
          }
        );


      if (
        hasil.modifiedCount === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Surat gagal dipindahkan ke riwayat.",
        });
      }


      return res.status(200).json({
        success: true,
        message:
          "Surat berhasil dipindahkan ke riwayat.",
      });

    } catch (error) {

      console.error(
        "Error menghapus surat:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Gagal menghapus surat.",
        error: error.message,
      });
    }
  }
);


/* =========================================================
   RESTORE SURAT

   RIWAYAT → SURAT MASUK
========================================================= */

router.put(
  "/:id/restore",
  async (req, res) => {
    try {

      const { id } =
        req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message:
            "ID surat tidak valid.",
        });
      }


      const surat =
        await Surat.findById(id);

      if (!surat) {
        return res.status(404).json({
          success: false,
          message:
            "Surat tidak ditemukan.",
        });
      }


      const hasil =
        await Surat.updateOne(
          {
            _id: id,
          },
          {
            $set: {
              isDeleted: false,
            },
          }
        );


      if (
        hasil.modifiedCount === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Surat gagal dipulihkan.",
        });
      }


      return res.json({
        success: true,
        message:
          "Surat berhasil dipulihkan.",
      });

    } catch (error) {

      console.error(
        "Error restore surat:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Gagal memulihkan surat.",
        error: error.message,
      });
    }
  }
);


/* =========================================================
   HAPUS SURAT PERMANEN
========================================================= */

router.delete(
  "/:id/permanen",
  async (req, res) => {
    try {

      const { id } =
        req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message:
            "ID surat tidak valid.",
        });
      }


      const surat =
        await Surat.findById(id);

      if (!surat) {
        return res.status(404).json({
          success: false,
          message:
            "Surat tidak ditemukan.",
        });
      }


      /* =====================================================
         HAPUS FILE DARI CLOUDINARY
      ===================================================== */

      if (
        surat.arsip_surat &&
        surat.arsip_surat.length > 0
      ) {

        for (
          const file of surat.arsip_surat
        ) {

          if (
            file &&
            file.public_id
          ) {

            try {

              await cloudinary.uploader.destroy(
                file.public_id,
                {
                  resource_type:
                    file.resource_type ||
                    "image",
                }
              );

            } catch (cloudinaryError) {

              console.error(
                "Gagal menghapus file Cloudinary:",
                cloudinaryError
              );

            }
          }
        }
      }


      /* =====================================================
         HAPUS DATA SURAT DARI DATABASE
      ===================================================== */

      await Surat.findByIdAndDelete(id);


      return res.json({
        success: true,
        message:
          "Surat berhasil dihapus secara permanen.",
      });

    } catch (error) {

      console.error(
        "Error menghapus surat permanen:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Gagal menghapus surat secara permanen.",
        error: error.message,
      });
    }
  }
);


/* =========================================================
   ERROR MULTER
========================================================= */

router.use(
  (error, req, res, next) => {

    if (
      error instanceof multer.MulterError
    ) {

      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Ukuran file terlalu besar. Maksimal 20 MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }


    if (error) {

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Terjadi kesalahan saat upload file.",
      });
    }


    next();
  }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;       