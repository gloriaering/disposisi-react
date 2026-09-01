require("dotenv").config();

const cloudinary = require("./cloudinary");

cloudinary.uploader
  .upload(
    "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    {
      folder: "disposisi-test",
    }
  )
  .then((result) => {
    console.log("✅ Cloudinary berhasil terhubung!");
    console.log("URL:", result.secure_url);
  })
  .catch((error) => {
    console.error("❌ Cloudinary gagal terhubung!");
    console.error(error.message);
  });