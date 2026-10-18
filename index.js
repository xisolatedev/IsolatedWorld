const express = require('express');
const app = express();
const dotenv = require('dotenv');
const path = require('node:path');
dotenv.config();
const port = 3000;

app.get('/', express.static(path.join(__dirname, 'public')));

app.get('/hi', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});