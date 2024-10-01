const express = require('express');
const router = express.Router();
const Admin = require('../controllers/adminController');
const protect = require('../middleware/adminAuthMiddleware');

router.post('/register', Admin.adminRegister);
router.post('/login', Admin.adminLogin);

router.get('/profile', protect, Admin.getAdminProfile);
router.post('/add_org', protect, Admin.createUniversity);
router.get('/org',  Admin.getUniversities);

router.post('/add_course', protect, Admin.createCourse);


module.exports = router;