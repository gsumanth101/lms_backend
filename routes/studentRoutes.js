const express = require('express');

const router = express.Router();
const Student = require('../controllers/studentController');
const protect = require('../middleware/studentAuthMiddleware');

router.post('/login', Student.studentLogin);
router.get('/profile', protect, Student.getStudentProfile);

router.get('/courses', Student.getCourses); // Get list of courses
router.get('/my-courses', Student.getStudentCourses);
router.get('/courses/:id',Student.getCourseById);

module.exports = router;