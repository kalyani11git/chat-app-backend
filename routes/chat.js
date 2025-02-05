const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

// Add this to your routes
module.exports = (app) => {
app.get('/users', async (req, res) => {
    const users = await User.find(); // Or filter based on the users' data
    res.json(users);
});


// Get messages between two users
app.get('/messages/:username', async (req, res) => {
    const { username } = req.params;
    const currentUser = 'currentUser'; // Get current logged-in user from token
    const messages = await Message.find({
        $or: [
            { sender: currentUser, receiver: username },
            { sender: username, receiver: currentUser }
        ]
    }).sort({ timestamp: 1 });
    res.json(messages);
})


}
