import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Button, Modal, Box, Typography, TextField, Tabs, Tab, Snackbar, Alert } from '@mui/material';

const ToolbarWithModal = ({ isAuthenticated, setIsAuthenticated, isEditor, setIsEditor, setActiveView }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Login, 1 = Register
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Check authentication state from the server on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const response = await fetch('http://localhost:8080/api/check-auth', {
        credentials: 'include',
      });
      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
      setIsEditor(data.isEditor || false);
    };

    checkAuthStatus();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setFormData({
      email: '',
      password: '',
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      const endpoint = activeTab === 0 ? 'login' : 'register';
      const response = await fetch(`http://localhost:8080/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data = await response.json();
      setSnackbar({
        open: true,
        message: data.message || `${activeTab === 0 ? 'Login' : 'Registration'} successful!`,
        severity: 'success',
      });

      // Update authentication state
      setIsAuthenticated(true);
      setIsEditor(data.editor || false);

      handleClose(); // Close modal on success
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Error occurred',
        severity: 'error',
      });
    }
  };

  const handleLogout = async () => {
    await fetch('http://localhost:8080/logout', {
      method: 'POST',
      credentials: 'include', // Include credentials (session cookies)
    });
    setIsAuthenticated(false);
    setIsEditor(false);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <div>
          <Button color="inherit" onClick={() => handleViewChange('Parking')}>Parking View</Button>
          {/* <Button color="inherit" onClick={() => handleViewChange('Friday')}>Friday View</Button> */}
          <Button color="inherit" onClick={() => handleViewChange('SaturdaySunday')}>Saturday/Sunday View</Button>
          {isAuthenticated && (
            <Button color="inherit" onClick={() => handleViewChange('StationEditor')}>
              Station Editor
            </Button>
          )}
        </div>
        <div>
          {isAuthenticated ? (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Button color="inherit" onClick={handleOpen}>
              Login/Register
            </Button>
          )}
        </div>
      </Toolbar>

      <Modal open={open} onClose={handleClose}>
        <Box sx={{ width: 400, padding: 2, margin: 'auto', mt: 8, bgcolor: 'white', borderRadius: 1 }}>
          <Typography variant="h6" component="h2">
            {activeTab === 0 ? 'Login' : 'Register'}
          </Typography>
          <Tabs value={activeTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>
          <TextField
            name="email"
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <TextField
            name="password"
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <Button variant="contained" onClick={handleSubmit} fullWidth>
            {activeTab === 0 ? 'Login' : 'Register'}
          </Button>
        </Box>
      </Modal>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};

export default ToolbarWithModal;
