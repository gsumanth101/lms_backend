const express = require('express');

const router = express.Router();
const Student = require('../controllers/studentController');
const protect = require('../middleware/studentAuthMiddleware');

router.post('/login', Student.studentLogin);
router.get('/profile', protect, Student.getStudentProfile);

module.exports = router;