const express = require('express');
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


module.exports = router;
