const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const Message = require('./models/Message');
const User = require('./models/User');
const auth = require('./middleware/auth');

dotenv.config();

const app = express();
const server = http.createServer(app);

// const io = socketIo(server, {
//   cors: {
//     origin: 'http://localhost:5173',
//     methods: ['GET', 'POST'],
//     credentials: true
//   }
// });

const allowedOrigins = [
  "http://localhost:5173", // Development
  "https://chatappfrontendkal.netlify.app/", // Deployed frontend
];

const io = require("socket.io")(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});


// Middleware
app.use(bodyParser.json());

// CORS options
const corsOptions = {
  origin:  'https://chatappfrontendkal.netlify.app/', // React app URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Make sure 'Authorization' is included
};

app.use(cors(corsOptions));


app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));

// Socket.IO connection
let users = {}; // Store connected users

// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);

//   socket.on('register', (username) => {
//     users[username] = socket.id;
//   });

//   socket.on('send_message', async (data) => {
//     const { sender, receiver, message } = data;
//     const receiverSocketId = users[receiver];

//     // Emit message to both sender and receiver
//     io.to(socket.id).emit('receive_message', data);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit('receive_message', data);
//     }

//     // Save message to the database
//     try {
//       const newMessage = new Message({ sender, receiver, message });
//       await newMessage.save();
//     } catch (err) {
//       console.error('Error saving message:', err);
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("send_message", async (data) => {
    try {
      const newMessage = new Message({
        sender: data.sender,
        receiver: data.receiver,
        message: data.message,
        timestamp: new Date(),
      });

      await newMessage.save(); // Store message in MongoDB

      // Send message to the receiver
      io.emit("receive_message", newMessage);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});




// Database connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Database connection error:', err));

// Routes
// Get messages between two users (JWT Protected)
app.get('/messages/:username', auth, async (req, res) => {
  const { username } = req.params;
  const currentUser = req.user.username; // Get the username from the decoded token

  try {
    const messages = await Message.find({
      $or: [
        { sender: currentUser, receiver: username },
        { sender: username, receiver: currentUser },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Get all users (JWT Protected)
app.get('/users', auth, async (req, res) => {
  try {
    // For simplicity, just returning an example list of users
    const users = await User.find(); // Replace this with the actual User model query
    res.json(users);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Import routes (e.g., for authentication)
require('./routes/auth')(app);

app.get('/', (req, res) => {
  res.send('Server is running');
});


app.post('/send_message', auth, async (req, res) => {
    const { sender, receiver, message } = req.body;
    
    try {
      const newMessage = new Message({ sender, receiver, message });
      await newMessage.save();
      res.json(newMessage);
    } catch (error) {
      console.error('Error saving message:', error);
      res.status(500).json({ message: 'Failed to save message' });
    }
  });
  


// Server setup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
