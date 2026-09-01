const express = require("express");

console.log("=================================");
console.log("SURAT ROUTES BERHASIL DIMUAT");
console.log("=================================");

const router = express.Router();

const multer = require("multer");
const mongoose = require("mongoose");

const Surat = require("../models/Surat");
const cloudinary = require("../cloudinary");


/* =========================================================
   MULTER

   FILE YANG DIIZINKAN:
   - PDF
   - JPG
   - JPEG
   - PNG
========================================================= */

const upload = multer({

  storage: multer.memoryStorage(),

  limits: {
    fileSize: 20 * 1024 * 1024,
  },

  fileFilter: function (req, file, cb) {

    const tipeFileDiizinkan = [

      "application/pdf",

      "image/jpeg",

      "image/jpg",

      "image/png",

    ];


    if (
      tipeFileDiizinkan.includes(
        file.mimetype
      )
    ) {

      cb(null, true);

    } else {

      cb(
        new Error(
          "File arsip harus berupa PDF, JPG, JPEG, atau PNG."
        )
      );

    }

  },

});


/* =========================================================
   FUNGSI UPLOAD ARSIP KE CLOUDINARY

   PDF  -> resource_type RAW
   FOTO -> resource_type IMAGE
========================================================= */

function uploadArsip(file) {

  return new Promise(function (resolve, reject) {

    const namaAman =
      file.originalname
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-");


    const namaPublic =
      Date.now() +
      "-" +
      namaAman;


    const resourceType =
      file.mimetype === "application/pdf"
        ? "raw"
        : "image";


    console.log("=================================");
    console.log("MULAI UPLOAD ARSIP");
    console.log("Nama File:", file.originalname);
    console.log("Tipe File:", file.mimetype);
    console.log("Public ID:", namaPublic);
    console.log("Resource Type:", resourceType);
    console.log("=================================");


    const uploadStream =
      cloudinary.uploader.upload_stream(

        {

          folder:
            "disposisi-surat/arsip",

          resource_type:
            resourceType,

          public_id:
            namaPublic,

        },

        function (error, result) {

          if (error) {

            console.error(
              "ERROR UPLOAD CLOUDINARY:",
              error
            );

            reject(error);

          } else {

            console.log("=================================");
            console.log("UPLOAD ARSIP BERHASIL");
            console.log("URL:", result.secure_url);
            console.log("Public ID:", result.public_id);
            console.log("Resource Type:", result.resource_type);
            console.log("=================================");

            resolve(result);

          }

        }

      );


    uploadStream.end(file.buffer);

  });

}


/* =========================================================
   GET SEMUA SURAT AKTIF

   GET /api/surat
========================================================= */

router.get(
  "/",

  async function (req, res) {

    try {

      const surat =
        await Surat.find({

          isDeleted: {
            $ne: true,
          },

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

        message:
          "Gagal mengambil data surat.",

      });

    }

  }

);


/* =========================================================
   GET RIWAYAT SURAT

   GET /api/surat/riwayat
========================================================= */

router.get(
  "/riwayat",

  async function (req, res) {

    try {

      const surat =
        await Surat.find({

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

        message:
          "Gagal mengambil data riwayat surat.",

      });

    }

  }

);


/* =========================================================
   PREVIEW SCAN SURAT

   GET /api/surat/preview/:id
========================================================= */

router.get(
  "/preview/:id",

  async function (req, res) {

    try {

      const id =
        req.params.id;


      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {

        return res.status(400).send(
          "ID surat tidak valid."
        );

      }


      const surat =
        await Surat.findById(id);


      if (!surat) {

        return res.status(404).send(
          "Surat tidak ditemukan."
        );

      }


      if (
        !surat.arsip_surat ||
        !surat.arsip_surat.url_file
      ) {

        return res.status(404).send(
          "Scan surat belum tersedia."
        );

      }


      return res.redirect(
        surat.arsip_surat.url_file
      );

    } catch (error) {

      console.error(
        "ERROR PREVIEW ARSIP:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Gagal menampilkan preview scan surat.",

        error:
          error.message,

      });

    }

  }

);


/* =========================================================
   DOWNLOAD ARSIP SURAT

   GET /api/surat/download/:id

   FILE LANGSUNG DIDOWNLOAD KE PERANGKAT
========================================================= */

