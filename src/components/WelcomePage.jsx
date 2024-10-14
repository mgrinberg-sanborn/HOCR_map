// src/components/WelcomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Typography, Box } from '@mui/material';
import '../WelcomePage.css';

const WelcomePage = () => {
  return (
    <div className="welcome-page">
      <Typography variant="h2" align="center" gutterBottom>
        A Head of the Charles Map Portal
      </Typography>

      <Typography variant="body1" align="center" paragraph>
        Generally inspired by{' '}
        <a href="https://hocr.org/hocr-venue-map/" target="_blank" rel="noopener noreferrer">
          https://hocr.org/hocr-venue-map/
        </a>
      </Typography>

      <Typography variant="h6" align="center" paragraph>
        This interactive map application allows you to:
      </Typography>

      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" mt={2} mb={4}>
        <Typography variant="body1" align="left" paragraph>
          🚗 <strong>Review parking maps</strong> for launches at MIT.
        </Typography>
        <Typography variant="body1" align="left" paragraph>
          🛶 <strong>River Control & Safety maps</strong> for traffic plans on Friday and Saturday/Sunday.
        </Typography>
        <Typography variant="body1" align="left" paragraph>
          🏠 <strong>Explore boathouses</strong> on the river, searchable by users or by boathouse name, complete with pictures.
        </Typography>
        <Typography variant="body1" align="left" paragraph>
        🖱️ <strong>Hover for position details</strong> or navigate directly to station URLs like 
        <Link to="/station/SaturdaySunday/RC05"><code>/station/SaturdaySunday/RC05</code></Link> or 
        <Link to="/station/Friday/RC22"><code>/station/Friday/RC22</code></Link>.
        </Typography>

      </Box>

      <Box display="flex" justifyContent="center" gap={2} mb={4}>
        <Link to="/Parking">
          <Button variant="contained" color="primary">Parking Launches Map</Button>
        </Link>
        <Link to="/station/SaturdaySunday">
          <Button variant="contained" color="secondary">River Control & Safety Maps</Button>
        </Link>
        <Link to="/boathouse-browser">
          <Button variant="contained" color="primary">Explore Boathouses</Button>
        </Link>
      </Box>

      <Typography variant="body2" align="center" paragraph style={{ fontStyle: 'italic', marginTop: '50px' }}>
        Built by Mark Grinberg with the support of the River Control and Launches Committees.
      </Typography>
    </div>
  );
};

export default WelcomePage;
