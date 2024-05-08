document.addEventListener('DOMContentLoaded', function () {
    const chatBox = document.querySelector('.chat-box');
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    let currentMessageId;

    // Function to send messages
    function sendMessage() {
        const message = input.value.trim();
        if (message) {
            fetch('/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message, userid: 1 })
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log('Message sent:', data);

                    const messageContainer = document.createElement('div');
                    messageContainer.classList.add('message-container', 'right');
                    messageContainer.setAttribute('data-id', data.id);

                    const userIdLabel = document.createElement('div');
                    userIdLabel.classList.add('user-id-label');
                    userIdLabel.textContent = `User ID: ${1}`;

                    const messageDiv = document.createElement('div');
                    messageDiv.classList.add('message');
                    messageDiv.textContent = message;

                    const timeLabel = document.createElement('div');
                    timeLabel.classList.add('time-label');
                    timeLabel.textContent = new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    });

                    messageContainer.appendChild(userIdLabel);
                    messageContainer.appendChild(messageDiv);
                    messageContainer.appendChild(timeLabel);

                    chatBox.appendChild(messageContainer);
                    chatBox.scrollTop = chatBox.scrollHeight;

                    input.value = ''; // Clear input after sending
                })
                .catch((error) => console.error('Error sending message:', error));
        }
    }

    sendButton.addEventListener('click', sendMessage);

    input.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            sendMessage();
        }
    });

    // Fetch and display messages on page load
    fetch('/get-messages')
        .then((response) => response.json())
        .then((messages) => {
            messages.forEach((msg) => {
                const messageContainer = document.createElement('div');
                messageContainer.classList.add(msg.userid === 1 ? 'right' : 'left', 'message-container');
                messageContainer.setAttribute('data-id', msg.id);

                const userIdLabel = document.createElement('div');
                userIdLabel.classList.add('user-id-label');
                userIdLabel.textContent = `User ID: ${msg.userid}`;

                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message');
                messageDiv.textContent = msg.message;

                const timeLabel = document.createElement('div');
                timeLabel.classList.add('time-label');
                timeLabel.textContent = msg.senttime;

                messageContainer.appendChild(userIdLabel);
                messageContainer.appendChild(messageDiv);
                messageContainer.appendChild(timeLabel);

                chatBox.appendChild(messageContainer);
                chatBox.scrollTop = chatBox.scrollHeight;
            });
        })
        .catch((error) => console.error('Error loading messages:', error)); 

    // Context menu handling
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

    // Hide context menu when clicking elsewhere
    document.addEventListener('click', function () {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.display = 'none';
    });

    // Define deleteMessage function
    function deleteMessage() {
        if (!currentMessageId) return;

        fetch(`/delete-message/${currentMessageId}`, {
            method: 'DELETE',
        })
            .then((response) => {
                if (response.ok) {
                    const messageElement = document.querySelector(
                        `.message-container[data-id="${currentMessageId}"]`
                    );
                    if (messageElement) {
                        messageElement.remove(); // Remove from chat box
                    }
                }
            })
            .catch((error) => console.error('Error deleting message:', error));
    }

    // Attach event listener for deletion
    document.getElementById('delete-option').addEventListener('click', deleteMessage);
});
