const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Import the knex instance
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173', // your React app's origin
  credentials: true, // allow credentials to be included
};

app.use(cors(corsOptions));

// Session setup
app.use(session({
  secret: '1869mgrinberglaunchesrivercontrol1909',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy for login
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    // Find user by email
    const user = await db('users').where({ email }).first();

    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return done(null, false, { message: 'Incorrect password.' });
    }

    // If credentials are valid, return the user
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await db('users').where({ id }).first();
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Auth Routes
// Register route
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db('users').insert({
      email,
      password: hashedPassword
    });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Failed to register user'});
  }
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: 'An error occurred during authentication' });
    }
    if (!user) {
      return res.status(401).json({ error: info.message || 'Invalid credentials' });
    }
    // Log the user in
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.status(500).json({ error: 'Login failed' });
      }
      req.session.isAuthenticated = true;
      req.session.isEditor = true; // or false based on your logic
      return res.json({ message: 'Logged in successfully', editor: user.editor });
    });
  })(req, res, next);
});

// Logout route
app.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Failed to logout' });
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/check-auth', (req, res) => {
  if (req.session.isAuthenticated) {
    return res.json({ isAuthenticated: true, isEditor: req.session.isEditor });
  }
  return res.json({ isAuthenticated: false, isEditor: false });
});

// API routes (boat-related routes unchanged)

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
    .select('boats_view.id', 'boats_view.lat', 'boats_view.lon', 'boats_view.boat_id', 'boats.name', 'boats.category', 'boats_view.rotation')
    .where({ view_name: view });
  res.json(boatsView);
});

app.post('/api/boats_view/insert', async (req, res) => {
  const { boat_id, lat, lon, view, rotation } = req.body;

  try {
    const existingBoat = await db('boats_view')
      .where({ id: boat_id, view_name: view })
      .first();

    if (existingBoat) {
      await db('boats_view')
        .where({ id: boat_id, view_name: view })
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


// Static file serving for production
app.use(express.static(path.join(__dirname, '..', 'dist'))); // Adjust path to the dist directory

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
if (require.main === module) {
  app.listen(8080, () => console.log('HOCR Map Server running on port 8080'));
}

module.exports = app; // Export the app for testing
