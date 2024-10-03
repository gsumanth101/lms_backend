const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  facultyId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: String,
    marks: Number
  }],
  deadline: {
    type: Date,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', AssessmentSchema);