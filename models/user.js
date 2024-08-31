const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile_num:{
        type: Number,
        required:true,
        unique:true
    },
    password: {
        type: String,
        required: true
    },
    // firm: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Firm'
    // }]
});

const user = mongoose.model('user', userSchema);

module.exports = user;