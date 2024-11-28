const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Load the appropriate .env file based on the NODE_ENV
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(__dirname, envFile) });

const tenantId = process.env.MSAL_TENTANT_ID;

// Setup JWKS client
const client = jwksClient({
    jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

function authenticateToken(req, res, next) {
    const token = req.cookies.authToken || req.headers['authorization']?.split(' ')[1];

    if (!token) return res.status(401).send('Please login first');

    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) return res.status(403).send('Invalid or expired token');
        res.user = decoded;
        res.token = token;
        next();
    });
}

module.exports = {authenticateToken};
