import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Button, Modal, Box, Typography, TextField, Tabs, Tab, Snackbar, Alert } from '@mui/material';

const ToolbarWithModal = ({ isAuthenticated, setIsAuthenticated, isEditor, setIsEditor }) => {
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
        credentials: 'include', // Include cookies in the request
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
    }); // Clear the form when switching tabs
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
          email: formData.email.toLowerCase(), // Convert email to lowercase
          password: formData.password,
        }),
        credentials: 'include', // Include credentials (session cookies)
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
      setIsEditor(data.editor || false); // Pass editor status if available

      handleClose(); // Close modal on success
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Error during submit',
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

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Boat Management App
          </Typography>
          {isAuthenticated ? (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Button color="inherit" onClick={handleOpen}>
              Login/Register
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Modal open={open} onClose={handleClose}>
        <Box sx={{ p: 4, bgcolor: 'background.paper', margin: 'auto', width: 300, borderRadius: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>
          <Typography variant="h6" component="h2" sx={{ mt: 2 }}>
            {activeTab === 0 ? 'Login' : 'Register'}
          </Typography>
          <TextField
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown} // Add key down event
            fullWidth
            margin="normal"
          />
          <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
            {activeTab === 0 ? 'Login' : 'Register'}
          </Button>
        </Box>
      </Modal>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ToolbarWithModal;
