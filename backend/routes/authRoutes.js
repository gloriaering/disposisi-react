const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

const User = require("../models/User");


/* =========================================================
   REGISTER / BUAT USER
========================================================= */

router.post("/register", async (req, res) => {

  try {

    const { username, password, bidang } = req.body;


    // CEK INPUT

    if (!username || !password || !bidang) {

      return res.status(400).json({
        success: false,
        message: "Username, password, dan bidang wajib diisi.",
      });

    }


    // CEK USER SUDAH ADA

    const userSudahAda = await User.findOne({
      username: username.trim(),
    });


    if (userSudahAda) {

      return res.status(400).json({
        success: false,
        message: "Username sudah digunakan.",
      });

    }


    // ENKRIPSI PASSWORD

    const passwordHash = await bcrypt.hash(
      password,
      10
    );


    // BUAT USER BARU

    const userBaru = await User.create({

      username: username.trim(),

      password: passwordHash,

      bidang: bidang.trim(),

    });


    return res.status(201).json({

      success: true,

      message: "User berhasil dibuat.",

      user: {

        id: userBaru._id,

        username: userBaru.username,

        bidang: userBaru.bidang,

      },

    });

  } catch (error) {

    console.error("REGISTER ERROR:", error);

    return res.status(500).json({

      success: false,

      message: "Gagal membuat user.",

    });

  }

});


/* =========================================================
   LOGIN
========================================================= */

router.post("/login", async (req, res) => {

  try {

    const { username, password } = req.body;


    // CEK INPUT

    if (!username || !password) {

      return res.status(400).json({

        success: false,

        message: "Username dan password wajib diisi.",

      });

    }


    // CARI USER

    const user = await User.findOne({

      username: username.trim(),

    });


    if (!user) {

      return res.status(401).json({

        success: false,

        message: "Username atau password salah.",

      });

    }


    // CEK PASSWORD

    const passwordBenar = await bcrypt.compare(

      password,

      user.password

    );


    if (!passwordBenar) {

      return res.status(401).json({

        success: false,

        message: "Username atau password salah.",

      });

    }


    // CEK JWT SECRET

    if (!process.env.JWT_SECRET) {

      return res.status(500).json({

        success: false,

        message: "JWT_SECRET belum diatur di server.",

      });

    }


    // BUAT TOKEN

    const token = jwt.sign(

      {

        id: user._id,

        username: user.username,

        bidang: user.bidang,

      },

      process.env.JWT_SECRET,

      {

        expiresIn: "1d",

      }

    );


    return res.json({

      success: true,

      message: "Login berhasil.",

      token,

      user: {

        id: user._id,

        username: user.username,

        bidang: user.bidang,

      },

    });

  } catch (error) {

    console.error("LOGIN ERROR:", error);

    return res.status(500).json({

      success: false,

      message: "Terjadi kesalahan saat login.",

    });

  }

});


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;