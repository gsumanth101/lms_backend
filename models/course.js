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
    universities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'university'
    }],
    content: [{
        unitNumber: {
            type: Number,
            required: true
        },
        unitTitle: {
            type: String,
            required: true
        },
        unitDescription: {
            type: String,
            required: true
        },
        materials: [{
            type: String
        }]
    }],
    streams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'stream'
    }]
});

const Course = mongoose.model('course', courseSchema);

module.exports = Course;