router.get(
  "/download/:id",

  async function (req, res) {

    try {

      const id = req.params.id;


      console.log("=================================");
      console.log("DOWNLOAD ARSIP DIPANGGIL");
      console.log("ID:", id);
      console.log("=================================");


      /* ================================================
         CEK ID
      ================================================= */

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "ID surat tidak valid.",

        });

      }


      /* ================================================
         CARI SURAT
      ================================================= */

      const surat =
        await Surat.findById(id);


      if (!surat) {

        return res.status(404).json({

          success: false,

          message:
            "Surat tidak ditemukan.",

        });

      }


      /* ================================================
         CEK ARSIP
      ================================================= */

      if (

        !surat.arsip_surat ||

        !surat.arsip_surat.url_file

      ) {

        return res.status(404).json({

          success: false,

          message:
            "File arsip belum tersedia.",

        });

      }


      const urlFile =
        surat.arsip_surat.url_file;


      const namaFile =
        surat.arsip_surat.nama_file ||
        "arsip-surat";


      const tipeFile =
        surat.arsip_surat.tipe_file ||
        "application/octet-stream";


      console.log(
        "MENGAMBIL FILE DARI CLOUDINARY"
      );

      console.log(
        "NAMA FILE:",
        namaFile
      );


      /* ================================================
         AMBIL FILE DARI CLOUDINARY
      ================================================= */

      const response =
        await fetch(urlFile);


      if (!response.ok) {

        throw new Error(
          "Gagal mengambil file dari Cloudinary."
        );

      }


      /* ================================================
         SET HEADER DOWNLOAD
      ================================================= */

      res.setHeader(

        "Content-Type",

        tipeFile

      );


      res.setHeader(

        "Content-Disposition",

        `attachment; filename="${encodeURIComponent(
          namaFile
        )}"`

      );


      /* ================================================
         AMBIL FILE SEBAGAI BUFFER
      ================================================= */

      const arrayBuffer =
        await response.arrayBuffer();


      const buffer =
        Buffer.from(arrayBuffer);


      /* ================================================
         KIRIM FILE KE USER

         BROWSER AKAN LANGSUNG DOWNLOAD
      ================================================= */

      return res.send(buffer);


    } catch (error) {

      console.error("=================================");
      console.error("ERROR DOWNLOAD ARSIP:");
      console.error(error);
      console.error("=================================");


      return res.status(500).json({

        success: false,

        message:
          "Gagal mendownload arsip surat.",

        error:
          error.message,

      });

    }

  }

);


/* =========================================================
   GET SATU SURAT

   GET /api/surat/:id

   HARUS DI BAWAH PREVIEW DAN DOWNLOAD
========================================================= */

router.get(
  "/:id",

  async function (req, res) {

    try {

      const id =
        req.params.id;


      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {

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

        message:
          "Gagal mengambil surat.",

        error:
          error.message,

      });

    }

  }

);


/* =========================================================
   TAMBAH SURAT + SCAN

   POST /api/surat
========================================================= */

router.post(
  "/",

  upload.single("arsip_surat"),

  async function (req, res) {

    try {

      let dataArsip = {

        nama_file: "",

        url_file: "",

        public_id: "",

        tipe_file: "",

        resource_type: "",

      };


      if (req.file) {

        const hasilUpload =
          await uploadArsip(req.file);


        dataArsip = {

          nama_file:
            req.file.originalname,

          url_file:
            hasilUpload.secure_url,

          public_id:
            hasilUpload.public_id,

          tipe_file:
            req.file.mimetype,

          resource_type:
            hasilUpload.resource_type ||
            (
              req.file.mimetype === "application/pdf"
                ? "raw"
                : "image"
            ),

        };

      }


      let diteruskanKepada = [];

      let denganHormatHarap = [];


      if (
        req.body.diteruskan_kepada
      ) {

        try {

          diteruskanKepada =
            JSON.parse(
              req.body.diteruskan_kepada
            );

        } catch (error) {

          diteruskanKepada = [];

        }

      }


      if (
        req.body.dengan_hormat_harap
      ) {

        try {

          denganHormatHarap =
            JSON.parse(
              req.body.dengan_hormat_harap
            );

        } catch (error) {

          denganHormatHarap = [];

        }

      }


      const suratBaru =
        new Surat({

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
            diteruskanKepada,

          dengan_hormat_harap:
            denganHormatHarap,

          catatan:
            req.body.catatan || "",

          arsip_surat:
            dataArsip,

          isDeleted:
            false,

        });


      const suratTersimpan =
        await suratBaru.save();


      res.status(201).json({

        success: true,

        message:
          "Surat berhasil disimpan.",

        data:
          suratTersimpan,

      });

    } catch (error) {

      console.error(
        "Gagal menyimpan surat:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          error.message ||
          "Gagal menyimpan surat.",

        error:
          error.message,

      });

    }

  }

);


/* =========================================================
   UPDATE SURAT + GANTI SCAN

   PUT /api/surat/:id
========================================================= */

