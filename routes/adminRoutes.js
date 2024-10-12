// lms_backend-main/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const Admin = require('../controllers/adminController');
const protect = require('../middleware/adminAuthMiddleware');
const multer = require('multer');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

router.post('/register', Admin.adminRegister);
router.post('/login', Admin.adminLogin);

router.get('/profile', protect, Admin.getAdminProfile);
router.post('/add_org', protect, Admin.createUniversity);
router.get('/org', Admin.getUniversities);
router.get('/org_students', Admin.getStudentsByUniversity);

router.post('/add_course', protect, Admin.createCourse);
router.get('/courses', protect, Admin.getCourses); // Get list of courses
router.get('/courses/:id', protect, Admin.getCourseById);
router.post('/courses/:id/add-unit', protect, upload.single('scormFile'), Admin.addUnitToCourse); // Add unit to course
router.post('/courses/:id/assign', protect, Admin.assignCourseToUniversity); // Assign course to university
router.get('/courses/:courseId/units/:unitId', protect, Admin.viewUnit);

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
router.get('/profile', protect, Admin.getAdminProfile);

module.exports = router;