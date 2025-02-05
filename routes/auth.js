const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const cors = require('cors'); // Import the cors package
const multer = require("multer");

require("dotenv").config();

const cloudinary = require("../config/CloudinaryConfig");

module.exports = (app) => {
  // Enable CORS for all routes or you can configure it for specific routes
  app.use(cors({
    origin: 'http://localhost:5173', // Allow frontend origin (replace with your frontend URL)
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'], // Ensure the correct headers are allowed
  }));

  // Login route
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
   
  
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send('Invalid credentials');
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });

  // Multer setup for memory storage
  const storage = multer.memoryStorage();
  const upload = multer({ storage });
  // Register route
  app.post('/register',upload.single("image"), async (req, res) => {
    try {
      const {name, username, password} = req.body;
  
      if (!req.file) {
        return res.status(400).json({ message: "Image is required" });
      }
      // Example: Check if username already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).send('Username already taken');
      }

      const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: "user_profiles", resource_type: "image" },
              (error, result) => {
                if (error) {
                  console.error("❌ Cloudinary Upload Error:", error.message);
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            ).end(req.file.buffer);
          });
  
      // Example: Save the new user (hash password before saving)
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({name, username, password: hashedPassword ,image:uploadResult.secure_url});
  
      await newUser.save();
  
      res.status(201).send('User registered successfully');
    } catch (error) {
      console.error(error); // Log error for debugging
      res.status(500).send('Internal server error');
    }
  });
  
};
