import React, { useState, useEffect, useRef } from 'react';
import VectorSource from 'ol/source/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import axios from 'axios';
import MapComponent from './components/MapComponent';
import BoatToolbar from './components/BoatToolbar';
import DeleteBoatModal from './components/DeleteBoatModal';
import BoatFeature from './components/BoatFeature';
import ToolbarWithModal from './components/ToolbarWithModal';
import { Button } from '@mui/material';
import './App.css'; // Import the CSS file

function App() {
  const [boats, setBoats] = useState([]);
  const [mapBoats, setMapBoats] = useState([]);
  const [selectedBoat, setSelectedBoat] = useState('');
  const [open, setOpen] = useState(false);
  const [draggableBoats, setDraggableBoats] = useState([]);
  const [isEditor, setIsEditor] = useState(false); // New state for editor check
  const [isAuthenticated, setIsAuthenticated] = useState(false); // New state for authentication
  const vectorSourceRef = useRef(new VectorSource());
  const mapRef = useRef(); // Create the mapRef here

  
  // Fetch boats on component mount
  useEffect(() => {
    axios.get('/api/boats').then((response) => setBoats(response.data));
  }, []);

  useEffect(() => {
    const boatsOnMap = new Set(mapBoats.map((boat) => boat.boat_id));
    setDraggableBoats(boats.filter((boat) => !boatsOnMap.has(boat.id)));
  }, [boats, mapBoats]);

  const handleBoatDrop = (e, boatId, boatName, category) => {
    const map = mapRef.current;

    // Check if map is initialized and the event is defined
    if (!map || !e) {
      console.error('Map is not initialized or event is null.');
      return;
    }

    const pixel = map.getEventPixel(e);
    if (!pixel) {
      console.error('Could not get pixel from event.');
      return;
    }

    // Get the coordinates from the pixel
    const coords = map.getCoordinateFromPixel(pixel);
    console.log('Coordinates from pixel:', coords);

    if (!coords) {
      console.error('Could not get coordinates from pixel.');
      return;
    }

    const lonLat = toLonLat(coords);
    console.log('Converted Lon/Lat:', lonLat);

    if (!lonLat || lonLat.length < 2) {
      console.error('Could not convert coordinates to lon/lat:', coords);
      return;
    }

    const boatFeature = BoatFeature({ lat: lonLat[1], lon: lonLat[0], name: boatName, id: boatId, category });
    vectorSourceRef.current.addFeature(boatFeature);
    map.updateSize();

    axios.post('/api/boats_view/insert', {
      boat_id: boatId,
      lat: lonLat[1],
      lon: lonLat[0],
      view: 'Parking',
    }).then((response) => {
      console.log('Boat position updated', response);
      setBoats(prevBoats => prevBoats.filter(boat => boat.id !== boatId));
      setMapBoats(prevBoats => [...prevBoats, { id: boatId, name: boatName, lat: lonLat[1], lon: lonLat[0], category }]);
    }).catch((error) => {
      console.error('Error updating boat position', error);
    });
  };

  const handleDeleteBoat = () => {
    const selectedFeature = vectorSourceRef.current.getFeatures().find(feature => feature.get('id') === selectedBoat);
    if (selectedFeature) {
      vectorSourceRef.current.removeFeature(selectedFeature);

      axios.delete(`/api/boats_view/${selectedBoat}`)
        .then(() => {
          setMapBoats((prevBoats) => prevBoats.filter((boat) => boat.id !== selectedBoat));

          axios.get('/api/boats_view/Parking').then((response) => {
            const updatedBoatData = response.data;
            setMapBoats(updatedBoatData);

            const features = updatedBoatData.map(createBoatFeature);
            vectorSourceRef.current.clear();
            vectorSourceRef.current.addFeatures(features);
            mapRef.current.render();
          });

          setOpen(false);
        })
        .catch((error) => {
          console.error('Error deleting boat:', error);
        });
    }
  };

  return (
    <div>
      <ToolbarWithModal 
        isAuthenticated={isAuthenticated} 
        setIsAuthenticated={setIsAuthenticated} 
        isEditor={isEditor} 
        setIsEditor={setIsEditor}
      />
      <MapComponent 
        mapBoats={mapBoats} 
        setMapBoats={setMapBoats} 
        vectorSourceRef={vectorSourceRef} 
        mapRef={mapRef} 
        isAuthenticated={isAuthenticated}  // Pass isAuthenticated
        isEditor={isEditor}    
      />
      {isAuthenticated && isEditor && (
        <>
          <BoatToolbar draggableBoats={draggableBoats} handleBoatDrop={handleBoatDrop} />
          <Button variant="outlined" onClick={() => setOpen(true)}>
            Open Delete Boat Modal
          </Button>
        </>
      )}
      <DeleteBoatModal
        open={open}
        setOpen={setOpen}
        selectedBoat={selectedBoat}
        setSelectedBoat={setSelectedBoat}
        mapBoats={mapBoats}
        handleDeleteBoat={handleDeleteBoat}
      />
    </div>
  );
}

export default App;
