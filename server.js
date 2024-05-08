const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json()); // Parses JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parses URL-encoded bodies

// Establish a connection to the MySQL database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'StuTest',
    charset: 'utf8mb4'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to the MySQL server.');
});

// Serve static files from the 'public' directory
// Serve the login page as the main page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Serve the chat page on a different route
app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Received:', username, password); // Check what is received
    if (username === 'admin' && password === 'admin') {
        console.log('Login successful');
        res.json({ success: true });
    } else {
        console.log('Login failed');
        res.status(401).json({ success: false });
    }
});




// API endpoint to fetch all chat messages
app.get('/get-messages', (req, res) => {
    const sql = "SELECT id, message, userid, DATE_FORMAT(senttime, '%H:%i') AS senttime FROM messages";
    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error retrieving messages:', error.message);
            return res.status(500).send('Error retrieving messages');
        }
        res.json(results); // Return formatted messages to the client
    });
});

// Endpoint to delete a message by its ID
app.delete('/delete-message/:id', (req, res) => {
    const messageId = req.params.id;
    const sql = 'DELETE FROM messages WHERE id = ?';

    db.query(sql, [messageId], (error, results) => {
        if (error) {
            console.error('Error deleting message:', error.message);
            return res.status(500).send('Error deleting message');
        }
        res.send({ message: 'Message deleted' });
    });
});

// API endpoint to send a new message
app.post('/send-message', (req, res) => {
    const message = req.body.message;
    const userid = req.body.userid;

    const sql = "INSERT INTO messages (message, userid) VALUES (?, ?)";
    
    db.query(sql, [message, userid], (error, results) => {
        if (error) {
            console.error('Error saving message:', error.message);
            return res.status(500).send('Error saving message');
        }
        res.send({ message: 'Message saved', id: results.insertId });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
