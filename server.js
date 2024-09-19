require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt'); // Make sure to install bcrypt
const session = require('express-session');
const app = express();
const port = 3000;

const moment = require('moment');
const momentTimezone = require('moment-timezone');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'UEIENEI!@##$', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE,
    password: process.env.DB_PASSWORD,
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

function isAuthenticated(req, res, next) {
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

app.get('/dashboard*', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/users*', isAuthenticated, (req, res) => {
    if(req.session.isAdmin) {
        res.sendFile(path.join(__dirname, 'users.html'));
    }else {
        res.sendFile(path.join(__dirname, 'public', 'error.html'));
    }
});

// Endpoint to serve the API key
app.get('/api/key', isAuthenticated, (req, res) => {
    res.json({ key: process.env.GOOGLE_API_KEY });
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1 and active = true', [username.toLowerCase()]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (await bcrypt.compare(password, user.password)) {
                req.session.userId = user.id;
                req.session.isAdmin = user.isadmin;
                res.json({ success: true, email: user.email, isAdmin: user.isadmin });
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
    const { email , password } = req.body;
    const lowerCaseEmail = email.toLowerCase();

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            'INSERT INTO users (email, password, active) VALUES ($1, $2, true) RETURNING id',
            [lowerCaseEmail, hashedPassword]
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
    const { category, WarningLevel, location, monday_open, monday_close, tuesday_open, tuesday_close, wednesday_open, wednesday_close, thursday_open, thursday_close, friday_open, friday_close, saturday_open, saturday_close, sunday_open, sunday_close, services_available, website, added_by, updated_by } = req.body;

    const {lat, lng, suburb} = await getGeolocation(location);
    const headline = `${suburb}: ${category}`;
    try {
        const result = await pool.query(
        'INSERT INTO recovery_centers (category, warning_level, monday_open, monday_close, tuesday_open, tuesday_close, wednesday_open, wednesday_close, thursday_open, thursday_close, friday_open, friday_close, saturday_open, saturday_close, sunday_open, sunday_close, location, services_available, website, added_by, updated_by, deleted, last_updated, latitude, longitude, headline) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, FALSE, now(), $22, $23, $24) RETURNING *',
            [category, WarningLevel, monday_open, monday_close, tuesday_open, tuesday_close, wednesday_open, wednesday_close, thursday_open, thursday_close, friday_open, friday_close, saturday_open, saturday_close, sunday_open, sunday_close, location, services_available, website, added_by, updated_by, lat, lng, headline]
    );

        res.status(201).json("successful");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error adding community center' });
    }
});

app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT * from users');
        res.json(result.rows);
    }catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving users' });
    }
})

// Retrieve all centers
app.get('/api/centers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM recovery_centers where deleted = false ');

        const transformedResult = await Promise.all(result.rows.map(async center => {

            // Convert last_updated to Adelaide time
            const adelaideTime = moment.utc(center.last_updated).tz('Australia/Adelaide').format('YYYY-MM-DD hh:mm:ss A');
            return {
                id: center.id,
                areaDesc: center.location,
                services: center.services_available,
                web: center.website,
                updated: adelaideTime,
                headline: center.headline,
                ControlAuthority: 'SAFECOM',
                opens: formatOpeningHours(center),
                category: center.category,
                WarningLevel: center.WarningLevel,
                added_by: center.added_by,
                updated_by: center.updated_by,
                geometry: {
                    x: center.latitude,
                    y: center.longitude
                }
            };
        }));

        res.status(200).json(transformedResult);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving community centers' });
    }
});

// Helper function to get geolocation and suburb from address
async function getGeolocation(address) {
    try {
        const apiKey = process.env.GOOGLE_API_KEY; // Replace with your actual Google API key
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
        const data = await response.json();

        if (data.status === 'OK') {
            const location = data.results[0].geometry.location;
            const addressComponents = data.results[0].address_components;

            // Extracting suburb and state (locality and administrative area)
            let suburb = '';
            let state = '';

            addressComponents.forEach(component => {
                if (component.types.includes('locality')) {
                    suburb = component.long_name;
                }
                if (component.types.includes('administrative_area_level_1')) {
                    state = component.short_name; // Use short_name for state abbreviations (e.g., "SA")
                }
            });

            return {
                lat: location.lat,
                lng: location.lng,
                suburb: `${suburb} ${state}` // Format: 'Marion SA'
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
    const { location, monday_open, monday_close, tuesday_open, tuesday_close, wednesday_open, wednesday_close, thursday_open, thursday_close, friday_open, friday_close, saturday_open, saturday_close, sunday_open, sunday_close, services_available, website, added_by, updated_by } = req.body;

    try {
        const result = await pool.query(
            'UPDATE recovery_centers SET location = $1, monday_open = $2, monday_close = $3, tuesday_open = $4, tuesday_close = $5, wednesday_open = $6, wednesday_close = $7, thursday_open = $8, thursday_close = $9, friday_open = $10, friday_close = $11, saturday_open = $12, saturday_close = $13, sunday_open = $14, sunday_close = $15, services_available = $16, website = $17, last_updated = now(), added_by = $18, updated_by = $19 WHERE id = $20 RETURNING *',
            [location, monday_open, monday_close, tuesday_open, tuesday_close, wednesday_open, wednesday_close, thursday_open, thursday_close, friday_open, friday_close, saturday_open, saturday_close, sunday_open, sunday_close, services_available, website, added_by, updated_by, id]
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


// Update user active status
app.patch('/api/users/:id/active', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;


    try {
        const result = await pool.query(
            'UPDATE users SET active = $1 WHERE id = $2 RETURNING *',
            [active, id]
        );

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating user status' });
    }
});

// Update user admin status
app.patch('/api/users/:id/admin', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { isadmin } = req.body;


    try {
        const result = await pool.query(
            'UPDATE users SET isadmin = $1 WHERE id = $2 RETURNING *',
            [isadmin, id]
        );

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating user admin status' });
    }
});



// Function to check database connectivity
async function checkDatabaseConnectivity() {
    try {
        await pool.query('SELECT NOW()'); // Simple query to test connection
        console.log('Database connection successful!');
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1); // Exit the application if database connection fails
    }
}


checkDatabaseConnectivity()
    .then(() => {
        // Start your server if database connection is successful
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}/`);
        });
    });