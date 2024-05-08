document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => {
        console.log('Response:', response);
        return response.json();
    })
    .then(data => {
        console.log('Data:', data);
        if (data.success) {
            window.location.href = '/chat';
        } else {
            alert('Login failed!');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        alert('Login process encountered an error. Please try again.');
    });
});
