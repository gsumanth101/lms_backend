const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');

// Create a new assessment
router.post('/create', async (req, res) => {
  try {
    const { facultyId, title, questions, deadline } = req.body;
    const newAssessment = new Assessment({
      facultyId,
      title,
      questions,
      deadline
    });
    await newAssessment.save();
    res.status(201).json({ message: 'Assessment created successfully', assessment: newAssessment });
  } catch (error) {
    res.status(500).json({ message: 'Error creating assessment', error: error.message });
  }
});

// Get all assessments
router.get('/manage', async (req, res) => {
  try {
    const assessments = await Assessment.find().select('-questions.correctAnswer');
    const assessmentsWithStats = await Promise.all(assessments.map(async (assessment) => {
      const submissions = await Submission.find({ assessmentId: assessment._id });
      const totalStudents = 30; // Replace with actual total students count
      const completedCount = submissions.length;
      const pendingCount = totalStudents - completedCount;
      const averageScore = submissions.reduce((sum, sub) => sum + sub.score, 0) / completedCount || 0;

      return {
        ...assessment.toObject(),
        completedCount,
        pendingCount,
        averageScore
      };
    }));
    res.status(200).json(assessmentsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assessments', error: error.message });
  }
});

// Get a specific assessment
router.get('/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id).select('-questions.correctAnswer');
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    res.status(200).json(assessment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assessment', error: error.message });
  }
});

// Get detailed assessment data including student submissions
router.get('/:id/details', async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const submissions = await Submission.find({ assessmentId: req.params.id });
    const totalStudents = 30; // Replace with actual total students count
    const completedStudents = submissions.map(sub => ({
      studentId: sub.studentId,
      score: sub.score,
      submittedAt: sub.submittedAt
    }));
    const pendingStudents = totalStudents - completedStudents.length;

    res.status(200).json({
      assessment,
      completedStudents,
      pendingStudents,
      totalStudents
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assessment details', error: error.message });
  }
});

module.exports = router;