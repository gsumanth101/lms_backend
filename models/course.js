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
    }]
});

const Course = mongoose.model('course', courseSchema);

module.exports = Course;