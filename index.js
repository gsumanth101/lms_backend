const express = require('express');
const cors = require('cors');
const db = require('./config/config');
const dotenv = require('dotenv');
const adminRouter = require('./routes/adminRoutes');
const spocRouter = require('./routes/spocRouter');
const facultyRouter = require('./routes/facultyRoutes');
const studentRouter = require('./routes/studentRoutes');
const assessmentRouter = require('./routes/assessmentsRouter');
const meetingRouter = require('./routes/meetingRoutes');


dotenv.config();



const app = express();

db();



app.use(express.json());

app.use(cors(
    {
        // origin: 'https://admin.smartlms.tech',
        origin: 'http://localhost:5173',
        methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD','DELETE', 'PATCH', 'UPDATE'],
        credentials: true
    }
));


app.use('/api/admin', adminRouter);
app.use('/api/spoc', spocRouter);
app.use('/api/faculty', facultyRouter);
app.use('/api/student', studentRouter);
app.use('/api/assessment', assessmentRouter);
app.use('/api/meeting', meetingRouter);

app.get('/', (req, res) => {
 res.send('Working ...!');
});

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
