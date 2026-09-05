const jwt = require("jsonwebtoken");


/* =========================================================
   MIDDLEWARE CEK LOGIN
========================================================= */

const authMiddleware = (req, res, next) => {

  try {

    // AMBIL HEADER AUTHORIZATION

    const authHeader = req.headers.authorization;


    // CEK TOKEN ADA ATAU TIDAK

    if (!authHeader) {

      return res.status(401).json({

        success: false,

        message: "Akses ditolak. Silakan login terlebih dahulu.",

      });

    }


    // FORMAT:
    // Bearer TOKEN

    const token = authHeader.split(" ")[1];


    if (!token) {

      return res.status(401).json({

        success: false,

        message: "Token tidak ditemukan.",

      });

    }


    // CEK JWT SECRET

    if (!process.env.JWT_SECRET) {

      return res.status(500).json({

        success: false,

        message: "JWT_SECRET belum diatur.",

      });

    }


    // VERIFIKASI TOKEN

    const decoded = jwt.verify(

      token,

      process.env.JWT_SECRET

    );


    // SIMPAN DATA USER

    req.user = decoded;


    // LANJUTKAN KE ROUTE

    next();

  } catch (error) {

    return res.status(401).json({

      success: false,

      message: "Token tidak valid atau sudah berakhir.",

    });

  }

};


module.exports = authMiddleware;