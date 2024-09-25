const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the User schema
const userSchema = new Schema({
    regd_no: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    section:{
        type: String,
        required: true
    },
    stream: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    dept:{
        type: String,
        required: true
    },
    university: {
        type: Schema.Types.ObjectId,
        ref: 'university',
        required: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Create the User model
const User = mongoose.model('user', userSchema);

module.exports = User;