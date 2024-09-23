import React, { useState } from 'react';
import { AppBar, Toolbar, Button, Modal, Box, Typography, TextField, Tabs, Tab, Snackbar, Alert } from '@mui/material';

const ToolbarWithModal = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Login, 1 = Register
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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

  const handleSubmit = async () => {
    try {
      const endpoint = activeTab === 0 ? 'login' : 'register';
      const response = await fetch(`http://localhost:8080/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
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

      handleClose(); // Close modal on success
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Error during submit',
        severity: 'error',
      });
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Boat Management App
          </Typography>
          <Button color="inherit" onClick={handleOpen}>
            {activeTab === 0 ? 'Login' : 'Register'}
          </Button>
        </Toolbar>
      </AppBar>

      <Modal open={open} onClose={handleClose}>
        <Box sx={{ p: 4, bgcolor: 'background.paper', margin: 'auto', width: 300, borderRadius: 2 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            {activeTab === 0 ? 'Login' : 'Register'}
          </Typography>

          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          <form>
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              sx={{ mt: 2 }}
              required
            />
            <TextField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              fullWidth
              sx={{ mt: 2 }}
              required
            />

            <Button variant="contained" onClick={handleSubmit} fullWidth sx={{ mt: 2 }}>
              {activeTab === 0 ? 'Login' : 'Register'}
            </Button>
          </form>
        </Box>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ToolbarWithModal;
