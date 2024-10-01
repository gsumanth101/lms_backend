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
        ref: 'University'
    }]
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;