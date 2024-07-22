const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt'); // Make sure to install bcrypt
const session = require('express-session');
const e = require("express"); // Make sure to install express-session
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'UEIENEI!@##$', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'reliefandrecovery',
    password: 'postgres',
    port: 5432,
});

function isAuthenticated(req, res, next) {
    console.log("checking authentication");
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/');
    }
}

// Routes
app.get(['/', '/login'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    console.log("session is ", req.session.userId);
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1 and active = true', [username]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (await bcrypt.compare(password, user.password)) {
                req.session.userId = user.id;
                res.json({ success: true, email: user.email });
            } else {
                res.json({ success: false, message: 'Invalid password' });
            }
        } else {
            res.json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        res.json({ success: false, message: 'Login failed: ' + err.message });
    }
});

// Signup route
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    console.log("signup details ",  email, password);
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            'INSERT INTO users (email, password, active) VALUES ($1, $2, true) RETURNING id',
            [email, hashedPassword]
        );
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: 'Signup failed: ' + err.message });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Create a new relief and recovery center
app.post('/api/centers', async (req, res) => {
    console.log("posting centers ", req.body);
    const { category, WarningLevel, center_status, location, monday_open, monday_close, tuesday_open, tuesday_close, wednesday_open, wednesday_close, thursday_open, thursday_close, friday_open, friday_close, saturday_open, saturday_close, sunday_open, sunday_close, services_available, website, added_by, updated_by } = req.body;

    try {
        const result = await pool.query(
        'INSERT INTO recovery_centers (category, warning_level, center_status, monday_open, monday_close, tuesday_open, tuesday_close, wednesday_open, wednesday_close, thursday_open, thursday_close, friday_open, friday_close, saturday_open, saturday_close, sunday_open, sunday_close, location, services_available, website, added_by, updated_by, deleted, last_updated) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, FALSE, now()) RETURNING *',
            [category, WarningLevel, center_status, monday_open, monday_close, tuesday_open, tuesday_close, wednesday_open, wednesday_close, thursday_open, thursday_close, friday_open, friday_close, saturday_open, saturday_close, sunday_open, sunday_close, location, services_available, website, added_by, updated_by]
    );

        res.status(201).json("successful");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error adding community center' });
    }
});

// Retrieve all centers
app.get('/api/centers', async (req, res) => {
    console.log("inside api/centers");
    try {
        const result = await pool.query('SELECT * FROM recovery_centers');

        const transformedResult = await Promise.all(result.rows.map(async center => {
            const geolocation = await getGeolocation(center.location);
            return {
                id: center.id,
                areaDesc: center.location,
                services: center.services_available,
                web: center.website,
                center_status: center.center_status,
                updated: center.last_updated,
                added_by: center.added_by,
                updated_by: center.updated_by,
                deleted: center.deleted,
                opens: formatOpeningHours(center),
                category: "Recovery Centre",
                WarningLevel: "Public Notice",
                geolocation: geolocation
            };
        }));

        res.status(200).json(transformedResult);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving community centers' });
    }
});

// Helper function to get geolocation from address
async function getGeolocation(address) {
    console.error("converting address ", address);
    try {
        const apiKey = ''; // Replace with your actual Google API key
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
        const data = await response.json();

        if (data.status === 'OK') {
            const location = data.results[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng
            };
        } else {
            console.error(`Geocoding error: ${data.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching geolocation: ${error}`);
        return null;
    }
}

// Helper function to format opening hours
function formatOpeningHours(center) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return daysOfWeek.map(day => {
        const openTime = center[`${day.toLowerCase()}_open`];
        const closeTime = center[`${day.toLowerCase()}_close`];

        if (!openTime || !closeTime) {
            return `${day} closed`;
        }

        return `${day} ${formatTime(openTime)} - ${formatTime(closeTime)}`;
    });
}

// Helper function to format time
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${suffix}`;
}


// Retrieve a single center by ID
app.get('/api/centers/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM recovery_centers WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Community center not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving community center' });
    }
});

// Update a  center
app.put('/api/centers/:id', async (req, res) => {
    const { id } = req.params;
    const { location, monday_open, monday_close, tuesday_open, tuesday_close, wednesday_open, wednesday_close, thursday_open, thursday_close, friday_open, friday_close, saturday_open, saturday_close, sunday_open, sunday_close, services_available, website, center_status, added_by, updated_by } = req.body;

    try {
        const result = await pool.query(
            'UPDATE recovery_centers SET location = $1, monday_open = $2, monday_close = $3, tuesday_open = $4, tuesday_close = $5, wednesday_open = $6, wednesday_close = $7, thursday_open = $8, thursday_close = $9, friday_open = $10, friday_close = $11, saturday_open = $12, saturday_close = $13, sunday_open = $14, sunday_close = $15, services_available = $16, website = $17, center_status = $18, last_updated = now(), added_by = $19, updated_by = $20 WHERE id = $21 RETURNING *',
            [location, monday_open, monday_close, tuesday_open, tuesday_close, wednesday_open, wednesday_close, thursday_open, thursday_close, friday_open, friday_close, saturday_open, saturday_close, sunday_open, sunday_close, services_available, website, center_status, added_by, updated_by, id]
        );

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Community center not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating community center' });
    }
});

// Delete a  center
app.delete('/api/centers/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('UPDATE recovery_centers SET deleted = TRUE WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting community center' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
