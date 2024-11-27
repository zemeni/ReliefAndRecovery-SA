const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./services/dbService');
const path = require('path');
const app = express();
const port = 3000;

const cookieParser = require('cookie-parser');

// Load the appropriate .env file based on the NODE_ENV
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(__dirname, envFile) });


// Import routes
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resources');
const rarRoutes = require('./routes/rarRoutes');
const publicRoutes = require('./routes/publicRoutes');

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/rar', rarRoutes);
app.use('/api', publicRoutes);
app.use('/', resourceRoutes);




// Function to check database connectivity
async function checkDatabaseConnectivity() {
    try {
        await pool.query('SELECT NOW()');
        console.log('Database connection successful!');
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
}


checkDatabaseConnectivity()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}/`);
        });
    });