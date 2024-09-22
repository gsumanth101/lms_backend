const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Spoc = require('../models/spoc'); 
const nodemailer = require('nodemailer');
const crypto = require('crypto');


// Login SPOC
const loginSpoc = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const spoc = await Spoc.findOne({ email });
        if (!spoc) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const isMatch = await bcrypt.compare(password, spoc.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign(
            { id: spoc._id, email: spoc.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            spoc: {
                id: spoc._id,
                name: spoc.name,
                email: spoc.email,
                phone: spoc.phone,
                university: spoc.university
            }
        });
    } catch (error) {
        console.error('Error logging in SPOC:', error);
        res.status(500).json({ message: 'Error logging in SPOC', error: error.message });
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

module.exports = {
    loginSpoc,
    getSpocDetails,
    forgotPassword,
    resetPassword
};
