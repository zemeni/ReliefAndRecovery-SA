
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/');
    }
}

const getGeolocation = async (address) => {
    try {
        const apiKey = process.env.GOOGLE_API_KEY; // Replace with your actual Google API key
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
        const data = await response.json();

        if (data.status === 'OK') {
            const location = data.results[0].geometry.location;
            const addressComponents = data.results[0].address_components;

            // Extracting suburb and state (locality and administrative area)
            let suburb = '';
            let state = '';

            addressComponents.forEach(component => {
                if (component.types.includes('locality')) {
                    suburb = component.long_name;
                }
                if (component.types.includes('administrative_area_level_1')) {
                    state = component.short_name; // Use short_name for state abbreviations (e.g., "SA")
                }
            });

            return {
                lat: location.lat,
                lng: location.lng,
                suburb: `${suburb} ${state}` // Format: 'Marion SA'
            };
        } else {
            console.error(`Geocoding error: ${data.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching geolocation: ${error}`);
        return null;
    }
}


const formatOpeningHours = center => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return daysOfWeek.map(day => {
        const openTime = center[`${day.toLowerCase()}_open`];
        const closeTime = center[`${day.toLowerCase()}_close`];

        if (!openTime || !closeTime) {
            return `${day} closed`;
        }

        return `${day} ${formatTime(openTime)} - ${formatTime(closeTime)}`;
    });
};


const formatTime = time => {
    const [hours, minutes] = time.split(':');
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${suffix}`;
};

module.exports = {isAuthenticated, getGeolocation, formatOpeningHours, formatTime};
