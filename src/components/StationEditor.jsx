// src/components/StationEditor.jsx

import React, { useEffect, useState } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Button,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';

const StationEditor = () => {
  const [boats, setBoats] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchBoats = async () => {
      const response = await fetch('http://localhost:8080/api/boats'); // Adjust the endpoint accordingly
      const data = await response.json();
      setBoats(data);
    };

    fetchBoats();
  }, []);

  const handleInputChange = (index, field, value) => {
    const updatedBoats = [...boats];
    updatedBoats[index][field] = value; // Update the specific field for the boat at index
    setBoats(updatedBoats);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/boats', {
        method: 'PUT', // Use the appropriate method for updating
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(boats), // Send updated boats array to backend
      });

      if (!response.ok) {
        throw new Error('Failed to save boats data.');
      }

      setSnackbar({ open: true, message: 'Boats updated successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div>
      <Typography variant="h4">Station Editor</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Number</TableCell>
              <TableCell>Water or Land</TableCell>
              <TableCell>Zone</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Assignment</TableCell>
              <TableCell>Motor Position</TableCell>
              <TableCell>At Ready Position</TableCell>
              <TableCell>Nearest Biobreak Location</TableCell>
              <TableCell>Launch Origin</TableCell>
              <TableCell>Launch Type</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {boats.map((boat, index) => (
              <TableRow key={boat.id}> {/* Assuming each boat has a unique id */}
                <TableCell>
                  <TextField
                    value={boat.name}
                    onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={boat.category}
                    onChange={(e) => handleInputChange(index, 'category', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={boat.number}
                    onChange={(e) => handleInputChange(index, 'number', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={boat.WaterorLand}
                    onChange={(e) => handleInputChange(index, 'WaterorLand', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={boat.Zone}
                    onChange={(e) => handleInputChange(index, 'Zone', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={boat.Position}
                    onChange={(e) => handleInputChange(index, 'Position', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={boat.assignment}
                    onChange={(e) => handleInputChange(index, 'assignment', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={boat.motor_position}
                    onChange={(e) => handleInputChange(index, 'motor_position', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={boat.at_ready_position}
                    onChange={(e) => handleInputChange(index, 'at_ready_position', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={boat.nearest_biobreak_location}
                    onChange={(e) => handleInputChange(index, 'nearest_biobreak_location', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={boat.launch_origin}
                    onChange={(e) => handleInputChange(index, 'launch_origin', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={boat.launch_type}
                    onChange={(e) => handleInputChange(index, 'launch_type', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={boat.notes}
                    onChange={(e) => handleInputChange(index, 'notes', e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button variant="contained" color="primary" onClick={handleSave}>
        Save Changes
      </Button>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default StationEditor;
