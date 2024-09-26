const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Spoc = require('../models/spoc'); 
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/user'); // Ensure User model is imported
const Faculty = require('../models/faculty');
const Course = require('../models/course');


// Login SPOC
const loginSpoc = async (req, res) => {
    try {
        const { email, password } = req.body;
        const errorMsg = 'Auth failed: email or password is wrong';

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const spoc = await Spoc.findOne({ email });
        if (!spoc) {
            return res.status(403).json({ success: false, message: errorMsg });
        }

        const isMatch = await bcrypt.compare(password, spoc.password);
        if (!isMatch) {
            return res.status(403).json({ success: false, message: errorMsg });
        }

        const token = jwt.sign(
            { id: spoc._id, email: spoc.email },
            process.env.JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '5h' }
        );

        // Start session
        req.session.user = {
            id: spoc._id,
            name: spoc.name,
            email: spoc.email,
            phone: spoc.phone,
            university: spoc.university
        };

        // Send session ID as a cookie
        res.cookie('sessionId', req.sessionID, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            spoc: req.session.user
        });
    } catch (error) {
        console.error('Error logging in SPOC:', error);
        res.status(500).json({ success: false, message: 'Error logging in SPOC', error: error.message });
    }
};

const getStudentCount = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.university) {
            return res.status(401).json({ message: 'Unauthorized: No session available' });
        }

        const universityId = req.session.user.university;
        const studentCount = await Student.countDocuments({ university: universityId });

        res.status(200).json({ studentCount: Number(studentCount) });
    } catch (error) {
        console.error('Error fetching student count:', error);
        res.status(500).json({ message: 'Error fetching student count', error: error.message });
    }
};

const getFacultyCount = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.university) {
            return res.status(401).json({ message: 'Unauthorized: No session available' });
        }

        const universityId = req.session.user.university;
        const facultyCount = await Faculty.countDocuments({ university: universityId });

        res.status(200).json({ facultyCount: Number(facultyCount) });
    } catch (error) {
        console.error('Error fetching faculty count:', error);
        res.status(500).json({ message: 'Error fetching faculty count', error: error.message });
    }
};

const getCourseCount = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.university) {
            return res.status(401).json({ message: 'Unauthorized: No session available' });
        }

        const universityId = req.session.user.university;
        const courseCount = await Course.countDocuments({ university: universityId });

        res.status(200).json({ courseCount: Number(courseCount) });
    } catch (error) {
        console.error('Error fetching course count:', error);
        res.status(500).json({ message: 'Error fetching course count', error: error.message });
    }
};

// Get SPOC Details
const getSpocDetails = async (req, res) => {
    try {
        const spocId = req.params.id;

        const spoc = await Spoc.findById(spocId);
        if (!spoc) {
            return res.status(404).json({ message: 'SPOC not found' });
        }

        res.json({
            id: spoc._id,
            name: spoc.name,
            email: spoc.email,
            phone: spoc.phone,
            university: spoc.university
        });
    } catch (error) {
        console.error('Error getting SPOC details:', error);
        res.status(500).json({ message: 'Error getting SPOC details', error: error.message });
    }
};


// Configure the email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Forgot Password - Generate Reset Token and Send Email
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const spoc = await Spoc.findOne({ email });
        if (!spoc) {
            return res.status(404).json({ message: 'SPOC not found' });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        spoc.resetPasswordToken = resetToken;
        spoc.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await spoc.save();

        // Send reset link to the user's email
        const resetLink = `${process.env.BASE_URL}/reset-password/${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            text: `Hello ${spoc.name},\n\nYou requested a password reset. Please click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nSmartLMS Team`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(`Error sending email to ${email}:`, error);
                return res.status(500).json({ message: 'Error sending email', error: error.message });
            } else {
                console.log(`Email sent to ${email}:`, info.response);
                res.json({ message: 'Password reset link sent to email' });
            }
        });
    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).json({ message: 'Error in forgot password', error: error.message });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        const spoc = await Spoc.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!spoc) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash the new password and save it
        const salt = await bcrypt.genSalt(10);
        spoc.password = await bcrypt.hash(newPassword, salt);
        spoc.resetPasswordToken = undefined;
        spoc.resetPasswordExpires = undefined;

        await spoc.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
};







const createFaculty = async (req, res) => {
    try {
        const { name, email, section, password } = req.body;

        // Check if session exists
        if (!req.session.user || !req.session.user.university) {
            return res.status(401).json({ message: 'Unauthorized: No session available' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new faculty member
        const newFaculty = new Faculty({
            name,
            email,
            section,
            password: hashedPassword
        });

        // Save the faculty member to the database
        await newFaculty.save();

        // Send email after successful registration
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Faculty Registration Successful',
            text: `Hello ${name},\n\nYour registration as a faculty member has been successful.\n\nBest regards,\nYour Team`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        res.status(201).json({ message: 'Faculty member created successfully', faculty: newFaculty });
    } catch (error) {
        console.error('Error creating faculty member:', error);
        res.status(500).json({ message: 'Error creating faculty member', error: error.message });
    }
};

// Export functions


const getStudents = async (req, res) => {
    try {
        // Check if session exists
        if (!req.session.user || !req.session.user.university) {
            return res.status(401).json({ message: 'Unauthorized: No session available' });
        }

        // Retrieve the university ID from the session
        const universityId = req.session.user.university;

        // Retrieve the list of students in the university
        const students = await User.find({ university: universityId });

        res.json({
            students
        });
    } catch (error) {
        console.error('Error retrieving students:', error);
        res.status(500).json({ message: 'Error retrieving students', error: error.message });
    }
};

module.exports = {
    loginSpoc,
    getSpocDetails,
    getStudents,
    createFaculty,
    getStudentCount,
    getFacultyCount,
    getCourseCount,
    resetPassword,
    forgotPassword
};