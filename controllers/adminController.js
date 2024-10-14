const Admin = require('../models/admin');
const University = require('../models/university');
const Student = require('../models/student');
const Course = require('../models/course');
const Spoc = require('../models/spoc');
const Faculty = require('../models/faculty');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const path = require('path');
const xlsx = require('xlsx');
const multer = require('multer');
const xml2js = require('xml2js');
const fs = require('fs');
const unzipper = require('unzipper');
const mongoose = require('mongoose');
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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
        const adminId = req.admin && req.admin.id;
        if (!adminId) {
            return res.status(400).json({ message: 'Admin ID not found in request' });
        }

        const admin = await Admin.findById(adminId).select('-password');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json(admin);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};


const createUniversity = async (req, res) => {
    try {
        const { long_name, short_name, location, country, spoc_name, spoc_email, spoc_phone, spoc_password } = req.body;

        if (!long_name || !short_name) {
            return res.status(400).json({ message: 'Long name and short name are required' });
        }

        if (!spoc_name || !spoc_email || !spoc_phone || !spoc_password) {
            return res.status(400).json({ message: 'SPOC name, email, phone, and password are required' });
        }

        // Create new university
        const newUniversity = new University({ long_name, short_name, location, country });
        await newUniversity.save();

        // Hash the SPOC password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(spoc_password, salt);

        // Create new SPOC
        const newSpoc = new Spoc({ name: spoc_name, email: spoc_email, phone: spoc_phone, password: hashedPassword, university: newUniversity._id });
        await newSpoc.save();

        // Update university with SPOC reference
        newUniversity.spoc = newSpoc._id;
        await newUniversity.save();

        // Send email notification
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: spoc_email,
            subject: 'University Successfully Added',
            text: `Dear ${spoc_name},\n\nYour university "${long_name}" has been successfully added.\n\nYour login details are as follows:\nEmail: ${spoc_email}\nPassword: ${spoc_password}\n\nBest regards,\nEyeBook`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        res.status(201).json({ message: 'University and SPOC created successfully', university: newUniversity, spoc: newSpoc });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Duplicate key error',
                error: error.keyValue
            });
        }
        res.status(500).json({ message: 'Error creating university and SPOC', error });
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
        const { name, description } = req.body;
        const newCourse = new Course({ name, description });
        await newCourse.save();

        res.status(201).json({ message: 'Course created successfully', course: newCourse });
    } catch (error) {
        res.status(500).json({ message: 'Error creating course', error });
    }
};

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
        const courses = await Course.find();
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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/scorm/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

