const express = require("express");
const dotEnv = require('dotenv');
const mongoose = require('mongoose');
const facultyRoutes = require('./routes/facultyRouter');
const userRoutes = require('./routes/userRouter');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path')

const db = require('./lib/config');

db();

const app = express()

const PORT = process.env.PORT || 4000;

// dotEnv.config();
app.use(cors())

// mongoose.connect(process.env.MONGO_URI)
//     .then(() => console.log("MongoDB connected successfully!"))
//     .catch((error) => console.log(error))

app.use(bodyParser.json());
app.use('/faculty', facultyRoutes);
app.use('/user',userRoutes)


app.listen(PORT, () => {
    console.log(`server started and running at ${PORT}`);
});

// app.use('/', (req, res) => {
//     res.send("<h1> Welcome to SUBY");
// })