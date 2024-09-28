const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  studentId: String,
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
  answers: [String],
  score: Number,
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', SubmissionSchema);