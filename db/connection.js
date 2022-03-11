const mysql = require('mysql2');

require('dotenv').config();
// Connect to database
const db = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: process.env.DB_PW,
        database: 'employees'
    },
    console.log('Connected to the employees database.')
);

module.exports = db;