const Student = require('../models/student');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();

const studentLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        let student = await Student.findOne({ email });
        if (!student) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            student: {
                id: student.id,
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

const getStudentProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.student.id).select('-password');
        res.json(student);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
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

const getCourseById = async (req, res) => {
    const { id } = req.params;
    try {
      const course = await Course.findById(id)
        .populate('name')
        .select('name description content streams');
  
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      res.status(200).json({ course });
    } catch (error) {
      console.error('Error fetching course:', error);
      res.status(500).json({ message: 'Error fetching course', error: error.message });
    }
};

const getStudentCourses = async (req, res) => {
    try {
        // Find the student by ID
        const student = await Student.findById(req.student.id);
        if (!student) {
            return res.status(404).json({ msg: 'Student not found' });
        }

        // Find courses by university ID
        const courses = await Course.find({ university: student.university });
        res.status(200).json({ courses });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { 
    studentLogin, 
    getStudentProfile,
    getCourses,
    getStudentCourses,
    getCourseById
};
