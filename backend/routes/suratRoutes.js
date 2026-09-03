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

      "image/webp",

    ];


    if (tipeFileDiizinkan.includes(file.mimetype)) {

      cb(null, true);

    } else {

      cb(

        new Error(
          "File harus berupa PDF, JPG, JPEG, PNG, atau WEBP."
        )

      );

    }

  },

});


/* =========================================================
   FUNGSI CEK ID
========================================================= */

function idValid(id) {

  return mongoose.Types.ObjectId.isValid(id);

}


/* =========================================================
   UPLOAD SATU FILE KE CLOUDINARY
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
      Math.floor(Math.random() * 100000) +
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
    console.log("=================================");


    const uploadStream =

      cloudinary.uploader.upload_stream(

        {

          folder: "disposisi-surat/arsip",

          resource_type: resourceType,

          public_id: namaPublic,

        },

        function (error, result) {

          if (error) {

            console.error(
              "ERROR UPLOAD CLOUDINARY:",
              error
            );

            reject(error);

            return;

          }


          console.log("=================================");
          console.log("UPLOAD BERHASIL");
          console.log("URL:", result.secure_url);
          console.log("PUBLIC ID:", result.public_id);
          console.log("=================================");


          resolve(result);

        }

      );


    uploadStream.end(file.buffer);

  });

}


/* =========================================================
   UPLOAD BANYAK FILE
========================================================= */

async function uploadBanyakArsip(files) {

  const hasilArsip = [];


  for (const file of files) {

    const hasilUpload =

      await uploadArsip(file);


    hasilArsip.push({

      nama_file:
        file.originalname,

      url_file:
        hasilUpload.secure_url,

      public_id:
        hasilUpload.public_id,

      tipe_file:
        file.mimetype,

      resource_type:

        hasilUpload.resource_type ||

        (
          file.mimetype === "application/pdf"
            ? "raw"
            : "image"
        ),

    });

  }


  return hasilArsip;

}


/* =========================================================
   HAPUS SATU FILE CLOUDINARY
========================================================= */

async function hapusSatuArsipCloudinary(arsip) {

  if (!arsip || !arsip.public_id) {

    return;

  }


  try {

    await cloudinary.uploader.destroy(

      arsip.public_id,

      {

        resource_type:
          arsip.resource_type || "image",

      }

    );


    console.log(
      "FILE CLOUDINARY BERHASIL DIHAPUS:",
      arsip.public_id
    );

  } catch (error) {

    console.error(
      "Gagal menghapus file Cloudinary:",
      error
    );

  }

}


/* =========================================================
   HAPUS SEMUA FILE CLOUDINARY
========================================================= */

async function hapusSemuaArsipCloudinary(arsipList) {

  if (!Array.isArray(arsipList)) {

    return;

  }


  for (const arsip of arsipList) {

    await hapusSatuArsipCloudinary(
      arsip
    );

  }

}


/* =========================================================
   GET SEMUA SURAT AKTIF
========================================================= */

router.get("/", async function (req, res) {

  try {

    const surat =

      await Surat.find({

        isDeleted: {
          $ne: true,
        },

      })

        .sort({

          createdAt: -1,

        });


    return res.json({

      success: true,

      data: surat,

    });

  } catch (error) {

    console.error(
      "Gagal mengambil data surat:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Gagal mengambil data surat.",

    });

  }

});


/* =========================================================
   GET RIWAYAT SURAT
========================================================= */

router.get("/riwayat", async function (req, res) {

  try {

    const surat =

      await Surat.find({

        isDeleted: true,

      })

        .sort({

          updatedAt: -1,

        });


    return res.json({

      success: true,

      data: surat,

    });

  } catch (error) {

    console.error(
      "Gagal mengambil riwayat surat:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Gagal mengambil data riwayat surat.",

    });

  }

});


/* =========================================================
   PREVIEW ARSIP

   URL:
   /api/surat/preview/:id/:index
========================================================= */

