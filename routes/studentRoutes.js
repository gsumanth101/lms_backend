const express = require('express');

const router = express.Router();
const Student = require('../controllers/studentController');
const protect = require('../middleware/studentAuthMiddleware');

router.post('/login', Student.studentLogin);
router.get('/profile', protect, Student.getStudentProfile);

router.get('/courses', protect, Student.getCourses); // Get list of courses
router.get('/courses/:id', protect, Student.getCourseById);

module.exports = router;