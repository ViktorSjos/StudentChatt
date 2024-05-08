document.addEventListener('DOMContentLoaded', function () {
    const chatBox = document.querySelector('.chat-box');
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatList = document.getElementById('chat-list'); // Ensure this ID is on your chat list in HTML
    let currentUserId = 1; // Adjust this to the logged-in user's ID
    let currentMessageId;

    function sendMessage() {
        const message = input.value.trim();
        if (message) {
            fetch('/send-message', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ message, userid: currentUserId })
            })
            .then(response => response.json())
            .then(data => {
                addMessageToDOM(data, true);
                input.value = ''; // Clear input after sending
            })
            .catch(error => console.error('Error sending message:', error));
        }
    }

    function addMessageToDOM(msg, isCurrentUser) {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add(isCurrentUser ? 'right' : 'left', 'message-container');
        messageContainer.setAttribute('data-id', msg.id);

        const userIdLabel = document.createElement('div');
        userIdLabel.classList.add('user-id-label');
        userIdLabel.textContent = `User ID: ${msg.userid}`;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.textContent = msg.message;

        const timeLabel = document.createElement('div');
        timeLabel.classList.add('time-label');
        timeLabel.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

        messageContainer.appendChild(userIdLabel);
        messageContainer.appendChild(messageDiv);
        messageContainer.appendChild(timeLabel);

        chatBox.appendChild(messageContainer);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });

    fetch('/get-messages')
        .then(response => response.json())
        .then(messages => {
            messages.forEach(message => {
                addMessageToDOM(message, message.userid === currentUserId);
            });
        })
        .catch(error => console.error('Error loading messages:', error));

    chatList.addEventListener('click', function (event) {
        if (event.target.tagName === 'LI' && !event.target.classList.contains('active')) {
            Array.from(chatList.children).forEach(child => child.classList.remove('active'));
            event.target.classList.add('active');
            fetch(`/get-messages/${event.target.dataset.chat}`) // Assuming data-chat contains the chat ID
                .then(response => response.json())
                .then(messages => {
                    chatBox.innerHTML = '';
                    messages.forEach(message => addMessageToDOM(message, message.userid === currentUserId));
                })
                .catch(error => console.error('Error loading messages:', error));
        }
    });

    chatBox.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        const contextMenu = document.getElementById('context-menu');
        const targetMessage = event.target.closest('.message-container');
        if (targetMessage) {
            currentMessageId = targetMessage.getAttribute('data-id');
            contextMenu.style.left = `${event.pageX}px`;
            contextMenu.style.top = `${event.pageY}px`;
            contextMenu.style.display = 'block';
        }
    });

    document.addEventListener('click', function () {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.display = 'none';
    });

    function deleteMessage() {
        if (!currentMessageId) return;
        fetch(`/delete-message/${currentMessageId}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    document.querySelector(`.message-container[data-id="${currentMessageId}"]`).remove();
                }
            })
            .catch(error => console.error('Error deleting message:', error));
    }

    document.getElementById('delete-option').addEventListener('click', deleteMessage);
});
