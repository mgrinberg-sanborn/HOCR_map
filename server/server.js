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
  const boatsView = await db('boats_view')
  .join('boats', 'boats_view.boat_id', '=', 'boats.id')
  .where({ view_name: view });
  res.json(boatsView);
});

app.post('/boats_view/insert', async (req, res) => {
  const { boat_id, lat, lon, view } = req.body;

  try {
    // Check if the boat already exists in the 'boats_view' table for the given view
    const existingBoat = await db('boats_view')
      .where({ boat_id, view_name: view })
      .first();

    if (existingBoat) {
      // Update the boat's position
      await db('boats_view')
        .where({ boat_id, view_name: view })
        .update({
          lat,
          lon,
        });

      res.status(200).send('Boat position updated');
    } else {
      // Insert a new boat position
      await db('boats_view').insert({
        boat_id,
        lat,
        lon,
        view_name: view,
      });

      res.status(200).send('Boat position inserted');
    }
  } catch (error) {
    console.error('Error inserting/updating boat position', error);
    res.status(500).send('Server error');
  }
});

if (require.main === module) {
    app.listen(3001, () => console.log('HOCR Map Server running on port 3001'));
}

module.exports = app; // Export the app for testing
