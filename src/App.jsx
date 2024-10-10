import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; 
import VectorSource from 'ol/source/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import axios from 'axios';
import MapComponent from './components/MapComponent';
import BoatToolbar from './components/BoatToolbar';
import DeleteBoatModal from './components/DeleteBoatModal';
import BoatFeature from './components/BoatFeature';
import ToolbarWithModal from './components/ToolbarWithModal';
import { Button } from '@mui/material';
import StationEditor from './components/StationEditor';
import StationCard from './components/StationCard'; // Import the new component
import './App.css';

function App() {
  const [boats, setBoats] = useState([]);
  const [mapBoats, setMapBoats] = useState([]);
  const [selectedBoat, setSelectedBoat] = useState('');
  const [open, setOpen] = useState(false);
  const [draggableBoats, setDraggableBoats] = useState([]);
  const [isEditor, setIsEditor] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('Parking'); // Default view
  const vectorSourceRef = useRef(new VectorSource());
  const mapRef = useRef();

  // Fetch boats on component mount
  useEffect(() => {
    axios.get('/api/boats').then((response) => setBoats(response.data));
  }, []);

  // Update draggable boats based on active view
  useEffect(() => {
    const boatsOnMap = new Set(mapBoats.map((boat) => boat.id));
    setDraggableBoats(boats.filter((boat) => !boatsOnMap.has(boat.id)));
  }, [boats, mapBoats]);

  // Fetch boats for the active view when it changes
  useEffect(() => {
    axios.get(`/api/boats_view/${activeView}`).then((response) => {
      const updatedBoatData = response.data;
      setMapBoats(updatedBoatData);
    });
  }, [activeView]);

  const handleBoatDrop = (e, boatId, boatName, category) => {
    const map = mapRef.current;

    if (!map || !e) {
      console.error('Map is not initialized or event is null.');
      return;
    }

    const pixel = map.getEventPixel(e);
    if (!pixel) {
      console.error('Could not get pixel from event.');
      return;
    }

    const coords = map.getCoordinateFromPixel(pixel);
    const lonLat = toLonLat(coords);

    const boatFeature = BoatFeature({ lat: lonLat[1], lon: lonLat[0], name: boatName, id: boatId, category });
    vectorSourceRef.current.addFeature(boatFeature);
    map.updateSize();
    console.log('Test', boatId, boatName, lonLat, activeView);
    axios.post('/api/boats_view/insert', {
      boat_id: boatId,
      lat: lonLat[1],
      lon: lonLat[0],
      view: activeView,
    }).then((response) => {
      setBoats(prevBoats => prevBoats.filter(boat => boat.id !== boatId));
      setMapBoats(prevBoats => [...prevBoats, { id: boatId, name: boatName, lat: lonLat[1], lon: lonLat[0], category }]);
    }).catch((error) => {
      console.error('Error updating boat position', error);
    });
  };

  const handleDeleteBoat = () => {
    const selectedFeature = vectorSourceRef.current.getFeatures().find(feature => feature.get('viewID') === selectedBoat);
    if (selectedFeature) {
      vectorSourceRef.current.removeFeature(selectedFeature);

      axios.delete(`/api/boats_view/${activeView}/${selectedBoat}`)
        .then(() => {
          setMapBoats((prevBoats) => prevBoats.filter((boat) => boat.id !== selectedBoat));

          axios.get(`/api/boats_view/${activeView}`).then((response) => {
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

  const openDeleteModal = () => {
    setOpen(true);
    setSelectedBoat('');
  };

  return (
    <Router>
      <div>
        <ToolbarWithModal 
          isAuthenticated={isAuthenticated} 
          setIsAuthenticated={setIsAuthenticated} 
          isEditor={isEditor} 
          setIsEditor={setIsEditor}
          activeView={activeView}
          setActiveView={setActiveView}
        />
        <Routes>
          <Route path="/" element={
            <>
              <MapComponent 
                mapBoats={mapBoats} 
                setMapBoats={setMapBoats} 
                vectorSourceRef={vectorSourceRef} 
                mapRef={mapRef} 
                isAuthenticated={isAuthenticated}  
                isEditor={isEditor}    
                activeView={activeView}
                setActiveView={setActiveView}
              />
              {isAuthenticated && isEditor && (
                <>
                  <BoatToolbar draggableBoats={draggableBoats} handleBoatDrop={handleBoatDrop} activeView={activeView} setActiveView={setActiveView} />
                  <Button variant="outlined" onClick={openDeleteModal}>
Delete a Boat                  </Button>
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
            </>
          } />
          <Route path="/station-editor" element={<StationEditor />} />
          {/* Add the route for StationCard */}
          <Route path="/station/:view/:name" element={<StationCard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
