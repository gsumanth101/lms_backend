const express = require('express');
const router = express.Router();
const spocRouter = require('../controller/spocController');


router.post('/login', spocRouter.loginSpoc);
router.get('/spoc/:id', spocRouter.getSpocDetails);
router.post('/forgot-password', spocRouter.forgotPassword);
router.post('/reset-password', spocRouter.resetPassword);
router.get('/counts', spocRouter.getCounts);
router.get('/students', spocRouter.getStudents);
router.post('/faculty', spocRouter.createFaculty);


module.exports = router;