router.get(
  "/preview/:id/:index",

  async function (req, res) {

    try {

      const id = req.params.id;

      const index =
        Number(req.params.index);


      if (!idValid(id)) {

        return res.status(400).json({

          success: false,

          message:
            "ID surat tidak valid.",

        });

      }


      if (

        !Number.isInteger(index) ||

        index < 0

      ) {

        return res.status(400).json({

          success: false,

          message:
            "Index arsip tidak valid.",

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


      const daftarArsip =

        Array.isArray(surat.arsip_surat)
          ? surat.arsip_surat
          : [];


      const arsip =

        daftarArsip[index];


      if (!arsip || !arsip.url_file) {

        return res.status(404).json({

          success: false,

          message:
            "Arsip tidak ditemukan.",

        });

      }


      const response =

        await fetch(
          arsip.url_file
        );


      if (!response.ok) {

        throw new Error(
          "Gagal mengambil file dari Cloudinary."
        );

      }


      const arrayBuffer =

        await response.arrayBuffer();


      const buffer =

        Buffer.from(arrayBuffer);


      res.setHeader(

        "Content-Type",

        arsip.tipe_file ||
        "application/octet-stream"

      );


      res.setHeader(

        "Content-Disposition",

        `inline; filename="${encodeURIComponent(
          arsip.nama_file || "arsip-surat"
        )}"`

      );


      return res.send(buffer);

    } catch (error) {

      console.error(
        "ERROR PREVIEW ARSIP:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Gagal menampilkan preview arsip.",

      });

    }

  }

);


/* =========================================================
   DOWNLOAD ARSIP

   URL:
   /api/surat/download/:id/:index
========================================================= */

router.get(
  "/download/:id/:index",

  async function (req, res) {

    try {

      const id = req.params.id;

      const index =
        Number(req.params.index);


      if (!idValid(id)) {

        return res.status(400).json({

          success: false,

          message:
            "ID surat tidak valid.",

        });

      }


      if (

        !Number.isInteger(index) ||

        index < 0

      ) {

        return res.status(400).json({

          success: false,

          message:
            "Index arsip tidak valid.",

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


      const daftarArsip =

        Array.isArray(surat.arsip_surat)
          ? surat.arsip_surat
          : [];


      const arsip =

        daftarArsip[index];


      if (!arsip || !arsip.url_file) {

        return res.status(404).json({

          success: false,

          message:
            "Arsip tidak ditemukan.",

        });

      }


      const response =

        await fetch(
          arsip.url_file
        );


      if (!response.ok) {

        throw new Error(
          "Gagal mengambil file dari Cloudinary."
        );

      }


      const arrayBuffer =

        await response.arrayBuffer();


      const buffer =

        Buffer.from(arrayBuffer);


      res.setHeader(

        "Content-Type",

        arsip.tipe_file ||
        "application/octet-stream"

      );


      res.setHeader(

        "Content-Disposition",

        `attachment; filename="${encodeURIComponent(
          arsip.nama_file || "arsip-surat"
        )}"`

      );


      return res.send(buffer);

    } catch (error) {

      console.error(
        "ERROR DOWNLOAD ARSIP:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Gagal mendownload arsip.",

      });

    }

  }

);


/* =========================================================
   GET SATU SURAT
========================================================= */

router.get("/:id", async function (req, res) {

  try {

    const id = req.params.id;


    if (!idValid(id)) {

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


    return res.json({

      success: true,

      data: surat,

    });

  } catch (error) {

    console.error(
      "Gagal mengambil surat:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Gagal mengambil surat.",

    });

  }

});


/* =========================================================
   TAMBAH SURAT + BANYAK ARSIP
========================================================= */

router.post(

  "/",

  upload.array("arsip_surat", 20),

  async function (req, res) {

    try {

      let dataArsip = [];


      if (

        req.files &&

        req.files.length > 0

      ) {

        dataArsip =

          await uploadBanyakArsip(
            req.files
          );

      }


      let diteruskanKepada = [];

      let denganHormatHarap = [];


      try {

        if (req.body.diteruskan_kepada) {

          diteruskanKepada =

            JSON.parse(
              req.body.diteruskan_kepada
            );

        }

      } catch (error) {

        diteruskanKepada = [];

      }


      try {

        if (req.body.dengan_hormat_harap) {

          denganHormatHarap =

            JSON.parse(
              req.body.dengan_hormat_harap
            );

        }

      } catch (error) {

        denganHormatHarap = [];

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


      return res.status(201).json({

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


      return res.status(500).json({

        success: false,

        message:

          error.message ||

          "Gagal menyimpan surat.",

      });

    }

  }

);


/* =========================================================
   UPDATE SURAT + TAMBAH ARSIP BARU

   ARSIP LAMA TETAP ADA
========================================================= */

router.put(

  "/:id",

  upload.array("arsip_surat", 20),

  async function (req, res) {

    try {

      const id = req.params.id;


      if (!idValid(id)) {

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


      let diteruskanKepada =

        Array.isArray(
          suratLama.diteruskan_kepada
        )

          ? suratLama.diteruskan_kepada

          : [];


      let denganHormatHarap =

        Array.isArray(
          suratLama.dengan_hormat_harap
        )

          ? suratLama.dengan_hormat_harap

          : [];


      try {

        if (req.body.diteruskan_kepada) {

          diteruskanKepada =

            JSON.parse(
              req.body.diteruskan_kepada
            );

        }

      } catch (error) {}


      try {

        if (req.body.dengan_hormat_harap) {

          denganHormatHarap =

            JSON.parse(
              req.body.dengan_hormat_harap
            );

        }

      } catch (error) {}


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


      /* ===============================================
         TAMBAHKAN FILE BARU
      =============================================== */

      if (

        req.files &&

        req.files.length > 0

      ) {

        const arsipBaru =

          await uploadBanyakArsip(
            req.files
          );


        const arsipLama =

          Array.isArray(
            suratLama.arsip_surat
          )

            ? suratLama.arsip_surat

            : [];


        dataUpdate.arsip_surat = [

          ...arsipLama,

          ...arsipBaru,

        ];

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


      return res.json({

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
   HAPUS SATU ARSIP SAJA

   DELETE:
   /api/surat/:id/arsip/:index
========================================================= */

router.delete(

  "/:id/arsip/:index",

  async function (req, res) {

    try {

      const id = req.params.id;

      const index =
        Number(req.params.index);


      if (!idValid(id)) {

        return res.status(400).json({

          success: false,

          message:
            "ID surat tidak valid.",

        });

      }


      if (

        !Number.isInteger(index) ||

        index < 0

      ) {

        return res.status(400).json({

          success: false,

          message:
            "Index arsip tidak valid.",

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


      const daftarArsip =

        Array.isArray(surat.arsip_surat)

          ? surat.arsip_surat

          : [];


      const arsip =

        daftarArsip[index];


      if (!arsip) {

        return res.status(404).json({

          success: false,

          message:
            "Arsip tidak ditemukan.",

        });

      }


      await hapusSatuArsipCloudinary(
        arsip
      );


      daftarArsip.splice(
        index,
        1
      );


      surat.arsip_surat =
        daftarArsip;


      await surat.save();


      return res.json({

        success: true,

        message:
          "Arsip berhasil dihapus.",

        data:
          surat,

      });

    } catch (error) {

      console.error(
        "Gagal menghapus arsip:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Gagal menghapus arsip.",

      });

    }

  }

);


/* =========================================================
   PULIHKAN SURAT
========================================================= */

router.put(

  "/:id/pulihkan",

  async function (req, res) {

    try {

      if (!idValid(req.params.id)) {

        return res.status(400).json({

          success: false,

          message:
            "ID surat tidak valid.",

        });

      }


      const surat =

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


      if (!surat) {

        return res.status(404).json({

          success: false,

          message:
            "Surat tidak ditemukan di riwayat.",

        });

      }


      return res.json({

        success: true,

        message:
          "Surat berhasil dipulihkan.",

        data:
          surat,

      });

    } catch (error) {

      console.error(
        "Gagal memulihkan surat:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Gagal memulihkan surat.",

      });

    }

  }

);


/* =========================================================
   HAPUS SURAT KE RIWAYAT
========================================================= */

router.delete(

  "/:id",

  async function (req, res) {

    try {

      if (!idValid(req.params.id)) {

        return res.status(400).json({

          success: false,

          message:
            "ID surat tidak valid.",

        });

      }


      const surat =

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


      if (!surat) {

        return res.status(404).json({

          success: false,

          message:
            "Surat tidak ditemukan atau sudah berada di riwayat.",

        });

      }


      return res.json({

        success: true,

        message:
          "Surat berhasil dipindahkan ke riwayat.",

        data:
          surat,

      });

    } catch (error) {

      console.error(
        "Gagal memindahkan surat:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Gagal memindahkan surat.",

      });

    }

  }

);


/* =========================================================
   HAPUS PERMANEN + SEMUA FILE CLOUDINARY
========================================================= */

router.delete(

  "/:id/permanen",

  async function (req, res) {

    try {

      if (!idValid(req.params.id)) {

        return res.status(400).json({

          success: false,

          message:
            "ID surat tidak valid.",

        });

      }


      const surat =

        await Surat.findOneAndDelete({

          _id:
            req.params.id,

          isDeleted:
            true,

        });


      if (!surat) {

        return res.status(404).json({

          success: false,

          message:
            "Surat tidak ditemukan di riwayat.",

        });

      }


      await hapusSemuaArsipCloudinary(

        Array.isArray(surat.arsip_surat)

          ? surat.arsip_surat

          : []

      );


      return res.json({

        success: true,

        message:
          "Surat dan semua arsip berhasil dihapus permanen.",

      });

    } catch (error) {

      console.error(
        "Gagal menghapus surat permanen:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Gagal menghapus surat secara permanen.",

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

      error instanceof
      multer.MulterError

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