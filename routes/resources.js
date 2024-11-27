const express = require('express');
const path = require("path");
const router = express.Router();
const {authenticateToken} = require("../middleware");
const app = express();
app.use(express.static(path.join(__dirname, 'public')));


router.get(['/', '/login'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

router.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'signup.html'));
});

router.get(['/dashboard', '/dashboard.html'], authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dashboard.html'));
});


/*router.get('/users*', isAuthenticated, (req, res) => {
    if(req.session.isAdmin) {
        res.sendFile(path.join(__dirname, 'users.html'));
    }else {
        res.sendFile(path.join(__dirname, 'public', 'error.html'));
    }
});*/

module.exports = router;
