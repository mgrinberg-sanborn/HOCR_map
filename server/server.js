const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Import the knex instance

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, '..', 'dist'))); // Adjust path to the dist directory

// API routes
app.get('/api/boats', async (req, res) => {
  const boats = await db('boats').select();
  res.json(boats);
});

app.get('/api/boats_view/:view', async (req, res) => {
  const { view } = req.params;
  const boatsView = await db('boats_view')
    .join('boats', 'boats_view.boat_id', '=', 'boats.id')
    .where({ view_name: view });
  res.json(boatsView);
});

app.post('/api/boats_view/insert', async (req, res) => {
  const { boat_id, lat, lon, view, rotation } = req.body;

  try {
    const existingBoat = await db('boats_view')
      .where({ boat_id, view_name: view })
      .first();

    if (existingBoat) {
      await db('boats_view')
        .where({ boat_id, view_name: view })
        .update({ lat, lon, rotation });

      res.status(200).send('Boat position updated');
    } else {
      await db('boats_view').insert({
        boat_id,
        lat,
        lon,
        rotation,
        view_name: view,
      });

      res.status(200).send('Boat position inserted');
    }
  } catch (error) {
    console.error('Error inserting/updating boat position', error);
    res.status(500).send('Server error');
  }
});

// Redirect all other routes to the Vite build
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html')); // Adjust path to the dist directory
});

if (require.main === module) {
  app.listen(8080, () => console.log('HOCR Map Server running on port 8080'));
}

module.exports = app; // Export the app for testing
