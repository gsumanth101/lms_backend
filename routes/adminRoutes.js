const express = require('express');
const router = express.Router();
const Admin = require('../controllers/adminController');
const protect = require('../middleware/adminAuthMiddleware');
const University = require('../models/university');

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
router.post('/update_password', protect, Admin.updateAdminPassword);

router.get('/university_count', Admin.getUniversityCount);
router.get('/course_count', Admin.getCourseCount);
router.get('/student_count', Admin.getStudentCount);
router.get('/spoc_count', Admin.getSpocCount);
router.get('/faculty_count', Admin.getFacultyCount);

router.get('/spocs', Admin.getAllSpocs);


// router.get('/dashboard', Admin.getDashboardData);


router.get('/login', (req, res) => {
    res.render('admin/login');
});

// router.use(protect);
router.get('/dashboard', protect, Admin.renderDashboard);




module.exports = router;