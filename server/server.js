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
  try {
    const boats = await db('boats')
      .orderBy('category') // Order by category first
      .orderBy('number', 'asc'); // Order by number field in ascending order (change 'asc' to 'desc' if you want descending)
    
    res.json(boats);
  } catch (error) {
    console.error('Error fetching boats:', error);
    res.status(500).json({ error: 'An error occurred while fetching boats.' });
  }
});

app.get('/api/boats_view/:view', async (req, res) => {
  const { view } = req.params;
  const boatsView = await db('boats_view')
    .join('boats', 'boats_view.boat_id', '=', 'boats.id')
    .select('boats_view.id', 'boats_view.lat', 'boats_view.lon', 'boats_view.boat_id', 'boats.name', 'boats.category')
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

// Delete a boat from the view
app.delete('/api/boats_view/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Delete the boat from the boats_view table based on the boat_id
    const deletedRows = await db('boats_view')
      .where({ id })
      .del();

    if (deletedRows) {
      res.status(200).json({ success: true, message: 'Boat deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Boat not found' });
    }
  } catch (error) {
    console.error('Error deleting boat:', error);
    res.status(500).json({ success: false, message: 'Failed to delete boat' });
  }
});



if (require.main === module) {
  app.listen(8080, () => console.log('HOCR Map Server running on port 8080'));
}

module.exports = app; // Export the app for testing
