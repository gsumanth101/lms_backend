const userController = require('../controller/userController');
const express = require('express');

const router = express.Router();

router.post('/register', userController.userRegister);
router.post('/login', userController.userLogin);

// router.get('/all-users', userController.getAllusers);
// router.get('/single-user/:apple', userController.getuserById)

module.exports = router;