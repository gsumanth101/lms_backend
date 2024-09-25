const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const authenticate = require('../middleware/authenticate');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Public route
router.post('/login', adminController.adminLogin);

//middleware
router.use(authenticate);

// Protected routes
router.post('/upload-users', upload.single('file'), adminController.bulkUploadUsers);
router.post('/users', adminController.createUser);

router.post('/register', adminController.adminRegister);

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

router.post('/spocs', adminController.createSpoc);
router.get('/spocs', adminController.getAllSpocs);
router.put('/spocs/:spocId', adminController.editSpoc);
router.delete('/spocs/:spocId', adminController.deleteSpoc);

router.get('/universities/count', adminController.getTotalUniversities);
router.get('/users/count', adminController.getTotalUsers);
router.get('/spocs/count', adminController.getTotalSpocs);
router.get('/courses/count', adminController.getTotalCourses);

router.get('/logout', adminController.adminLogout);

module.exports = router;