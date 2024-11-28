const response = await fetch(`api/auth/msal_key`, {
    headers: {
        'Content-Type': 'application/json'
    },
});
const data = await response.json();

// MSAL Configuration
const msalConfig = {
    auth: {
        clientId: data.clientId,
        authority: `https://login.microsoftonline.com/${data.tenantId}`,
        redirectUri: data.redirectURI,
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

// Login Request
const loginRequest = {
    scopes: ["user.read"]
};

// Login Button Event Listener
document.getElementById("loginButton").addEventListener("click", () => {
    msalInstance.loginRedirect(loginRequest);
});

// Handle the redirect response
msalInstance.handleRedirectPromise()
    .then(async (response) => {
        if (response) {
            const idToken = response.idToken;

            // Send the token to your backend for verification
            const loginResponse = await fetch('api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                }
            });

            const result = await loginResponse.json();
            if (result.success) {
                sessionStorage.setItem("name", result.name);
                sessionStorage.setItem("userEmail", result.email);
                sessionStorage.setItem("idToken", idToken);

                window.location.href = '/dashboard';
            } else {
                console.error("Login failed", result.message);
            }
        }
    })
    .catch((error) => {
        console.error("Login failed", error);
    });


