const express = require('express');
const router = express.Router();
const Assessment = require('../models/assessment');
const Submission = require('../models/submissions');
const mongoose = require('mongoose');

// Get all assessments for management (Move this to the top)
router.get('/manage', async (req, res) => {
  try {
    console.log('Fetching assessments for management');
    const assessments = await Assessment.find().select('-questions.correctAnswer');
    const assessmentsWithStats = await Promise.all(assessments.map(async (assessment) => {
      const submissions = await Submission.find({ assessmentId: assessment._id });
      const totalStudents = 2; // Replace with actual total students count
      const completedCount = submissions.length;
      const pendingCount = totalStudents - completedCount;
      const averageScore = completedCount > 0 
        ? submissions.reduce((sum, sub) => sum + sub.score, 0) / completedCount 
        : 0;

      return {
        ...assessment.toObject(),
        completedCount,
        pendingCount,
        averageScore
      };
    }));
    console.log('Assessments found:', assessmentsWithStats);
    res.status(200).json(assessmentsWithStats);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ message: 'Error fetching assessments', error: error.toString() });
  }
});

router.get('/student', async (req, res) => {
  try {
    console.log('Fetching assessments for students');
    const currentDate = new Date();
    const assessments = await Assessment.find({ 
      deadline: { $gt: currentDate }
    }).select('title deadline');
    
    console.log('Assessments found:', assessments);
    res.status(200).json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ message: 'Error fetching assessments', error: error.toString() });
  }
});

// Submit assessment (Move this route before the '/:id' route)
router.post('/submit', async (req, res) => {
  try {
    console.log('Received submission request:', req.body);
    const { assessmentId, studentId, answers } = req.body;
    
    if (!assessmentId || !studentId || !answers) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    console.log('Assessment found:', assessment);

    let score = 0;
    assessment.questions.forEach(question => {
      const userAnswer = answers[question._id.toString()];
      console.log(`Question ${question._id}: User answer: ${userAnswer}, Correct answer: ${question.correctAnswer}`);
      if (userAnswer === question.correctAnswer) {
        score += question.marks;
      }
    });

    console.log('Calculated score:', score);

    const submission = new Submission({
      studentId,
      assessmentId,
      answers,
      score
    });
    await submission.save();
    console.log('Submission saved:', submission);

    res.status(201).json({ message: 'Assessment submitted successfully', score });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ message: 'Error submitting assessment', error: error.toString() });
  }
});

// Get a specific assessment (Keep this after the '/submit' route)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Missing assessment ID' });
    }

    const assessment = await Assessment.findById(id);
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
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Missing assessment ID' });
    }

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const submissions = await Submission.find({ assessmentId: id });
    const totalStudents = 30; // Replace with actual total students count
    const completedStudents = submissions.map(sub => ({
      studentId: sub.studentId,
      score: sub.score,
      submittedAt: sub.createdAt.toISOString() // Use createdAt as the submission time
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

// Create a new assessment
router.post('/create', async (req, res) => {
  try {
    const { facultyId, title, questions, deadline } = req.body;
    if (!facultyId || !title || !questions || !deadline) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

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

module.exports = router;