const express = require('express');
const cors = require('cors');
const db = require('./config/config');
const dotenv = require('dotenv');
const adminRouter = require('./routes/adminRoutes');


dotenv.config();



const app = express();

db();



app.use(express.json());

app.use(cors(
    {
        origin: 'https://api.phemesoft.com',
        methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD','DELETE', 'PATCH', 'UPDATE'],
        credentials: true
    }
));


app.use('/api/admin', adminRouter);

app.get('/', (req, res) => {
 res.send('Working ...!');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
