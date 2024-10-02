const Spoc = require('../models/spoc');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Faculty = require('../models/faculty');
const dotenv = require('dotenv');
dotenv.config();

const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        let spoc = await Spoc.findOne({ email });
        if (!spoc) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, spoc.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            spoc: {
                id: spoc.id,
            },
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(200).json({ email, token });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
}

const getSpocProfile = async (req, res) => {
    try {
        const spoc = await Spoc.findById(req.spoc.id).select('-password');
        res.json(spoc);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
}




const createFaculty = async (req, res) => {
    const { name, email, phone, section, stream, year, department, university, password } = req.body;

    if (!name || !email || !phone || !section || !stream || !year || !department || !university || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        let faculty = await Faculty.findOne({ email });
        if (faculty) {
            return res.status(400).json({ msg: 'Faculty already exists' });
        }

        faculty = new Faculty({
            name,
            email,
            phone,
            section,
            stream,
            year,
            department,
            university,
            password
        });

        const salt = await bcrypt.genSalt(10);
        faculty.password = await bcrypt.hash(password, salt);

        await faculty.save();

        const payload = {
            faculty: {
                id: faculty.id,
            },
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        // Send email to the new faculty
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to SmartLMS',
            text: `Hello ${name},\n\nWelcome to SmartLMS!\n\nYou have been successfully registered as a faculty member. Here are your details:\n\nEmail: ${email}\nPassword: ${password}\nSection: ${section}\nStream: ${stream}\nYear: ${year}\n\nPlease log in to your account and change your password as soon as possible.\n\nBest regards,\nSmartLMS Team`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(`Error sending email to ${email}:`, error);
            } else {
                console.log(`Email sent to ${email}:`, info.response);
            }
        });

        res.status(200).json({ email, token });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    adminLogin,
    getSpocProfile,
    createFaculty
}
