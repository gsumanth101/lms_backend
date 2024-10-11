const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    universityDetails: [{
        university: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'University',
            required: true
        },
        year: {
            type: Number,
            required: true
        },
        stream: {
            type: String,
            required: true
        }
    }]
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;