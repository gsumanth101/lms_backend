const express = require('express');
const router = express.Router();
const Spoc = require('../controllers/spocController');
const protect = require('../middleware/spocAuthMiddleware');

router.post('/login', Spoc.adminLogin);

router.get('/profile', protect, Spoc.getSpocProfile);
router.post('/create_faculty', protect, Spoc.createFaculty);
router.get('/faculty', protect, Spoc.getFacultyByUniversity);

module.exports = router;