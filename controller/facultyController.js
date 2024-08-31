const faculty = require('../models/faculty');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotEnv = require('dotenv');

const db = require('../lib/config');





const facultyRegister = async(req, res) => {
    const { fname,lname, email,mobile_num, password } = req.body;
    try {
        const facultyEmail = await faculty.findOne({ email });
        if (facultyEmail) {
            return res.status(400).json("Email already taken");
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newfaculty = new faculty({
            fname,
            lname,
            email,
            mobile_num,
            password: hashedPassword
        });
        await newfaculty.save();

        res.status(201).json({ message: "faculty registered successfully" });
        console.log('registered')

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" })
    }

}

const facultyLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const facultyEmail = await faculty.findOne({ email });
        if (!facultyEmail) {
            console.log("Faculty not found for email:", email); // Log if faculty not found
            return res.status(401).json({ error: "Invalid username or password" });
        }

        console.log("Faculty found:", facultyEmail);

        if (!password || !facultyEmail.password) {
            console.log("Password missing:", { password, facultyPassword: facultyEmail.password }); // Log if passwords are missing
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, facultyEmail.password);
        if (!isMatch) {
            console.log("Password mismatch"); 
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Generate a token without a secret key (not recommended for production)
        const token = jwt.sign({ facultyId: facultyEmail._id }, undefined, { algorithm: 'none' });

        const facultyId = facultyEmail._id;

        res.status(200).json({ success: "Login successful", token, facultyId });
        console.log(email, "this is token", token);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
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