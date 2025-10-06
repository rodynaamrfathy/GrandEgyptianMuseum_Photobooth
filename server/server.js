require("dotenv").config(); // Load .env file
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();

// Enable CORS
app.use(cors());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to store images on Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads", // Folder name in Cloudinary
    format: async (req, file) => "png", // Convert all images to PNG
    public_id: (req, file) => `image_${Date.now()}`, // Create a predictable ID
  },
});

const upload = multer({ storage });

// Upload Image Endpoint
app.post("/api/upload-image", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  const imageUrl = req.file.path; // Cloudinary URL

  // Return both imageUrl and publicId in the response
  res.json({
    imageUrl: imageUrl
  });
});

// Retrieve Uploaded Image by Public ID
app.get("/api/upload-image/:publicId", async (req, res) => {
  const { publicId } = req.params; // Get image public ID from URL

  try {
    const image = await cloudinary.api.resource(publicId); // Fetch image using public_id
    res.json({ imageUrl: image.secure_url }); // Return the image URL
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch image", error });
  }
});

// Verify Cloudinary connection
cloudinary.api.ping()
  .then(() => {
    console.log("Cloudinary connected successfully!");
  })
  .catch((err) => {
    console.error("Cloudinary connection failed:", err);
  });

// Add this line to make the server listen on a port
const port = process.env.PORT || 3000; // Use port from environment or default to 3000
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app; // For deployment to Vercel
