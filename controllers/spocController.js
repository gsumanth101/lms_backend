const Spoc = require('../models/spoc');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Faculty = require('../models/faculty');
const xlsx = require('xlsx');
const University = require('../models/university');
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


const uploadFaculty = async (req, res) => {
    try {
        const { name, email, ph_number, year, section, stream } = req.body;
        const university = req.spoc.university; // Get the university from the logged-in SPOC

        const newFaculty = new Faculty({
            name,
            email,
            ph_number,
            year,
            section,
            stream,
            university // Set the university field
        });

        await newFaculty.save();
        res.status(201).json({ message: 'Faculty uploaded successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const bulkUploadFaculty = async (req, res) => {
    try {
        const file = req.file;
        const universityId = req.body.universityId;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!universityId) {
            return res.status(400).json({ message: 'No university selected' });
        }

        const university = await University.findById(universityId);
        if (!university) {
            return res.status(400).json({ message: 'University not found' });
        }

        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const faculties = [];
        const existingFaculties = [];
        for (const row of data) {
            const { name, email, phone, section, stream, year, department, password } = row;

            const existingFaculty = await Faculty.findOne({ email });
            if (existingFaculty) {
                existingFaculties.push(email);
                continue;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newFaculty = new Faculty({
                name,
                email,
                phone,
                section,
                stream,
                year,
                department,
                university: university._id,
                password: hashedPassword
            });

            faculties.push(newFaculty);

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Welcome to SmartLMS',
                text: `Hello ${name},\n\nWelcome to SmartLMS!\n\nYou have been successfully registered. Here are your login details:\n\nEmail: ${email}\nPassword: ${password}\nSection: ${section}\nStream: ${stream}\nYear: ${year}\n\nPlease log in to your account and change your password as soon as possible.\n\nBest regards,\nSmartLMS Team`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`Error sending email to ${email}:`, error);
                } else {
                    console.log(`Email sent to ${email}:`, info.response);
                }
            });
        }

        await Faculty.insertMany(faculties);

        res.status(201).json({ 
            message: 'Faculties uploaded successfully', 
            faculties, 
            existingFaculties 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading faculties', error });
    }
};

//Students of logged in spoc university
const getFacultyByUniversity = async (req, res) => {
    try {
        const faculties = await Faculty.find({ university: req.spoc.university }).select('-password');
        res.json(faculties);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
}

module.exports = {
    adminLogin,
    getSpocProfile,
    createFaculty,
    bulkUploadFaculty,
    getFacultyByUniversity,
    uploadFaculty
};

