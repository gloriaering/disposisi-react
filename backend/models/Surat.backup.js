const mongoose = require("mongoose");

const suratSchema = new mongoose.Schema(
  {
    nomor_surat: {
      type: String,
      required: true,
      trim: true,
    },

    asal_surat: {
      type: String,
      required: true,
      trim: true,
    },

    tanggal_surat: {
      type: String,
      required: true,
      trim: true,
    },

    nomor_agenda: {
      type: String,
      required: true,
      trim: true,
    },

    tanggal_diterima: {
      type: String,
      required: true,
      trim: true,
    },

    jam_diterima: {
      type: String,
      required: true,
      trim: true,
    },

    perihal: {
      type: String,
      required: true,
      trim: true,
    },

    /*
      SIFAT SURAT

      Tidak lagi wajib diisi dari komputer.
      Nilainya boleh kosong karena akan
      diisi manual pada lembar disposisi.
    */
    sifat_surat: {
      type: String,
      default: "",
      trim: true,
    },

    /*
      DITERUSKAN KEPADA

      Akan dicentang manual pada lembar disposisi.
    */
    diteruskan_kepada: {
      type: [String],
      default: [],
    },

    /*
      DENGAN HORMAT HARAP

      Akan dicentang manual pada lembar disposisi.
    */
    dengan_hormat_harap: {
      type: [String],
      default: [],
    },

    /*
      CATATAN

      Akan ditulis manual pada lembar cetak.
    */
    catatan: {
      type: String,
      default: "",
      trim: true,
    },

    /*
      STATUS HAPUS

      false = surat masih aktif
      true  = surat masuk riwayat

      Surat tidak langsung dihapus dari MongoDB.
    */
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Surat", suratSchema);