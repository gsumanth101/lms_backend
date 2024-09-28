const express = require("express");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotEnv = require('dotenv');
const facultyRoutes = require('./routes/facultyRouter');
const userRoutes = require('./routes/userRouter');
const adminRoutes = require('./routes/adminRouter');
const spocRoutes = require('./routes/spocRouter');
const assessmentRoutes = require('./routes/assessmentRouter'); // Add this line
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const db = require('./lib/config');

dotEnv.config();

db();

const app = express();

const PORT = process.env.PORT || 4000;

// Configure CORS
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true 
};

app.use(cors(corsOptions));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 5 // 5 hours
    }
}));


app.use(bodyParser.json());

app.use('/faculty', facultyRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/spoc', spocRoutes);
app.use('/assessments', assessmentRoutes); 

app.get('/', (req, res) => {
    res.send('Hey its working ..');

});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started and running at ${PORT}`);
});
