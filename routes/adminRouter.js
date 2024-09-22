const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin/adminController');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Define the route for bulk uploading users
router.post('/upload-users', upload.single('file'), adminController.bulkUploadUsers);
router.post('/users', adminController.createUser);

router.post('/register', adminController.adminRegister);
router.post('/login', adminController.adminLogin);
router.post('/add_org', adminController.createUniversity);
router.post('/add_course', adminController.createCourse);
router.get('/org', adminController.getUniversities);
router.get('/courses', adminController.getCourses);
router.get('/user/:adminId', adminController.getadminById);
router.get('/users/:universityId', adminController.getUsersByUniversity);
router.get('/org/:universityId', adminController.getUniversityById);
router.put('/org/:universityId', adminController.updateUniversity);
router.get('/users/:userId', adminController.getUserById);
router.put('/users/:userId', adminController.updateUser);
router.put('/universities/:id', adminController.editUniversity);


router.get('/users/download', adminController.downloadUsersExcel);

// Routes for SPOC management
router.post('/spocs', adminController.createSpoc);
router.put('/spocs/:spocId', adminController.editSpoc);
router.delete('/spocs/:spocId', adminController.deleteSpoc);

module.exports = router;