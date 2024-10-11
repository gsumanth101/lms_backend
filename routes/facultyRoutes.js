const express = require('express');
const router = express.Router();
const Faculty = require('../controllers/facultyController');
const protect = require('../middleware/facultyAuthMiddleware');

router.post('/login', Faculty.facultyLogin);

router.get('/profile', protect, Faculty.getFacultyProfile);
// router.post('/update_profile', protect, Faculty.updateFacultyProfile);
// router.post('/change_password', protect, Faculty.changeFacultyPassword);
// router.post('/forgot_password', Faculty.facultyForgotPassword);
// // router.post('/reset_password', Faculty.facultyResetPassword);
// router.post('/upload_faculty', protect, Faculty.);
router.get('/courses', protect, Faculty.getMyCourses);   

module.exports = router;
