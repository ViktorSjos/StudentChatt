document.addEventListener('DOMContentLoaded', function () {
    const chatBox = document.querySelector('.chat-box');
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatList = document.getElementById('chat-list');
    let currentUserId;
    let currentChatId;

    // Fetch current session info
    function fetchCurrentSession() {
        return fetch('/current-session')
            .then(response => response.json())
            .then(session => {
                currentUserId = session.user_id;
                currentChatId = session.chat_id || 1; // Default chat ID if not set
                document.getElementById('current-chat-id').value = currentChatId;
                document.getElementById('current-user-id').value = currentUserId;
                return session;
            })
            .catch(error => console.error('Error fetching current session:', error));
    }

    // Fetch chats for the current user
    function fetchChats() {
        return fetch('/chats')
            .then(response => response.json())
            .then(chats => {
                chatList.innerHTML = '';
                chats.forEach(chat => {
                    const li = document.createElement('li');
                    li.textContent = chat.chat_name;
                    li.dataset.chat = chat.id;
                    li.addEventListener('click', () => {
                        currentChatId = chat.id;
                        fetchMessages(currentChatId);
                    });
                    chatList.appendChild(li);
                });
            })
            .catch(error => console.error('Error fetching chats:', error));
    }

    // Fetch messages for a specific chat
    function fetchMessages(chatId) {
        fetch(`/get-messages/${chatId}`)
            .then(response => response.json())
            .then(messages => {
                chatBox.innerHTML = '';
                messages.forEach(message => {
                    addMessageToDOM(message, message.user_id === currentUserId);
                });
            })
            .catch(error => console.error('Error loading messages:', error));
    }

    function sendMessage() {
        const message = input.value.trim();
        if (message) {
            fetch('/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, user_id: currentUserId, chat_id: currentChatId })
            })
                .then(response => response.json())
                .then(data => {
                    addMessageToDOM({ id: data.id, message, username: 'Current User', senttime: new Date() }, true);
                    input.value = ''; // Clear input after sending
                })
                .catch(error => console.error('Error sending message:', error));
        }
    }

    function addMessageToDOM(msg, isCurrentUser) {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add(isCurrentUser ? 'right' : 'left', 'message-container');
        messageContainer.setAttribute('data-id', msg.id);

        const usernameLabel = document.createElement('div');
        usernameLabel.classList.add('user-id-label');
        usernameLabel.textContent = `${msg.username || 'Unknown User'}`;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.textContent = msg.message;

        messageDiv.style.backgroundColor = isCurrentUser ? '#dcf8c6' : '#add8e6';

        const timeLabel = document.createElement('div');
        timeLabel.classList.add('time-label');
        timeLabel.textContent = new Date(msg.senttime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageContainer.appendChild(usernameLabel);
        messageContainer.appendChild(messageDiv);
        messageContainer.appendChild(timeLabel);

        chatBox.appendChild(messageContainer);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    fetchCurrentSession()
        .then(() => fetchChats())
        .then(() => fetchMessages(currentChatId));

    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
});
