const user = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotEnv = require('dotenv');

const db = require('../lib/config');





const userRegister = async(req, res) => {
    const { fname,lname, email,mobile_num, password } = req.body;
    try {
        const userEmail = await user.findOne({ email });
        if (userEmail) {
            return res.status(400).json("Email already taken");
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newuser = new user({
            fname,
            lname,
            email,
            mobile_num,
            password: hashedPassword
        });
        await newuser.save();

        res.status(201).json({ message: "user registered successfully" });
        console.log('registered')

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" })
    }

}

const userLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userEmail = await user.findOne({ email });
        if (!userEmail) {
            console.log("user not found for email:", email); // Log if user not found
            return res.status(401).json({ error: "Invalid username or password" });
        }

        console.log("user found:", userEmail);

        if (!password || !userEmail.password) {
            console.log("Password missing:", { password, userPassword: userEmail.password }); // Log if passwords are missing
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, userEmail.password);
        if (!isMatch) {
            console.log("Password mismatch"); 
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Generate a token without a secret key (not recommended for production)
        const token = jwt.sign({ userId: userEmail._id }, undefined, { algorithm: 'none' });

        const userId = userEmail._id;

        res.status(200).json({ success: "Login successful", token, userId });
        console.log(email, "this is token", token);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
};


const getAllusers = async(req, res) => {
    try {
        const users = await user.find().populate('firm');
        res.json({ users })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
}


const getuserById = async(req, res) => {
    const userId = req.params.apple;

    try {
        const user = await user.findById(userId).populate('firm');
        if (!user) {
            return res.status(404).json({ error: "user not found" })
        }
        const userFirmId = user.firm[0]._id;
        res.status(200).json({ userId, userFirmId, user })
        console.log(userFirmId);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
}


module.exports = { userRegister, userLogin, getAllusers, getuserById }