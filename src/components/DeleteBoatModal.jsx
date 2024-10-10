import React from 'react';
import { Modal, Button, Select, MenuItem } from '@mui/material';

const DeleteBoatModal = ({ open, setOpen, selectedBoat, setSelectedBoat, mapBoats, handleDeleteBoat }) => {
  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <div className="modal-content">
        <h2>Deleting a Boat (Refresh if deleting recently Added)</h2>
        <Select value={selectedBoat} onChange={(e) => setSelectedBoat(e.target.value)} fullWidth>
          {mapBoats.map((boat) => (
            <MenuItem key={boat.id} value={boat.id}>
              {boat.name}
            </MenuItem>
          ))}
        </Select>
        <Button onClick={handleDeleteBoat}>Delete Boat</Button>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </div>
    </Modal>
  );
};

export default DeleteBoatModal;
