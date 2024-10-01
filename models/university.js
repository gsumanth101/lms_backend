const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
    long_name: {
        type: String,
        required: true
    },
    short_name:{
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true
    },
    country:{
        type: String,
        required: true
    },
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course'
    }]
});

const University = mongoose.model('University', universitySchema);

module.exports = University;