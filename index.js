const express = require('express');
const cors = require('cors');
const db = require('./config/config');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const adminRouter = require('./routes/adminRoutes');
const spocRouter = require('./routes/spocRouter');
const facultyRouter = require('./routes/facultyRoutes');
const studentRouter = require('./routes/studentRoutes');
const assessmentRouter = require('./routes/assessmentsRouter');
const meetingRouter = require('./routes/meetingRoutes');

dotenv.config();

const app = express();

db();

const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
    secret: 'Hello2157289',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: isProduction,
        sameSite: isProduction ? 'None' : 'Lax'
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

app.use('/admin', adminRouter);
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