document.addEventListener('DOMContentLoaded', function() {
    var input = document.querySelector('.chat-input'); // Changed to class selector
    var button = document.querySelector('button');
    var chatBox = document.querySelector('.chat-box'); // Moved here and changed to class selector

    // Function to send message
    function sendMessage() {
        if (input.value.trim() !== '') {
            var newMessage = document.createElement('div');
            newMessage.classList.add('message'); // Apply message class
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
            event.preventDefault(); // Prevent the default action to stop form submission
            sendMessage();
        }
    });
});
