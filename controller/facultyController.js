const faculty = require('../models/faculty');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');






const facultyRegister = async (req, res) => {
    const { name, email, section, password } = req.body;
    try {
        // Check if session exists

        // Retrieve the university ID from the session
        const universityId = req.session.user.university;

        const facultyEmail = await Faculty.findOne({ email });
        if (facultyEmail) {
            return res.status(400).json("Email already taken");
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newFaculty = new Faculty({
            name,
            email,
            section,
            password: hashedPassword,
            university: universityId
        });
        await newFaculty.save();

        res.status(201).json({ message: "Faculty registered successfully" });
        console.log('registered');

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const facultyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const facultyEmail = await faculty.findOne({ email });
        const errorMsg = 'Auth failed: email or password is wrong';

        if (!facultyEmail) {
            return res.status(403).json({ message: errorMsg, success: false });
        }

        const isPassEqual = await bcrypt.compare(password, facultyEmail.password);
        if (!isPassEqual) {
            return res.status(403).json({ message: errorMsg, success: false });
        }

        const jwtToken = jwt.sign(
            { facultyId: facultyEmail._id },
            process.env.JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '5h' }
        );

        // Start session
        req.session.user = {
            id: facultyEmail._id,
            email: facultyEmail.email,
            name: facultyEmail.name
        };

        // Send session ID as a cookie
        res.cookie('sessionId', req.sessionID, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });

        res.status(200).json({
            message: "Login Success",
            success: true,
            jwtToken,
            facultyId: facultyEmail._id,
            email: facultyEmail.email,
            name: facultyEmail.name
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};


const getAllfacultys = async(req, res) => {
    try {
        const facultys = await faculty.find().populate('firm');
        res.json({ facultys })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
}


const getfacultyById = async(req, res) => {
    const facultyId = req.params.apple;

    try {
        const faculty = await faculty.findById(facultyId).populate('firm');
        if (!faculty) {
            return res.status(404).json({ error: "faculty not found" })
        }
        const facultyFirmId = faculty.firm[0]._id;
        res.status(200).json({ facultyId, facultyFirmId, faculty })
        console.log(facultyFirmId);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
}


module.exports = { facultyRegister, facultyLogin, getAllfacultys, getfacultyById }