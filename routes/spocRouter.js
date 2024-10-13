const express = require('express');
const router = express.Router();
const Spoc = require('../controllers/spocController');
const protect = require('../middleware/spocAuthMiddleware');

router.post('/login', Spoc.adminLogin);

router.get('/profile', protect, Spoc.getSpocProfile);
router.post('/create_faculty',  Spoc.createFaculty);
router.get('/faculty', protect, Spoc.getFacultyByUniversity);
router.post('/upload_faculty',protect,Spoc.uploadFaculty);

router.get('/student_count', Spoc.getStudentCountByUniversity);


module.exports = router;