router.put(
  "/:id",

  upload.single("arsip_surat"),

  async function (req, res) {

    try {

      const id =
        req.params.id;


      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "ID surat tidak valid.",

        });

      }


      const suratLama =
        await Surat.findById(id);


      if (!suratLama) {

        return res.status(404).json({

          success: false,

          message:
            "Surat tidak ditemukan.",

        });

      }


      let diteruskanKepada = [];

      let denganHormatHarap = [];


      if (
        req.body.diteruskan_kepada
      ) {

        try {

          diteruskanKepada =
            JSON.parse(
              req.body.diteruskan_kepada
            );

        } catch (error) {

          diteruskanKepada = [];

        }

      }


      if (
        req.body.dengan_hormat_harap
      ) {

        try {

          denganHormatHarap =
            JSON.parse(
              req.body.dengan_hormat_harap
            );

        } catch (error) {

          denganHormatHarap = [];

        }

      }


      const dataUpdate = {

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
          diteruskanKepada,

        dengan_hormat_harap:
          denganHormatHarap,

        catatan:
          req.body.catatan || "",

      };


      if (req.file) {

        const hasilUpload =
          await uploadArsip(req.file);


        if (
          suratLama.arsip_surat &&
          suratLama.arsip_surat.public_id
        ) {

          try {

            await cloudinary.uploader.destroy(

              suratLama
                .arsip_surat
                .public_id,

              {

                resource_type:

                  suratLama
                    .arsip_surat
                    .resource_type ||

                  "raw",

              }

            );

          } catch (deleteError) {

            console.error(
              "Gagal menghapus arsip lama:",
              deleteError
            );

          }

        }


        dataUpdate.arsip_surat = {

          nama_file:
            req.file.originalname,

          url_file:
            hasilUpload.secure_url,

          public_id:
            hasilUpload.public_id,

          tipe_file:
            req.file.mimetype,

          resource_type:
            hasilUpload.resource_type ||
            (
              req.file.mimetype === "application/pdf"
                ? "raw"
                : "image"
            ),

        };

      }


      const suratDiperbarui =
        await Surat.findByIdAndUpdate(

          id,

          dataUpdate,

          {

            new: true,

            runValidators: true,

          }

        );


      res.json({

        success: true,

        message:
          "Surat berhasil diperbarui.",

        data:
          suratDiperbarui,

      });

    } catch (error) {

      console.error(
        "Gagal memperbarui surat:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          error.message ||
          "Gagal memperbarui surat.",

        error:
          error.message,

      });

    }

  }

);


/* =========================================================
   PULIHKAN SURAT

   PUT /api/surat/:id/pulihkan
========================================================= */

router.put(
  "/:id/pulihkan",

  async function (req, res) {

    try {

      const suratDipulihkan =
        await Surat.findOneAndUpdate(

          {

            _id:
              req.params.id,

            isDeleted:
              true,

          },

          {

            isDeleted:
              false,

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

        data:
          suratDipulihkan,

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

        error:
          error.message,

      });

    }

  }

);


/* =========================================================
   HAPUS SURAT → RIWAYAT

   DELETE /api/surat/:id
========================================================= */

router.delete(
  "/:id",

  async function (req, res) {

    try {

      const suratDihapus =
        await Surat.findOneAndUpdate(

          {

            _id:
              req.params.id,

            isDeleted: {
              $ne: true,
            },

          },

          {

            isDeleted:
              true,

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

        data:
          suratDihapus,

      });

    } catch (error) {

      console.error(
        "Gagal memindahkan surat:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Gagal memindahkan surat.",

        error:
          error.message,

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

  async function (req, res) {

    try {

      const suratDihapusPermanen =
        await Surat.findOneAndDelete({

          _id:
            req.params.id,

          isDeleted:
            true,

        });


      if (!suratDihapusPermanen) {

        return res.status(404).json({

          success: false,

          message:
            "Surat tidak ditemukan di riwayat.",

        });

      }


      if (

        suratDihapusPermanen.arsip_surat &&

        suratDihapusPermanen
          .arsip_surat
          .public_id

      ) {

        try {

          await cloudinary.uploader.destroy(

            suratDihapusPermanen
              .arsip_surat
              .public_id,

            {

              resource_type:

                suratDihapusPermanen
                  .arsip_surat
                  .resource_type ||

                "raw",

            }

          );


          console.log(
            "FILE CLOUDINARY BERHASIL DIHAPUS"
          );

        } catch (deleteError) {

          console.error(
            "Gagal menghapus file dari Cloudinary:",
            deleteError
          );

        }

      }


      res.json({

        success: true,

        message:
          "Surat berhasil dihapus secara permanen.",

        data:
          suratDihapusPermanen,

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

        error:
          error.message,

      });

    }

  }

);


/* =========================================================
   ERROR MULTER
========================================================= */

router.use(
  function (error, req, res, next) {

    if (
      error instanceof multer.MulterError
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Upload file gagal: " +
          error.message,

      });

    }


    if (error) {

      return res.status(400).json({

        success: false,

        message:
          error.message,

      });

    }


    next();

  }

);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;