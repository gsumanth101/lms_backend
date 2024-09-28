const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  answers: {
    type: Map,
    of: String
  },
  score: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Submission', SubmissionSchema);