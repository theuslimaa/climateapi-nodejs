let map;
let marker;
let autocomplete;

function initMap() {
    // Initializes the map centered in São Paulo
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -23.5505, lng: -46.6333 },
        zoom: 10,
        disableDefaultUI: true,
        draggable: false,
        mapTypeId: 'hybrid',
    });

    // Sets up autocomplete for the input field
    const input = document.getElementById("city-input");
    autocomplete = new google.maps.places.Autocomplete(input);

    // Adds a listener for when a location is selected
    autocomplete.addListener("place_changed", onPlaceChanged);
}
// Updates the map and marker when a location is selected using autocomplete.
function onPlaceChanged() {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
        alert("No details available for input: '" + place.name + "'");
        return;
    }

    // Centers the map on the selected location
    map.setCenter(place.geometry.location);
    map.setZoom(15);

    // Removes the previous marker, if it exists
    if (marker) marker.setMap(null);

    // Adds a new marker
    marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
    });

    // Calls the function to fetch weather data
    fetchWeatherData(place.geometry.location.lat(), place.geometry.location.lng());
}

// Allows users to search for a location manually and fetch weather data.
function searchWeatherByCity() {
    const city = document.getElementById("city-input").value;

    if (!city){
        alert("Please enter a location.");
        return;
    }
    // If the user does not select a suggestion from autocomplete
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: city }, (results, status) => {
        if (status === "OK" && results[0]) {
            const location = results[0].geometry.location;

            // Centers the map and adds a marker
            map.setCenter(location);
            map.setZoom(15);

            if (marker) marker.setMap(null);
            marker = new google.maps.Marker({
                position: location,
                map: map,
            });

            // Calls the function to fetch weather data
            fetchWeatherData(location.lat(), location.lng());
        } else {
            alert("Location not found.");
        }
    });
}

//  Fetches weather data from the backend using latitude and longitude.
async function fetchWeatherData(lat, lng) {
    try {
        const response = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
        const weatherData = await response.json();

        //Logs the received data for debugging
        console.log("Weather data received:", weatherData);

        displayWeather(weatherData);
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
}

// Renders the current weather and weekly forecast in the UI.
function displayWeather(data) {
    if (!data) {
        console.error("No climate data to exibit.");
        return;
    }

    // Displays current weather details
    const currentWeather = document.getElementById("current-weather");
    currentWeather.innerHTML = 
        `<h3>${data.location}</h3>
        <p>Current temperature: ${data.temp}°C</p>
        <p>Condition: ${data.condition}</p>`
    ;

    // Displays the weekly forecast
    if (data.weekly && data.weekly.length > 0) {
        const nextDayForecast = document.getElementById("nextDay");
        nextDayForecast.innerHTML = `
            <h2>Forecast for tomorrow</h2>
            ${data.weekly
                .filter((_, index) => index > 1) //Ignore the first day
                .map(day => {
                    const forecastDate = new Date(day.date);
                    const formattedDate = forecastDate.toLocaleDateString('en-US');
                    const weekdayName = forecastDate.toLocaleDateString('en-US', { weekday: 'long'});

                    return `
                        <div>
                            <p><strong>${formattedDate} (${weekdayName})</strong>: ${day.condition} with the temperature reaching ${day.avg_temp}°C</p>
                        </div>
                    `;
            }).join('')}
        `;
    } else {
        console.error("Weekly forecast unavailable.");
        document.getElementById("nextDay").innerHTML = `<p>No forecast data available.</p>`
    }
}

// Initialize the map after the page loaded
window.onload = initMap;