const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name : {type: String, required: true},
    image : {type : String}
});

module.exports = mongoose.model('UserChat', userSchema);
