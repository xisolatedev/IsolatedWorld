const express = require('express');
const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Serve the website
app.use(express.static(path.join(__dirname, 'public')));

// Serve static resources
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));

// API routes
app.get('/hi', (req, res) => {
    res.send('Hello World!');
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});