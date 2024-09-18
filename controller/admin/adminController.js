const admin = require('../../models/admin');
const University = require('../../models/university');
const Course = require('../../models/course');
const User = require('../../models/user'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
require('dotenv').config();

const secretKey = process.env.JWT_SECRET;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Admin Register
const adminRegister = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const adminEmail = await admin.findOne({ email });
        if (adminEmail) {
            return res.status(400).json("Email already taken");
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newadmin = new admin({
            name,
            email,
            password: hashedPassword
        });
        await newadmin.save();
        res.status(201).json({ message: "admin registered successfully" });
        console.log('registered')

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" })
    }

}

//Admin Login
const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const adminEmail = await admin.findOne({ email });
        if (!adminEmail) {
            console.log("Admin not found for email:", email); // Log if admin not found
            return res.status(401).json({ error: "Invalid username or password" });
        }

        console.log("Admin found:", adminEmail);

        if (!password || !adminEmail.password) {
            console.log("Password missing:", { password, adminPassword: adminEmail.password }); // Log if passwords are missing
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, adminEmail.password);
        if (!isMatch) {
            console.log("Password mismatch"); 
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const token = jwt.sign({ adminId: adminEmail._id }, secretKey, { algorithm: 'HS256' });

        const adminId = adminEmail._id;

        res.status(200).json({ success: "Login successful", token, adminId });
        console.log(email, "this is token", token);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get All Admins
const getAlladmins = async (req, res) => {
    try {
        const admins = await admin.find().populate('firm');
        res.json({ admins })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Get Admin by ID
const getadminById = async (req, res) => {
    const adminId = req.params.adminId;
    const populateFields = req.query.populate ? req.query.populate.split(',') : [];

    try {
        let query = admin.findById(adminId);
        
        populateFields.forEach(field => {
            query = query.populate(field);
        });

        const adminData = await query;
        if (!adminData) {
            return res.status(404).json({ error: "Admin not found" });
        }
        res.status(200).json({ adminId, name: adminData.name, admin: adminData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Create University
const createUniversity = async (req, res) => {
    try {
        const { name, location, established } = req.body;
        const newUniversity = new University({ name, location, established });
        await newUniversity.save();
        res.status(201).json({ message: 'University created successfully', university: newUniversity });
    } catch (error) {
        res.status(500).json({ message: 'Error creating university', error });
    }
};

// Get Universities
const getUniversities = async (req, res) => {
    try {
        const universities = await University.find().populate('courses');
        res.json({ universities });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching universities', error });
    }
};

//Get UserByUniversity
const getUsersByUniversity = async (req, res) => {
    try {
        const universityId = req.params.universityId; // Extract universityId from URL parameter
        const users = await User.find({ university: universityId });
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

// Create Course
const createCourse = async (req, res) => {
    try {
        const { name, description, universityIds } = req.body;
        const newCourse = new Course({ name, description, universities: universityIds });
        await newCourse.save();

        // Update each university to include this course
        await University.updateMany(
            { _id: { $in: universityIds } },
            { $push: { courses: newCourse._id } }
        );

        res.status(201).json({ message: 'Course created successfully', course: newCourse });
    } catch (error) {
        res.status(500).json({ message: 'Error creating course', error });
    }
};

// Get Courses
const getCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('universities');
        res.status(200).json({ courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};



// Bulk Upload Users
 

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

// Bulk Upload Users
const bulkUploadUsers = async (req, res) => {
    try {
        const file = req.file;
        const universityId = req.body.universityId;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!universityId) {
            return res.status(400).json({ message: 'No university selected' });
        }

        // Find the university by ID
        const university = await University.findById(universityId);
        if (!university) {
            return res.status(400).json({ message: `University not found` });
        }

        // Read the uploaded file
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        // Process each row in the file
        const users = [];
        const existingUsers = [];
        for (const row of data) {
            const { regd_no, name, mailid, stream, year, password } = row;

            // Check if the user already exists
            const existingUser = await User.findOne({ regd_no });
            if (existingUser) {
                existingUsers.push(regd_no);
                continue; // Skip this user
            }

            // Hash the password with a salt of 10 rounds
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create a new user object
            const newUser = new User({
                regd_no,
                name,
                email: mailid,
                stream,
                year,
                university: university._id,
                password: hashedPassword
            });

            users.push(newUser);

            // Send email to the new user
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

        await User.insertMany(users);

        res.status(201).json({ 
            message: 'Users uploaded successfully', 
            users, 
            existingUsers 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading users', error });
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
        const { name, location, established } = req.body;
        const university = await University.findByIdAndUpdate(
            universityId,
            { name, location, established },
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



const getUserById = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error });
    }
};



const updateUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { regd_no, name, email, stream, year, password } = req.body;
        let hashedPassword = password;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { regd_no, name, email, stream, year, password: hashedPassword },
            { new: true, runValidators: true }
        );
        if (!user) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
};

module.exports = { 
    adminRegister, 
    adminLogin, 
    getAlladmins, 
    getadminById, 
    createUniversity, 
    createCourse, 
    getUniversities, 
    getCourses, 
    bulkUploadUsers,
    getUsersByUniversity,
    getUniversityById, 
    updateUniversity, 
    getUserById, 
    updateUser 
};

