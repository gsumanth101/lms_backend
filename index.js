const express = require("express");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotEnv = require('dotenv');
const facultyRoutes = require('./routes/facultyRouter');
const userRoutes = require('./routes/userRouter');
const adminRoutes = require('./routes/adminRouter');
const spocRoutes = require('./routes/spocRouter');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const db = require('./lib/config');

dotEnv.config();

db();

const app = express();

const PORT = process.env.PORT || 4000;


app.use(session({
    secret: process.env.SESSION_SECRET || 'ysumanthYaava',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { secure: false } 
}));

app.use(bodyParser.json());


app.use('/faculty', facultyRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/spoc', spocRoutes);

app.listen(PORT, () => {
    console.log(`server started and running at ${PORT}`);
});