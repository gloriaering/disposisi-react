const mongoose = require("mongoose");


/* =========================================================
   SCHEMA ARSIP SURAT
========================================================= */

const arsipSchema = new mongoose.Schema(

  {
    nama_file: {
      type: String,
      default: "",
    },

    url_file: {
      type: String,
      default: "",
    },

    public_id: {
      type: String,
      default: "",
    },

    tipe_file: {
      type: String,
      default: "",
    },

    resource_type: {
      type: String,
      default: "",
    },

  },

  {
    _id: false,
  }

);


/* =========================================================
   SCHEMA SURAT
========================================================= */

const suratSchema = new mongoose.Schema(

  {

    nomor_surat: {
      type: String,
      required: true,
    },

    asal_surat: {
      type: String,
      required: true,
    },

    tanggal_surat: {
      type: String,
      required: true,
    },

    nomor_agenda: {
      type: String,
      default: "",
    },

    tanggal_diterima: {
      type: String,
      required: true,
    },

    jam_diterima: {
      type: String,
      default: "",
    },

    perihal: {
      type: String,
      required: true,
    },

    sifat_surat: {
      type: String,
      default: "",
    },


    /* DITERUSKAN KEPADA */

    diteruskan_kepada: {

      type: [String],

      default: [],

    },


    /* DENGAN HORMAT HARAP */

    dengan_hormat_harap: {

      type: [String],

      default: [],

    },


    /* CATATAN */

    catatan: {

      type: String,

      default: "",

    },


    /* =====================================================
       BANYAK ARSIP
    ===================================================== */

    arsip_surat: {

      type: [arsipSchema],

      default: [],

    },


    /* =====================================================
       STATUS HAPUS
    ===================================================== */

    isDeleted: {

      type: Boolean,

      default: false,

    },

  },


  /* =======================================================
     CREATED AT & UPDATED AT
  ======================================================= */

  {

    timestamps: true,

  }

);


/* =========================================================
   MODEL
========================================================= */

const Surat = mongoose.model(

  "Surat",

  suratSchema

);


module.exports = Surat;