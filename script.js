document.addEventListener('DOMContentLoaded', function() {
    var input = document.getElementById('chat-input');
    var button = document.querySelector('button');

    // Function to send message
    function sendMessage() {
        if (input.value.trim() !== '') {
            var chatBox = document.getElementById('chat-box');
            var newMessage = document.createElement('div');
            newMessage.textContent = input.value;
            chatBox.appendChild(newMessage);
            input.value = ''; // Clear the input after sending
            chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
        }
    }

    // Event listener for the button click
    button.addEventListener('click', sendMessage);

    // Event listener for the enter key
    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
});