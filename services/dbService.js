const { Pool } = require('pg');

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "reliefandrecovery",
    password: "postgres",
    port: 5432,
/*    ssl: {
        rejectUnauthorized: false
    }*/
});

module.exports = pool;
