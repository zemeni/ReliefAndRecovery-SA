let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    const usersLink = document.getElementById('usersLink');

    // Show the users link if the user is an admin
    if (isAdmin) {
        usersLink.style.display = 'block';
    }
});



document.getElementById('communityForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = {
        category: document.getElementById('category').value,
        WarningLevel: document.getElementById('WarningLevel').value,
        // center_status: document.getElementById('center_status').value,
        monday_open: document.getElementById('monday_open').value !== '' ? document.getElementById('monday_open').value: null,
        monday_close: document.getElementById('monday_close').value !== '' ? document.getElementById('monday_close').value: null,
        tuesday_open: document.getElementById('tuesday_open').value !== '' ? document.getElementById('tuesday_open').value: null,
        tuesday_close: document.getElementById('tuesday_close').value !== '' ? document.getElementById('tuesday_close').value: null,
        wednesday_open: document.getElementById('wednesday_open').value !== '' ? document.getElementById('wednesday_open').value: null,
        wednesday_close: document.getElementById('wednesday_close').value !== '' ? document.getElementById('wednesday_close').value: null,
        thursday_open: document.getElementById('thursday_open').value !== '' ? document.getElementById('thursday_open').value: null,
        thursday_close: document.getElementById('thursday_close').value !== '' ? document.getElementById('thursday_close').value: null,
        friday_open: document.getElementById('friday_open').value !== '' ? document.getElementById('friday_open').value: null,
        friday_close: document.getElementById('friday_close').value !== '' ? document.getElementById('friday_close').value: null,
        saturday_open: document.getElementById('saturday_open').value !== '' ? document.getElementById('saturday_open').value: null,
        saturday_close: document.getElementById('saturday_close').value !== '' ? document.getElementById('saturday_close').value: null,
        sunday_open: document.getElementById('sunday_open').value !== '' ? document.getElementById('sunday_open').value: null,
        sunday_close: document.getElementById('sunday_close').value !== '' ? document.getElementById('sunday_close').value: null,
        location: document.getElementById('location').value,
        services_available: document.getElementById('services_available').value.split(',').map(item => item.trim()),
        website: document.getElementById('website').value,
        added_by: document.getElementById('added_by').value,
        updated_by: document.getElementById('updated_by').value
    };

    if (editingId) {
        const response = await fetch(`/api/centers/${editingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Community centre updated successfully!');
            editingId = null;
            document.getElementById('communityForm').reset();
        } else {
            alert('Error updating community centre.');
        }
    } else {
        const response = await fetch('/api/centers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Community centre added successfully!');
            document.getElementById('communityForm').reset();
        } else {
            alert('Error adding community centre.');
        }
    }

    loadCommunityCenters();
});

async function loadCommunityCenters() {
    console.log("loading community centres");
    const response = await fetch('/api/centers');
    const data = await response.json();

    const tbody = document.getElementById('communityTable').querySelector('tbody');
    tbody.innerHTML = '';

    data.forEach(center => {
        const row = document.createElement('tr');

        // Format the opens attribute
        const formattedOpens = center.opens.map(day => `<div class="open-time">${day}</div>`).join('');
        const formattedServices = center.services.map(service => `<div class="service">${service}</div>`).join('');
        // Encode the address for use in the URL
        const encodedAddress = encodeURIComponent(center.areaDesc);

        row.innerHTML = `
            <td>${center.category}</td>
            <td><a href="https://www.google.com/maps/search/?api=1&query=${encodedAddress}" target="_blank">${center.areaDesc}</a></td>
            <td>${formattedOpens}</td>
            <td>${formattedServices}</td>
            <td><a href="${center.web}" target="_blank">${center.web}</a></td>
            <td>${center.updated}</td>
            <td>${center.added_by}</td>
            <td>${center.updated_by ? center.updated_by : ''}</td>
            <td>
                <div class="buttons">
                    <button class="button1" onclick="editCenter(${center.id})">Edit</button>
                    <button class="button2" onclick="deleteCenter(${center.id})">Delete</button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

async function editCenter(id) {
    const response = await fetch(`/api/centers/${id}`);
    const center = await response.json();

    document.getElementById('location').value = center.location;
    document.getElementById('category').value = center.category;
    document.getElementById('WarningLevel').value = center.warning_level;
    document.getElementById('monday_open').value = center.monday_open;
    document.getElementById('monday_close').value = center.monday_close;
    document.getElementById('tuesday_open').value = center.tuesday_open;
    document.getElementById('tuesday_close').value = center.tuesday_close;
    document.getElementById('wednesday_open').value = center.wednesday_open;
    document.getElementById('wednesday_close').value = center.wednesday_close;
    document.getElementById('thursday_open').value = center.thursday_open;
    document.getElementById('thursday_close').value = center.thursday_close;
    document.getElementById('friday_open').value = center.friday_open;
    document.getElementById('friday_close').value = center.friday_close;
    document.getElementById('saturday_open').value = center.saturday_open;
    document.getElementById('saturday_close').value = center.saturday_close;
    document.getElementById('sunday_open').value = center.sunday_open;
    document.getElementById('sunday_close').value = center.sunday_close;
    document.getElementById('services_available').value = center.services_available.join(', ');
    document.getElementById('website').value = center.website;
    document.getElementById('added_by').value = center.added_by;
    document.getElementById('updated_by').value = center.updated_by;

    editingId = id;
}

async function deleteCenter(id) {
    if (confirm('Are you sure you want to delete this community centre?')) {
        const response = await fetch(`/api/centers/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Community centre deleted successfully!');
            loadCommunityCenters();
        } else {
            alert('Error deleting community centre.');
        }
    }
}

document.getElementById('logoutButton').addEventListener('click', () => {

    const confirm = window.confirm('Are you sure you want to logout?');

    if(confirm) {
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



// Load community centers on page load
loadCommunityCenters();

