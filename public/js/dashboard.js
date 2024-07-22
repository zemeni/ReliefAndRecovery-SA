let editingId = null;

console.log("inside script.js");

document.addEventListener('DOMContentLoaded', () => {
    const profileIcon = document.querySelector('.profile-icon');
    const logoutMenu = document.getElementById('logoutMenu');
    const logoutButton = document.getElementById('logoutButton');

    const email = sessionStorage.getItem("userEmail");
    if(email) {
        document.getElementById("userEmail").textContent = email;
    } else {
        document.getElementById("userEmail").textContent = `something went wrong`;
    }

    profileIcon.addEventListener('click', () => {
        const isMenuVisible = logoutMenu.style.display === 'block';
        logoutMenu.style.display = isMenuVisible ? 'none' : 'block';
    });

    // Hide logout menu if clicked outside
    document.addEventListener('click', (event) => {
        if (!profileIcon.contains(event.target) && !logoutMenu.contains(event.target)) {
            logoutMenu.style.display = 'none';
        }
    });

    // Handle logout button click
    logoutButton.addEventListener('click', async () => {
        // Send request to logout endpoint
        await fetch('/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        // Redirect to login page
        window.location.href = '/login';
    });
});



document.getElementById('communityForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = {
        category: document.getElementById('category').value,
        WarningLevel: document.getElementById('WarningLevel').value,
        center_status: document.getElementById('center_status').value,
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

    convertAddressToGeocode(formData.location);

    if (editingId) {
        const response = await fetch(`/api/centers/${editingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Community center updated successfully!');
            editingId = null;
            document.getElementById('communityForm').reset();
        } else {
            alert('Error updating community center.');
        }
    } else {
        console.log("form data is ::", formData);
        const response = await fetch('/api/centers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Community center added successfully!');
            document.getElementById('CommunityForm').reset();
        } else {
            alert('Error adding community center.');
        }
    }

    loadCommunityCenters();
});

async function loadCommunityCenters() {
    const response = await fetch('/api/centers');
    const data = await response.json();

    console.log("I'm getting following data::", data);

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
<!--            <td>${center.id}</td>-->
            <td><a href="https://www.google.com/maps/search/?api=1&query=${encodedAddress}" target="_blank">${center.areaDesc}</a></td>
<!--            <td>${center.areaDesc}</td>-->
            <td>${formattedOpens}</td>
            <td>${formattedServices}</td>
            <td><a href="${center.web}" target="_blank">${center.web}</a></td>
            <td>${center.center_status}</td>
            <td>${center.updated}</td>
            <td>${center.added_by}</td>
            <td>${center.updated_by}</td>
            <td>${center.deleted}</td>
            <td>${center.disabled}</td>
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

    console.log("edit center data is ", center);

    document.getElementById('location').value = center.location;
    document.getElementById('category').value = center.category;
    document.getElementById('center_status').value = center.center_status;
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
    if (confirm('Are you sure you want to delete this community center?')) {
        const response = await fetch(`/api/centers/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Community center deleted successfully!');
            loadCommunityCenters();
        } else {
            alert('Error deleting community center.');
        }
    }
}

async function convertAddressToGeocode(address) {
    console.log("converting address to geocode");
    const apiKey = 'AIzaSyBzOoy52QJa0Offg7IvXQB9TBRsPCvCQYA'; // Replace with your actual API key
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if(data.status === 'OK') {
            const result = data.results[0].geometry.location;
            console.log("geocode is ::", result);
        }else {
            throw new Error('Error converting address to Geocode')
        }
    }catch (error) {
        console.error('Error fetching geocode:', error);
        throw error;
    }
}

document.getElementById('logoutButton').addEventListener('click', () => {
    console.log("logout button clicked!");

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
});


// Load community centers on page load
loadCommunityCenters();

