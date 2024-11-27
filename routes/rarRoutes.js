const express = require('express');
const {authenticateToken} = require("../middleware");
const pool = require("../services/dbService");
const moment = require('moment');
const momentTimezone = require('moment-timezone');
const router = express.Router();

const app = express();
app.use(express.json());



const {formatOpeningHours} = require("../services/util");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(cookieParser());

// Create a new relief and recovery center
router.post('/centers', authenticateToken, async (req, res) => {
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

// Retrieve all centers
router.get('/centres', async (req, res) => {
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
                geometry: {
                    x: center.longitude,
                    y: center.latitude
                }
            };
        }));

        res.status(200).json(transformedResult);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving community centers' });
    }
});

// Retrieve all centers
router.get('/centers/internal', async (req, res) => {
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

// Retrieve a single center by ID
router.get('/centers/:id', async (req, res) => {
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
router.put('/centers/:id', authenticateToken, async (req, res) => {
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
router.delete('/centers/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('UPDATE recovery_centers SET deleted = TRUE WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error deleting community center' });
    }
});


/*// Update user active status
router.patch('/api/users/:id/active', isAuthenticated, async (req, res) => {
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
});*/

/*// Update user admin status
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
});*/

module.exports = router;
