const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const router = express.Router();
const Student = require('../models/student'); // Import the Student model
const Meeting = require('../models/meeting'); // Import the Meeting model

const DAILY_API_KEY = 'a409edc2f3ae05bfed2b2e7238ef6f217b9f7f2a83456b09230828899a2fdc0b'; // Daily.co API key

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  }
});

router.post('/create-meeting', async (req, res) => {
    const { section, meetingTitle, facultyId, facultyName } = req.body; // Added faculty info
    
    console.log('Request Body:', req.body); // Log the incoming request body
  
    try {
        // Fetch students based on the section
        const students = await Student.find({ section });

        if (students.length === 0) {
            return res.status(404).json({ error: `No students found for section: ${section}` });
        }

        // Create the meeting using Daily.co API
        const response = await axios.post(
            'https://api.daily.co/v1/rooms',
            {
                properties: {
                    enable_chat: true,
                    enable_knocking: true,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${DAILY_API_KEY}`,
                },
            }
        );
  
        const meetingUrl = response.data.url;

        // Send email notifications to all students in the section
        const studentEmails = students.map(student => student.email);
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: studentEmails, // Send to all students in the section
            subject: `Meeting Invitation: ${meetingTitle}`,
            text: `Dear Student,\n\nYou are invited to a meeting.\nJoin here: ${meetingUrl}\n\nBest regards,\nFaculty`,
        };

        await transporter.sendMail(mailOptions);

        // Store the meeting details in the database
        const newMeeting = new Meeting({
            title: meetingTitle,
            url: meetingUrl,
            section,
            facultyId,  // Store faculty ID
            facultyName,  // Store faculty name
        });

        await newMeeting.save(); // Save meeting to the database
        
        res.status(200).json({ meetingUrl, message: 'Meeting created, email notifications sent, and meeting stored in the database.' });
    } catch (error) {
        console.error('Error creating meeting:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to create a meeting', details: error.response ? error.response.data : error.message });
    }
});


// Route to fetch meetings for a particular faculty based on facultyId
router.get('/meetings/faculty/:facultyId', async (req, res) => {
  const { facultyId } = req.params;

  try {
      // Fetch all meetings created by the faculty
      const meetings = await Meeting.find({ facultyId }).sort({ createdAt: -1 }); // Sorted by most recent

      if (meetings.length === 0) {
          return res.status(404).json({ message: 'No meetings found for this faculty.' });
      }

      res.status(200).json(meetings);
  } catch (error) {
      console.error('Error fetching faculty meetings:', error.message);
      res.status(500).json({ error: 'Failed to fetch meetings for faculty' });
  }
});


// Route to fetch all meetings
router.get('/meetings', async (req, res) => {
  try {
      // Fetch all meetings
      const meetings = await Meeting.find().sort({ createdAt: -1 }); 

      if (meetings.length === 0) {
          return res.status(404).json({ message: 'No meetings found.' });
      }

      res.status(200).json(meetings);
  } catch (error) {
      console.error('Error fetching meetings:', error.message);
      res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});


module.exports = router;
