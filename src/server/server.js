const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db'); // Import the knex instance

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', async (req, res) => {
    res.send('Hello World');
});

// Fetch all boats
app.get('/boats', async (req, res) => {
  const boats = await db('boats').select();
  res.json(boats);
});

// Fetch boats for a specific view
app.get('/boats_view/:view', async (req, res) => {
  const { view } = req.params;
  const boatsView = await db('boats_view').where({ view_name: view });
  res.json(boatsView);
});

// Save boat positions in a view
app.post('/boats_view', async (req, res) => {
  const { view_name, boats } = req.body;
  await db('boats_view').insert(boats.map(boat => ({
    view_name,
    boat_id: boat.id,
    lat: boat.lat,
    lon: boat.lon
  })));
  res.status(201).json({ success: true });
});

if (require.main === module) {
    app.listen(3001, () => console.log('HOCR Map Server running on port 8080'));
}

module.exports = app; // Export the app for testing
