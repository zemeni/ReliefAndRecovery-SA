document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;


    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    console.log("result after login ",result);
    if (result.success) {
        //store email in session storage
        sessionStorage.setItem("userEmail", result.email);
        // Redirect to the desired page after successful login
        window.location.href = '/dashboard';
    } else {
        alert('Login failed: ' + result.message);
    }
});
