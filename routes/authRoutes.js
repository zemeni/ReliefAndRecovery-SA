const express = require('express');
const bcrypt = require("bcrypt");
const {authenticateToken} = require("../middleware");
const pool = require("../services/dbService");
const router = express.Router();

router.get('/msal_key', async (req, res) => {
    res.json({ clientId: process.env.MSAL_CLIENT_ID, tenantId: process.env.MSAL_TENTANT_ID, redirectURI: process.env.MSAL_REDIRECT_URI, environment: process.env.NODE_ENV });
});

// Google API key
router.get('/google_key', authenticateToken, async (req, res) => {
    res.json({ key: process.env.GOOGLE_API_KEY });
});


router.post('/signup', async (req, res) => {
    const { email , password } = req.body;
    const lowerCaseEmail = email.toLowerCase();

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            'INSERT INTO users (email, password, active) VALUES ($1, $2, false) RETURNING id',
            [lowerCaseEmail, hashedPassword]
        );
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: 'Signup failed: ' + err.message });
    }
});


//msal login
router.post('/login', authenticateToken, (req, res) => {
    const {name, preferred_username} = res.user;
    const token  = res.token;
    res.cookie('authToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
    } )
    res.json({ success: true, email: preferred_username, name: name });
});

/*router.post('/logout', authenticateToken, (req, res) => {
    // Clear the authToken cookie
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: true, // Use true if using HTTPS
        sameSite: 'strict'
    });

    res.json({ success: true, message: 'Logged out successfully' });
});*/

/* Database login
router.post('/login', async (req, res) => {
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
});*/

/*// DB Signup
router.post('/signup', async (req, res) => {
    const { email , password } = req.body;
    const lowerCaseEmail = email.toLowerCase();

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            'INSERT INTO users (email, password, active) VALUES ($1, $2, false) RETURNING id',
            [lowerCaseEmail, hashedPassword]
        );
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: 'Signup failed: ' + err.message });
    }
});*/

/*// GET DB USERS
router.get('/api/users', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT * from users');
        res.json(result.rows);
    }catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error retrieving users' });
    }
})*/

module.exports = router;
