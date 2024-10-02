const express = require('express');
const router = express.Router();
const Admin = require('../controllers/adminController');
const protect = require('../middleware/adminAuthMiddleware');

router.post('/register', Admin.adminRegister);
router.post('/login', Admin.adminLogin);

router.get('/profile', protect, Admin.getAdminProfile);
router.post('/add_org', protect, Admin.createUniversity);
router.get('/org',  Admin.getUniversities);
router.get('/org_students',  Admin.getStudentsByUniversity);

router.post('/add_course', protect, Admin.createCourse);
router.post('/upload-users', protect, Admin.bulkUploadStudents);
router.post('/create-student', protect, Admin.createStudent);
router.post('/create-spoc', protect, Admin.createSpoc);


module.exports = router;