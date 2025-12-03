require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.CWA_API_KEY;

app.use(cors());
app.use(express.static('public'));

// Endpoint to get weather for ALL cities
app.get('/api/weather', async (req, res) => {
    if (!API_KEY) {
        return res.status(500).json({ error: 'API Key not configured' });
    }

    try {
        // Fetch 36-hour forecast for all counties (F-C0032-001)
        const response = await axios.get(
            `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${API_KEY}`
        );

        const rawData = response.data.records.location;

        // Process data into a clean list
        const cities = rawData.map(location => {
            const weather = location.weatherElement.reduce((acc, curr) => {
                const value = curr.time[0].parameter.parameterName;
                const unit = curr.time[0].parameter.parameterUnit || '';
                acc[curr.elementName] = `${value}${unit}`;
                return acc;
            }, {});

            return {
                name: location.locationName,
                condition: weather.Wx || 'N/A', // Weather Description
                pop: weather.PoP ? `${weather.PoP}%` : '0%', // Probability of Precipitation
                minTemp: weather.MinT ? `${weather.MinT}°C` : '',
                maxTemp: weather.MaxT ? `${weather.MaxT}°C` : '',
            };
        });

        res.json({ success: true, data: cities });

    } catch (error) {
        console.error('Error fetching CWA data:', error.message);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});