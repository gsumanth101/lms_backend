const facultyController = require('../controller/facultyController');
const express = require('express');

const router = express.Router();

router.post('/register', facultyController.facultyRegister);
router.post('/login', facultyController.facultyLogin);

// router.get('/all-facultys', facultyController.getAllfacultys);
// router.get('/single-faculty/:apple', facultyController.getfacultyById)

module.exports = router;