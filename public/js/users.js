document.addEventListener('DOMContentLoaded', () => {

    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    console.log("is Admin? ", isAdmin);
    const usersLink = document.getElementById('usersLink');

    // Show the users link if the user is an admin
    if (isAdmin) {
        usersLink.style.display = 'block';
    }
    console.log("inside users page");
    loadUsers();
});

let changes = {}; // Store changes here

async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log("data received ", data);
        populateTable(data);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function populateTable(users) {
    const tableBody = document.querySelector('#usersTable tbody');
    tableBody.innerHTML = ''; // Clear existing content

    users.forEach((user, index) => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${user.email}</td>
            <td><input type="checkbox" class="active-checkbox" data-id="${user.id}" ${user.active ? 'checked' : ''}></td>
            <td><input type="checkbox" class="admin-checkbox" data-id="${user.id}" ${user.isadmin ? 'checked' : ''}></td>
            <td>${new Date(user.created_at).toLocaleString()}</td>
            <td><button class="edit-btn" data-id="${user.id}">Update</button></td>
        `;

        tableBody.appendChild(row);
    });

    // Add event listeners for checkboxes and edit buttons
    document.querySelectorAll('.active-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });

    document.querySelectorAll('.admin-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', handleEdit);
    });
}

function handleCheckboxChange(event) {
    const userId = event.target.getAttribute('data-id');
    const isChecked = event.target.checked;
    const key = event.target.classList.contains('active-checkbox') ? 'active' : 'isadmin';

    // Store changes in the changes object
    if (!changes[userId]) {
        changes[userId] = {};
    }
    changes[userId][key] = isChecked;
}

async function handleEdit(event) {
    const userId = event.target.getAttribute('data-id');
    const userChanges = changes[userId] || {};

    if (Object.keys(userChanges).length === 0) {
        alert('No changes to save.');
        return;
    }

    const confirm = window.confirm('Do you want to save these changes?');

    if (confirm) {
        try {
            await Promise.all([
                userChanges.active !== undefined ? fetch(`/api/users/${userId}/active`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({active: userChanges.active})
                }) : Promise.resolve(),

                userChanges.isadmin !== undefined ? fetch(`/api/users/${userId}/admin`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({isadmin: userChanges.isadmin})
                }) : Promise.resolve()
            ]);

            alert('Changes saved successfully.');
            loadUsers(); // Refresh the users table
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Error saving changes. Please try again.');
        }

        // Clear changes after saving
        delete changes[userId];
    }
}

document.getElementById('logoutButton').addEventListener('click', () => {
    console.log("logout button clicked!");

    const confirm = window.confirm('Are you sure you want to logout?');

    if (confirm) {
        fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/';
                } else {
                    alert('Logout failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
});
