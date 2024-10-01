const Admin = require('../models/admin');
const University = require('../models/university');
const Student = require('../models/student');
const Course = require('../models/course');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const xlsx = require('xlsx');
dotenv.config();

const adminRegister = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        let admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({ msg: 'Admin already exists' });
        }
        admin = new Admin({
            name,
            email,
            password,
        });

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);

        await admin.save();

        const payload = {
            admin: {
                id: admin.id,
            },
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(200).json({ email, message: 'Admin created successfully', token });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
}

const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        let admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            admin: {
                id: admin.id,
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

const getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        res.json(admin);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
}

const createUniversity = async (req, res) => {
    try {
        const { long_name, short_name, location, country } = req.body;

        if (!long_name || !short_name) {
            return res.status(400).json({ message: 'Long name and short name are required' });
        }

        const newUniversity = new University({ long_name, short_name, location, country });
        await newUniversity.save();
        res.status(201).json({ message: 'University created successfully', university: newUniversity });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Duplicate key error',
                error: error.keyValue
            });
        }
        res.status(500).json({ message: 'Error creating university', error });
    }
};

const editUniversity = async (req, res) => {
    try {
        const { id } = req.params;
        const { long_name, short_name, location, country } = req.body;
        const updatedUniversity = await University.findByIdAndUpdate(
            id,
            { long_name, short_name, location, country },
            { new: true, runValidators: true }
        );
        if (!updatedUniversity) {
            return res.status(404).json({ message: 'University not found' });
        }
        res.status(200).json({ message: 'University updated successfully', university: updatedUniversity });
    } catch (error) {
        res.status(500).json({ message: 'Error updating university', error });
    }
};

// const getUniversities = async (req, res) => {
//     try {
//         const universities = await University.find().populate('courses');
//         res.json({ universities });
//     } catch (error) {
//         console.error('Error fetching universities:', error);
//         res.status(500).json({ message: 'Error fetching universities', error: error.message });
//     }
// };

const getStudentsByUniversity = async (req, res) => {
    try {
        const universityId = req.params.universityId; 
        const students = await Student.find({ university: universityId });
        res.json({ students });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error });
    }
};

const createCourse = async (req, res) => {
    try {
        const { name, description} = req.body;
        const newCourse = new Course({ name, description});
        await newCourse.save();

        res.status(201).json({ message: 'Course created successfully', course: newCourse });
    } catch (error) {
        res.status(500).json({ message: 'Error creating course', error });
    }
};

//All Universities
async function getUniversities(req, res) {
    try {
        const universities = await University.find();
        res.status(200).json({ universities });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}


const getCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('universities');
        res.status(200).json({ courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const bulkUploadStudents = async (req, res) => {
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
            return res.status(400).json({ message: `University not found` });
        }

        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const students = [];
        const existingStudents = [];
        for (const row of data) {
            const { regd_no, name, mailid, section, stream, year, dept, password } = row;

            const existingStudent = await Student.findOne({ regd_no });
            if (existingStudent) {
                existingStudents.push(regd_no);
                continue; 
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newStudent = new Student({
                regd_no,
                name,
                email: mailid,
                section,
                stream,
                year,
                dept,
                university: university._id,
                password: hashedPassword
            });

            students.push(newStudent);

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: mailid,
                subject: 'Welcome to SmartLMS',
                text: `Hello ${name},\n\nWelcome to SmartLMS!\n\nYou have been successfully registered. Here are your login details:\n\nEmail: ${mailid}\nPassword: ${password}\n\nPlease log in to your account and change your password as soon as possible.\n\nBest regards,\nSmartLMS Team`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`Error sending email to ${mailid}:`, error);
                } else {
                    console.log(`Email sent to ${mailid}:`, info.response);
                }
            });
        }

        await Student.insertMany(students);

        res.status(201).json({ 
            message: 'Students uploaded successfully', 
            students, 
            existingStudents 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading students', error });
    }
};

const createStudent = async (req, res) => {
    try {
        const { regd_no, name, mailid, section, stream, year, dept, password, universityId } = req.body;

        if (!regd_no || !name || !mailid || !section || !stream || !year || !dept || !password || !universityId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const existingStudent = await Student.findOne({ regd_no });
        if (existingStudent) {
            return res.status(400).json({ message: 'Student already exists' });
        }

        const university = await University.findById(universityId);
        if (!university) {
            return res.status(400).json({ message: 'University not found' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newStudent = new Student({
            regd_no,
            name,
            email: mailid,
            section,
            stream,
            year,
            dept,
            university: university._id,
            password: hashedPassword
        });

        await newStudent.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: mailid,
            subject: 'Welcome to SmartLMS',
            text: `Hello ${name},\n\nWelcome to SmartLMS!\n\nYou have been successfully registered. Here are your login details:\n\nEmail: ${mailid}\nPassword: ${password}\n\nPlease log in to your account and change your password as soon as possible.\n\nBest regards,\nSmartLMS Team`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(`Error sending email to ${mailid}:`, error);
            } else {
                console.log(`Email sent to ${mailid}:`, info.response);
            }
        });

        res.status(201).json({ message: 'Student created successfully', student: newStudent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating student', error });
    }
};

const getUniversityById = async (req, res) => {
    try {
        const universityId = req.params.universityId;
        const university = await University.findById(universityId);
        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }
        res.json({ university });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching university', error });
    }
};

const updateUniversity = async (req, res) => {
    try {
        const universityId = req.params.universityId;
        const { name, location } = req.body;
        const university = await University.findByIdAndUpdate(
            universityId,
            { name, location },
            { new: true, runValidators: true }
        );
        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }
        res.json({ message: 'University updated successfully', university });
    } catch (error) {
        res.status(500).json({ message: 'Error updating university', error });
    }
};

const getStudentById = async (req, res) => {
    try {
        const userId = req.params.userId;
        const student = await Student.findById(userId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ student });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student', error });
    }
};

const updateStudent = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { regd_no, name, email, section, stream, year, dept, password } = req.body;
        let hashedPassword = password;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        const student = await Student.findByIdAndUpdate(
            userId,
            { regd_no, name, email, section, stream, year, dept, password: hashedPassword },
            { new: true, runValidators: true }
        );
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ message: 'Student updated successfully', student });
    } catch (error) {
        res.status(500).json({ message: 'Error updating student', error });
    }
};

module.exports = { 
    adminRegister,
    adminLogin,
    getAdminProfile,
    createUniversity,
    editUniversity, //
    getUniversities, ///
    getStudentsByUniversity,
    createCourse, ///
    getCourses,
    bulkUploadStudents,
    createStudent,
    getUniversityById,
    updateUniversity,
    getStudentById,
    updateStudent
};