const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('public'));
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

// Redirect root to /chat.html
app.get('/', (req, res) => {
    res.redirect('/chat');
});

// Serve the chat page
app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/public/chat.html');
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
    const sql = `
        SELECT users.username, messages.message, DATE_FORMAT(messages.senttime, '%Y-%m-%d %H:%i:%s') AS senttime
        FROM messages
        JOIN users ON messages.userid = users.user_id
        ORDER BY messages.senttime DESC;
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error retrieving messages:', error.message);
            return res.status(500).send('Error retrieving messages');
        }
        console.log('Retrieved messages:', results);  // Add this line to check the output
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
