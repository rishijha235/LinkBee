require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const loginRouter = require("./Routes/loginRoute");
const signupRouter = require("./Routes/signupRoute");
const userRoute = require("./Routes/userRoutes");
const connectToMongoDB = require("./connect");
const userModel = require("./models/userModel");
const cookieParser = require("cookie-parser");
const Multer = require("multer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: 'dhs2koq4i',
  api_key: '352246637179152',
  api_secret: "qV_JdoxbrjMtQYeTEZWVYPdFqXU",
});

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* ------------------- FIX: Place CORS at the very top ------------------- */
app.use(cors({
  origin: ["http://localhost:5173", "https://link-bee-eight.vercel.app"], // frontend URL
  credentials: true
}));

// Handle preflight requests explicitly
app.options("*", cors({
  origin: "http://localhost:5173",
  credentials: true
}));

/* ---------------------------------------------------------------------- */


connectToMongoDB(process.env.MONGO_URL);

// Image upload setup
const storage = Multer.memoryStorage();
const upload = Multer({ storage });

async function handleUpload(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
  });
  return res;
}

app.post("/upload", upload.single("avatar"), async (req, res) => {
  console.log(req.body);
  const { userID } = req.body;
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const cldRes = await handleUpload(dataURI);

    await userModel.findOneAndUpdate({ userID }, {
      imageUrl: cldRes.secure_url,
    });

    res.status(200).send("Image uploaded successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

// Routes
app.use("/login", loginRouter);
app.use("/signup", signupRouter);
app.use("/user", userRoute);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/", (req, res) => {
  res.send("Your backend is not live");
});

app.listen(PORT, () => {
  console.log("listening to the server", PORT);
});
