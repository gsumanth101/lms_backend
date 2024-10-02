const mongoose = require('mongoose');
const { stream } = require('xlsx');

const FacultySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    section:{
        type: String,
        required: true
    },
    stream:{
        type: String,
        required: true
    },
    year:{
        type: String,
        required: true
    },
    department:{
        type: String,
        required: true
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'university',
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
});

const Faculty = mongoose.model('Faculty', FacultySchema);

module.exports = Faculty;
