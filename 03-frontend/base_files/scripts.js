document.addEventListener('DOMContentLoaded', () => {
    // Check user authentication and handle login visibility
    checkAuthentication();
    
    // Handle login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await loginUser(email, password);

                if (response.ok) {
                    const data = await response.json();
                    // Set the cookie with SameSite=None; Secure
                    document.cookie = `token=${data.access_token}; path=/; SameSite=None; Secure`;
                    window.location.href = 'index.html';
                } else {
                    const errorData = await response.json();
                    alert('Login failed: ' + (errorData.msg || response.statusText));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during login. Please try again.');
            }
        });
    }

    // Fetch and populate the country filter dropdown
    populateCountryFilter();
});

async function loginUser(email, password) {
    const response = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    return response;
}

function checkAuthentication() {
    const token = getCookie('token');
    console.log('Token:', token); // Debug
    const loginLink = document.getElementById('login-link');

    if (!token) {
        loginLink.style.display = 'block';
    } else {
        loginLink.style.display = 'none';
        // Fetch places data if the user is authenticated
        fetchPlaces(token);
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

async function fetchPlaces(token) {
    try {
        const response = await fetch('http://127.0.0.1:5000/places', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const places = await response.json();
            displayPlaces(places);
        } else {
            console.error('Failed to fetch places:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching places:', error);
    }
}

function displayPlaces(places) {
    const placesList = document.getElementById('places-list');
    placesList.innerHTML = ''; // Clear existing content

    places.forEach(place => {
        const placeElement = document.createElement('div');
        placeElement.className = 'place-card';
        placeElement.innerHTML = `
            <h3>${place.host_name} - ${place.city_name}, ${place.country_name}</h3>
            <p>${place.description}</p>
            <p><strong>Price:</strong> $${place.price_per_night} per night</p>
        `;
        placesList.appendChild(placeElement);
    });
}

async function populateCountryFilter() {
    try {
        const response = await fetch('http://127.0.0.1:5000/countries');
        if (response.ok) {
            const countries = await response.json();
            const countryFilter = document.getElementById('country-filter');
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = 'All';
            defaultOption.textContent = 'All Countries';
            countryFilter.appendChild(defaultOption);

            // Populate dropdown with countries
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                countryFilter.appendChild(option);
            });

            // Add event listener for filtering places
            countryFilter.addEventListener('change', (event) => {
                const selectedCountry = event.target.value;
                filterPlacesByCountry(selectedCountry);
            });
        } else {
            console.error('Failed to fetch countries:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching countries:', error);
    }
}

function filterPlacesByCountry(country) {
    const placesList = document.getElementById('places-list');
    const places = placesList.getElementsByClassName('place-card');

    Array.from(places).forEach(place => {
        const placeCountry = place.querySelector('h3').textContent.split(', ').pop();
        if (country === 'All' || placeCountry === country) {
            place.style.display = 'block';
        } else {
            place.style.display = 'none';
        }
    });
}
