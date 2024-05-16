document.addEventListener('DOMContentLoaded', function () {
    const chatBox = document.querySelector('.chat-box');
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatList = document.getElementById('chat-list');
    const contextMenu = document.getElementById('context-menu');
    const deleteOption = document.getElementById('delete-option');
    let currentUserId;
    let currentChatId;
    let currentUsername;
    let selectedMessageId;
    let selectedMessageUserId;

    // Fetch current session info
    function fetchCurrentSession() {
        return fetch('/current-session')
            .then(response => response.json())
            .then(session => {
                currentUserId = session.user_id;
                currentUsername = session.username;
                document.getElementById('current-user-id').value = currentUserId;
                fetchChats();
            })
            .catch(error => console.error('Error fetching current session:', error));
    }

    // Fetch chats for the current user
    function fetchChats() {
        const chatType = document.getElementById('chat-type').value;
        return fetch(`/chats/${chatType}`)
            .then(response => response.json())
            .then(chats => {
                chatList.innerHTML = '';
                chats.forEach(chat => {
                    const li = document.createElement('li');
                    li.textContent = chat.chat_name;
                    li.dataset.chat = chat.id;
                    li.addEventListener('click', () => {
                        currentChatId = chat.id;
                        document.getElementById('current-chat-id').value = currentChatId;
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
                    addMessageToDOM({
                        id: data.id,
                        message,
                        username: currentUsername,
                        user_id: currentUserId,
                        senttime: new Date()
                    }, true);
                    input.value = ''; // Clear input after sending
                })
                .catch(error => console.error('Error sending message:', error));
        }
    }

    function addMessageToDOM(msg, isCurrentUser) {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add(isCurrentUser ? 'right' : 'left', 'message-container');
        messageContainer.setAttribute('data-id', msg.id);
        messageContainer.setAttribute('data-user-id', msg.user_id);

        const usernameLabel = document.createElement('div');
        usernameLabel.classList.add('user-id-label');
        usernameLabel.textContent = `${msg.username || 'Unknown User'}`;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.textContent = msg.message;
        messageDiv.dataset.messageId = msg.id; // Assign the message ID to the message div

        const timeLabel = document.createElement('div');
        timeLabel.classList.add('time-label');
        timeLabel.textContent = new Date(msg.senttime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageContainer.appendChild(usernameLabel);
        messageContainer.appendChild(messageDiv);
        messageContainer.appendChild(timeLabel);

        // Attach the event listener to the message container, ensuring the correct message ID is selected
        messageContainer.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            selectedMessageId = msg.id; // Set selectedMessageId directly from msg
            selectedMessageUserId = msg.user_id; // Set selectedMessageUserId directly from msg
            console.log(`Selected message ID: ${selectedMessageId}, User ID: ${selectedMessageUserId}`);
            showContextMenu(event);
        });

        chatBox.appendChild(messageContainer);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function showContextMenu(event) {
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;
        console.log(`Context menu shown at (${event.pageX}, ${event.pageY})`);
    }

    function hideContextMenu() {
        contextMenu.style.display = 'none';
    }

    function deleteMessage() {
        if (!selectedMessageId) {
            console.error('No message selected for deletion');
            return;
        }

        if (selectedMessageUserId !== currentUserId) {
            console.error('You can only delete your own messages');
            return;
        }

        console.log(`Deleting message with ID: ${selectedMessageId}`);
        fetch(`/delete-message/${selectedMessageId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error deleting message');
                }
                return response.json();
            })
            .then(data => {
                if (data.message === 'Message deleted') {
                    const messageElement = document.querySelector(`[data-message-id='${selectedMessageId}']`);
                    if (messageElement) {
                        messageElement.parentElement.remove(); // Remove the message container
                    }
                    hideContextMenu();
                } else {
                    console.error('Error deleting message:', data);
                }
            })
            .catch(error => console.error('Error deleting message:', error));
    }

    document.addEventListener('click', hideContextMenu);
    deleteOption.addEventListener('click', deleteMessage);

    fetchCurrentSession();

    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
});
