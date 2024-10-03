// models/Meeting.js

const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: String,
    url: String,
    section: String,
    facultyId: String,   // Faculty ID or unique identifier
    facultyName: String, // Faculty name
    createdAt: { type: Date, default: Date.now },
});

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;