const addUnitToCourse = async (req, res) => {
    const { id } = req.params; // Course ID
    const { unitName } = req.body; // Unit name
    const scormFile = req.file; // SCORM package file

    if (!unitName || !scormFile) {
        return res.status(400).json({ message: 'Unit name and SCORM package file are required' });
    }

    try {
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Extract the SCORM package
        const scormDir = path.join(__dirname, '../uploads', `${Date.now()}-${scormFile.originalname}`);
        await fs.promises.mkdir(scormDir, { recursive: true });

        await new Promise((resolve, reject) => {
            fs.createReadStream(scormFile.path)
                .pipe(unzipper.Extract({ path: scormDir }))
                .on('close', resolve)
                .on('error', reject);
        });

        // Verify that the index.html file exists
        const indexPath = path.join(scormDir, 'index.html');
        if (!fs.existsSync(indexPath)) {
            throw new Error(`index.html file not found at ${indexPath}`);
        }

        const newUnit = {
            unitTitle: unitName,
            materials: [{ scormDir, indexPath: `uploads/${path.basename(scormDir)}/index.html` }],
        };

        course.content.push(newUnit);
        await course.save();

        res.status(200).json({ message: 'Unit added successfully with SCORM content', indexPath: newUnit.materials[0].indexPath });
    } catch (error) {
        console.error('Error handling SCORM package:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Assign a course to a university
const assignCourseToUniversity = async (req, res) => {
    const { id } = req.params; // Course ID
    const { universityId } = req.body; // University ID

    try {
        // Find the course by ID
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Find the university by ID
        const university = await University.findById(universityId);
        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }

        // Add the university to the course's universities array if not already present
        if (!course.universities.includes(universityId)) {
            course.universities.push(universityId);
        }

        // Add the course to the university's courses array if not already present
        if (!university.courses.includes(id)) {
            university.courses.push(id);
        }

        // Save both documents
        await course.save();
        await university.save();

        res.status(200).json({ message: 'Course assigned to university successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

const viewUnit = async (req, res) => {
    const { courseId, unitId } = req.params;
  
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      const unit = course.content.id(unitId);
      if (!unit) {
        return res.status(404).json({ message: 'Unit not found' });
      }
  
      const material = unit.materials[0]; // Assuming there's only one material per unit
      if (!material) {
        return res.status(404).json({ message: 'Material not found' });
      }
  
      const filePath = path.join(__dirname, '../uploads', material.indexPath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }
  
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error viewing unit:', error);
      res.status(500).json({ message: 'Internal server error' });
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




const exportStudentsToExcel = async (req, res) => {
    try {
        // Fetch student data from the database
        const students = await Student.find().lean();

        // Convert student data to worksheet
        const worksheet = xlsx.utils.json_to_sheet(students);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Students');

        // Ensure the exports directory exists
        const exportDir = path.join(__dirname, '../exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir);
        }

        // Write the workbook to a file
        const filePath = path.join(exportDir, 'students.xlsx');
        xlsx.writeFileSync(workbook, filePath);

        // Send the file as a response for download
        res.download(filePath, 'students.xlsx', (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).json({ message: 'Error exporting student data' });
            } else {
                // Delete the file after sending it
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        console.error('Error exporting student data:', error);
        res.status(500).json({ message: 'Error exporting student data', error });
    }
};

const exportFacultyToExcel = async (req, res) => {
    try {
        // Fetch faculty data from the database
        const faculty = await Faculty.find().lean();

        // Convert faculty data to worksheet
        const worksheet = xlsx.utils.json_to_sheet(faculty);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Faculty');

        // Ensure the exports directory exists
        const exportDir = path.join(__dirname, '../exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir);
        }

        // Write the workbook to a file
        const filePath = path.join(exportDir, 'faculty.xlsx');
        xlsx.writeFileSync(workbook, filePath);

        // Send the file as a response for download
        res.download(filePath, 'faculty.xlsx', (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).json({ message: 'Error exporting faculty data' });
            } else {
                // Delete the file after sending it
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        console.error('Error exporting faculty data:', error);
        res.status(500).json({ message: 'Error exporting faculty data', error });
    }
};

const exportSpocToExcel = async (req, res) => {
    try {
        // Fetch SPOC data from the database
        const spocs = await Spoc.find().lean();

        // Convert SPOC data to worksheet
        const worksheet = xlsx.utils.json_to_sheet(spocs);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'SPOCs');

        // Ensure the exports directory exists
        const exportDir = path.join(__dirname, '../exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir);
        }

        // Write the workbook to a file
        const filePath = path.join(exportDir, 'spocs.xlsx');
        xlsx.writeFileSync(workbook, filePath);

        // Send the file as a response for download
        res.download(filePath, 'spocs.xlsx', (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).json({ message: 'Error exporting SPOC data' });
            } else {
                // Delete the file after sending it
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        console.error('Error exporting SPOC data:', error);
        res.status(500).json({ message: 'Error exporting SPOC data', error });
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

const createSpoc = async (req, res) => {
    try {
        const { name, email, phone, universityId } = req.body;

        if (!name || !email || !phone || !universityId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const password = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newSpoc = new Spoc({
            name,
            email,
            phone,
            university: universityId,
            password: hashedPassword
        });

        await newSpoc.save();

        // Send email to the new SPOC
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to SmartLMS',
            text: `Hello ${name},\n\nWelcome to SmartLMS!\n\nYou have been successfully registered as a SPOC. Here are your login details:\n\nEmail: ${email}\nPassword: ${password}\n\nPlease log in to your account and change your password as soon as possible.\n\nBest regards,\nSmartLMS Team`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(`Error sending email to ${email}:`, error);
            } else {
                console.log(`Email sent to ${email}:`, info.response);
            }
        });

        res.status(201).json({ message: 'SPOC created successfully', spoc: newSpoc });
    } catch (error) {
        console.error('Error creating SPOC:', error);
        res.status(500).json({ message: 'Error creating SPOC', error: error.message });
    }
};

const getAllSpocs = async (req, res) => {
    try {
        const spocs = await Spoc.find();
        res.json({ spocs });
    } catch (error) {
        console.error('Error retrieving SPOCs:', error);
        res.status(500).json({ message: 'Error retrieving SPOCs', error: error.message });
    }
};

const editSpoc = async (req, res) => {
    try {
        const spocId = req.params.spocId;
        const { name, email, phone, universityId } = req.body;

        const spoc = await Spoc.findByIdAndUpdate(
            spocId,
            { name, email, phone, university: universityId },
            { new: true, runValidators: true }
        );

        if (!spoc) {
            return res.status(404).json({ message: 'SPOC not found' });
        }

        res.json({ message: 'SPOC updated successfully', spoc });
    } catch (error) {
        res.status(500).json({ message: 'Error updating SPOC', error });
    }
};

const deleteSpoc = async (req, res) => {
    try {
        const spocId = req.params.spocId;

        const spoc = await Spoc.findByIdAndDelete(spocId);

        if (!spoc) {
            return res.status(404).json({ message: 'SPOC not found' });
        }

        res.json({ message: 'SPOC deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting SPOC', error });
    }
};

const updateAdminPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid old password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        admin.password = hashedPassword;
        await admin.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating password', error });
    }
}

const getUniversityCount = async (req, res) => {
    try {
        const count = await University.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching university count', error });
    }
}

const getSpocCount = async (req, res) => {
    try {
        const count = await Spoc.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching SPOC count', error });
    }
}

const getStudentCount = async (req, res) => {
    try {
        const count = await Student.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student count', error });
    }
}

const getCourseCount = async (req, res) => {
    try {
        const count = await Course.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching course count', error });
    }
}

const getFacultyCount = async (req, res) => {
    try {
        const count = await Faculty.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching faculty count', error });
    }
}



const renderDashboard = async (req, res) => {
    try {
        const universityCount = await University.countDocuments();
        const courseCount = await Course.countDocuments();
        const studentCount = await Student.countDocuments();
        const spocCount = await Spoc.countDocuments();
        const facultyCount = await Faculty.countDocuments();

        res.render('admin/dashboard', {
            admin: req.session.admin,
            universityCount: universityCount,
            courseCount: courseCount,
            studentCount: studentCount,
            spocCount: spocCount,
            facultyCount: facultyCount
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).render('admin/dashboard', { errorMessage: 'Server Error' });
    }
};




module.exports = { 
    adminRegister, ///
    adminLogin, ///
    getAdminProfile, ///
    createUniversity, ///
    editUniversity,
    getUniversities, ///
    getStudentsByUniversity,
    createCourse, ///
    getCourses, 
    getCourseById,
    addUnitToCourse,
    assignCourseToUniversity,
    bulkUploadStudents, ///
    createStudent, ///
    getUniversityById,
    updateUniversity,
    getStudentById,
    updateStudent,
    createSpoc, ///
    getAllSpocs, ///
    editSpoc,
    deleteSpoc,
    updateAdminPassword,
    getUniversityCount,
    getSpocCount,
    getStudentCount,
    getCourseCount,
    getFacultyCount,
    viewUnit,
    renderDashboard,
    exportStudentsToExcel,
    exportSpocToExcel,
    exportFacultyToExcel
};