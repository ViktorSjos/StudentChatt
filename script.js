function sendMessage() {
    var input = document.getElementById('chat-input');
    if (input.value.trim() !== '') {
        var chatBox = document.getElementById('chat-box');
        var newMessage = document.createElement('div');
        newMessage.textContent = input.value;
        chatBox.appendChild(newMessage);
        input.value = ''; // Clear the input after sending
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
    }
}
