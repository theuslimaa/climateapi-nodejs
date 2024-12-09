import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

app.use(express.static('public'));

app.get('/api/gmaps-key', (req, res) => {
    const apiKey = process.env.GMAPS_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Google Maps API key is not configured"});
    }
    res.json({apiKey});
})

app.get('/api/weather', async (req, res) => {
    const { lat, lng, city } = req.query;
    let url = '';

    // Constructs the WeatherAPI URL based on the parameters
    if (city) {
        url = `http://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${city}&days=3&aqi=no&alerts=no`;
    } else if (lat && lng) {
        url = `http://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lng}&days=3&aqi=no&alerts=no`;
    } else {
        res.status(400).send('Request error');
        return;
    }

    try {
        // Sends a request to the WeatherAPI
        const response = await axios.get(url);
        const weatherData = response.data;

        // Formats the response for the frontend
        const result = {
            location: weatherData.location.name,
            temp: weatherData.current.temp_c,
            condition: weatherData.current.condition.text,
            weekly: weatherData.forecast.forecastday.map(day => ({
                date: day.date,
                avg_temp: day.day.avgtemp_c,
                condition: day.day.condition.text
            }))
        };
        // Sends the formatted data as a JSON response
        res.json(result);
    } catch (error) {
        // Logs and handles any errors
        console.error('Error fetching climate data:', error);
        res.status(500).send('Error fetching climate data');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at => http://localhost:${PORT}`);
});