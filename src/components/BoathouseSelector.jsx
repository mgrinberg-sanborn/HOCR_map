import React, { useState, useEffect } from 'react';
import { MenuItem, Select, FormControl, InputLabel, Box } from '@mui/material';

const BoathouseSelector = ({ boathouses, onBoathouseSelect, selectedBoathouse }) => {
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedBoathouseId, setSelectedBoathouseId] = useState(selectedBoathouse?.properties.OBJECTID || '');

    useEffect(() => {
        // When selectedBoathouse changes, update boathouseId and associated user
        if (selectedBoathouse) {
            const newBoathouseId = selectedBoathouse.properties.OBJECTID;
            const newUser = selectedBoathouse.properties.Users;

            // Only update if the new values are different
            if (newBoathouseId !== selectedBoathouseId) {
                setSelectedBoathouseId(newBoathouseId);
                setSelectedUser(newUser);
            }
        } else {
            setSelectedBoathouseId('');
            setSelectedUser('');
        }
    }, [selectedBoathouse]);

    useEffect(() => {
        // When a user is selected, update the corresponding boathouse
        if (selectedUser) {
            const matchedBoathouse = boathouses.find(b => b.properties.Users === selectedUser);
            if (matchedBoathouse) {
                const newBoathouseId = matchedBoathouse.properties.OBJECTID;
                if (newBoathouseId !== selectedBoathouseId) {
                    setSelectedBoathouseId(newBoathouseId);
                    onBoathouseSelect(matchedBoathouse); // Pass the new boathouse
                }
            } else {
                setSelectedBoathouseId('');
                setSelectedUser('');
            }
        }
    }, [selectedUser, boathouses, onBoathouseSelect, selectedBoathouseId]);

    const userCounts = [...new Set(boathouses.map(b => b.properties.Users))];

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
        >
            <Box display="flex" gap={2} width="50%" justifyContent="center">
                {/* User Selection */}
                <FormControl fullWidth margin="normal" sx={{ minWidth: 200 }}>
                    <InputLabel id="user-select-label">Select Team</InputLabel>
                    <Select
                        label="Select Teams" 
                        labelId="user-select-label"
                        value={selectedUser || ''}
                        onChange={(event) => {
                            setSelectedUser(event.target.value);
                        }}
                    >
                        {userCounts.map((userCount, index) => (
                            <MenuItem key={index} value={userCount}>
                                {userCount}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Boathouse Selection */}
                <FormControl fullWidth margin="normal" sx={{ minWidth: 200 }}>
                    <InputLabel id="boathouse-select-label">Select Boathouse</InputLabel>
                    <Select
                        label="Select Boathouse"
                        labelId="boathouse-select-label"
                        value={selectedBoathouseId || ''}
                        onChange={(event) => {
                            const selectedId = event.target.value;
                            const matchedBoathouse = boathouses.find(b => b.properties.OBJECTID === selectedId);
                            setSelectedBoathouseId(selectedId);
                            setSelectedUser(matchedBoathouse ? matchedBoathouse.properties.Users : '');
                            onBoathouseSelect(matchedBoathouse); // Pass the selected boathouse
                        }}
                    >
                        {boathouses.map((boathouse) => (
                            <MenuItem key={boathouse.properties.OBJECTID} value={boathouse.properties.OBJECTID}>
                                {boathouse.properties.Boathouse}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {selectedBoathouseId && (
                <Box mt={3} textAlign="center">
                    <h2>{boathouses.find(b => b.properties.OBJECTID === selectedBoathouseId)?.properties.Boathouse}</h2>
                    <p>Users: {boathouses.find(b => b.properties.OBJECTID === selectedBoathouseId)?.properties.Users}</p>
                    <p>Construction Year: {boathouses.find(b => b.properties.OBJECTID === selectedBoathouseId)?.properties.Construction_Year}</p>
                    <img
                        src={boathouses.find(b => b.properties.OBJECTID === selectedBoathouseId)?.properties.Image_URL}
                        alt={boathouses.find(b => b.properties.OBJECTID === selectedBoathouseId)?.properties.Boathouse}
                        style={{ height: '200px' }}
                    />
                </Box>
            )}
        </Box>
    );
};

export default BoathouseSelector;
