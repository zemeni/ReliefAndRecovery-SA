document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting the default way

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');

    // Clear previous error messages
    passwordError.textContent = '';
    confirmPasswordError.textContent = '';

    // Standard password policy
    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordPolicy.test(password)) {
        passwordError.textContent = 'Password must be at least 8 characters long, contain one uppercase, one lowercase, one number, and one special character.';
        return;
    }

    if (password !== confirmPassword) {
        confirmPasswordError.textContent = 'Passwords do not match';
        return;
    }

    // Proceed with the form submission (e.g., send data to the server)
    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/';
            } else {
                passwordError.textContent = 'Sign up failed. Please try again.';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            passwordError.textContent = 'An error occurred. Please try again later.';
        });
});
