const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Establish a connection to the MySQL database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'chat_system',
    charset: 'utf8mb4'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to the MySQL server.');
});

// Redirect root to /index.html (login page)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Serve the chat pages
app.get('/chat-private.html', (req, res) => {
    res.sendFile(__dirname + '/public/chat-private.html');
});

app.get('/chat-group.html', (req, res) => {
    res.sendFile(__dirname + '/public/chat-group.html');
});

app.get('/chat-company.html', (req, res) => {
    res.sendFile(__dirname + '/public/chat-company.html');
});

app.get('/create-chat.html', (req, res) => {
    res.sendFile(__dirname + '/public/create-chat.html');
});

app.get('/create-group-chat.html', (req, res) => {
    res.sendFile(__dirname + '/public/create-group-chat.html');
});

// API endpoint to fetch chats for the current logged-in user based on chat type
app.get('/chats/:type', (req, res) => {
    const chatType = req.params.type;
    const sql = `
        SELECT chats.id, chats.chat_name
        FROM chats
                 JOIN user_chat ON chats.id = user_chat.chat_id
                 JOIN logged_in_users ON user_chat.user_id = logged_in_users.user_id
        WHERE chats.chat_type = ?;
    `;

    db.query(sql, [chatType], (error, results) => {
        if (error) {
            return res.status(500).json({ success: false, message: 'Error fetching chats' });
        }
        res.json(results);
    });
});

// API endpoint to fetch all chat messages
app.get('/get-messages/:chatId', (req, res) => {
    const chatId = req.params.chatId;
    const sql = `
        SELECT messages.id, users.username, messages.message, messages.timestamp AS senttime, messages.user_id
        FROM messages
                 JOIN users ON messages.user_id = users.id
        WHERE messages.chat_id = ?
        ORDER BY messages.timestamp ASC;
    `;

    db.query(sql, [chatId], (error, results) => {
        if (error) {
            console.error('Error retrieving messages:', error.message);
            return res.status(500).send('Error retrieving messages');
        }
        res.json(results);
    });
});

// Endpoint to delete a message by its ID
app.delete('/delete-message/:id', (req, res) => {
    const messageId = req.params.id;
    const sql = 'DELETE FROM messages WHERE id = ?';

    db.query(sql, [messageId], (error, results) => {
        if (error) {
            console.error('Error deleting message:', error.message);
            return res.status(500).json({ success: false, message: 'Error deleting message' });
        }
        res.json({ success: true, message: 'Message deleted' });
    });
});

// API endpoint to send a new message
app.post('/send-message', (req, res) => {
    const { message, user_id, chat_id } = req.body;

    const sql = "INSERT INTO messages (message, user_id, chat_id) VALUES (?, ?, ?)";

    db.query(sql, [message, user_id, chat_id], (error, results) => {
        if (error) {
            console.error('Error saving message:', error.message);
            return res.status(500).send('Error saving message');
        }
        res.send({ message: 'Message saved', id: results.insertId });
    });
});

// Endpoint to log in a user
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ? LIMIT 1";

    db.query(sql, [username, password], (error, results) => {
        if (error || results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = results[0];
        const deleteSql = "DELETE FROM logged_in_users";
        const insertSql = "INSERT INTO logged_in_users (user_id) VALUES (?)";

        db.query(deleteSql, (deleteError) => {
            if (deleteError) {
                return res.status(500).json({ success: false, message: 'Login error' });
            }
            db.query(insertSql, [user.id], (insertError) => {
                if (insertError) {
                    return res.status(500).json({ success: false, message: 'Login error' });
                }
                res.json({ success: true, user_id: user.id });
            });
        });
    });
});

// Endpoint to get the current logged-in user and chat info
app.get('/current-session', (req, res) => {
    const sql = `
        SELECT users.id AS user_id, users.username
        FROM logged_in_users
                 JOIN users ON logged_in_users.user_id = users.id
            LIMIT 1;
    `;

    db.query(sql, (error, results) => {
        if (error || results.length === 0) {
            return res.status(500).json({ success: false, message: 'No active session' });
        }
        res.json(results[0]);
    });
});

// API endpoint to fetch all users
app.get('/users', (req, res) => {
    const sql = "SELECT id, username FROM users";
    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({ success: false, message: 'Error fetching users' });
        }
        res.json(results);
    });
});

// API endpoint to create a new private chat
app.post('/create-chat', (req, res) => {
    const { chat_name, user_id, current_user_id } = req.body;
    const createChatSql = "INSERT INTO chats (chat_name, chat_type) VALUES (?, 'private')";
    const getChatIdSql = "SELECT LAST_INSERT_ID() AS chat_id";
    const createChatUserSql = "INSERT INTO user_chat (user_id, chat_id) VALUES (?, ?), (?, ?)";

    db.query(createChatSql, [chat_name], (error, results) => {
        if (error) {
            return res.status(500).json({ success: false, message: 'Error creating chat' });
        }
        db.query(getChatIdSql, (error, results) => {
            if (error) {
                return res.status(500).json({ success: false, message: 'Error getting chat ID' });
            }
            const chat_id = results[0].chat_id;
            db.query(createChatUserSql, [current_user_id, chat_id, user_id, chat_id], (error, results) => {
                if (error) {
                    return res.status(500).json({ success: false, message: 'Error linking users to chat' });
                }
                res.json({ success: true, chat_id: chat_id });
            });
        });
    });
});

// API endpoint to create a new group chat
app.post('/create-group-chat', (req, res) => {
    const { chat_name, user_ids, current_user_id } = req.body;
    const createChatSql = "INSERT INTO chats (chat_name, chat_type) VALUES (?, 'group')";
    const getChatIdSql = "SELECT LAST_INSERT_ID() AS chat_id";

    db.query(createChatSql, [chat_name], (error, results) => {
        if (error) {
            return res.status(500).json({ success: false, message: 'Error creating chat' });
        }
        db.query(getChatIdSql, (error, results) => {
            if (error) {
                return res.status(500).json({ success: false, message: 'Error getting chat ID' });
            }
            const chat_id = results[0].chat_id;
            const userChatValues = user_ids.map(user_id => [user_id, chat_id]).concat([[current_user_id, chat_id]]);
            const createUserChatsSql = "INSERT INTO user_chat (user_id, chat_id) VALUES ?";

            db.query(createUserChatsSql, [userChatValues], (error, results) => {
                if (error) {
                    return res.status(500).json({ success: false, message: 'Error linking users to chat' });
                }
                res.json({ success: true, chat_id: chat_id });
            });
        });
    });
});

// New endpoint for user registration
app.post('/register', (req, res) => {
    const { email, username, password, education } = req.body;

    const sql = "INSERT INTO users (email, username, password, education, user_type) VALUES (?, ?, ?, ?, 'Student')";

    db.query(sql, [email, username, password, education], (error, results) => {
        if (error) {
            console.error('Error registering user:', error.message);
            return res.status(500).json({ success: false, message: 'Error registering user' });
        }
        res.json({ success: true, message: 'User registered successfully' });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
