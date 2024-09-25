const mongoose = require('mongoose');
const { Schema } = mongoose;

const facultySchema = new Schema({
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
    password: {
        type: String,
        required: true
    },
    university: {
        type: Schema.Types.ObjectId,
        ref: 'University',
        required: true
    }
});

const Faculty = mongoose.model('Faculty', facultySchema);

module.exports = Faculty;