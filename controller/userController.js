const user = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotEnv = require('dotenv');

const db = require('../lib/config');





const userRegister = async(req, res) => {
    const { fname,lname, email, password } = req.body;
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
    try {
        const { email, password } = req.body;
        const errorMsg = 'Auth failed: email or password is wrong';

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            console.log("User not found for email:", email); // Log if user not found
            return res.status(403).json({ success: false, message: errorMsg });
        }

        console.log("User found:", user);

        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) {
            console.log("Password mismatch");
            return res.status(403).json({ success: false, message: errorMsg });
        }

        const jwtToken = jwt.sign(
            { email: user.email, _id: user._id },
            process.env.JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '24h' }
        );

        // Start session
        req.session.user = {
            id: user._id,
            email: user.email,
            name: user.name
        };

        // Send session ID as a cookie
        res.cookie('sessionId', req.sessionID, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            jwtToken,
            userId: user._id,
            email: user.email,
            name: user.name
        });
        console.log(email, "this is token", jwtToken);
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


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


module.exports = { userRegister, userLogin, getuserById }