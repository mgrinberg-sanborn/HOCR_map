import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'; 
import VectorSource from 'ol/source/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import axios from 'axios';
import MapComponent from './components/MapComponent';
import BoatToolbar from './components/BoatToolbar';
import DeleteBoatModal from './components/DeleteBoatModal';
import BoatFeature from './components/BoatFeature';
import ToolbarWithModal from './components/ToolbarWithModal';
import BoathouseBrowser from './components/BoathouseBrowser';
import { Button } from '@mui/material';
import StationEditor from './components/StationEditor';
import WelcomePage from './components/WelcomePage';
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
  
  const location = useLocation(); // Get location
  const navigate = useNavigate(); // Get navigate function

  // Fetch boats on component mount
  useEffect(() => {
    axios.get('/api/boats').then((response) => setBoats(response.data));
  }, []);

  // Update active view based on the URL path
  useEffect(() => {
    const path = location.pathname.split('/')[1]; // Get the first segment of the path
    if (path && path !== activeView) {
      setActiveView(path); // Update active view based on pathname
    }
  }, [location.pathname, activeView]); // Run effect when pathname or activeView changes
  

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

  const handleBoatDrop = (e, boatId, boatName, category, WaterorLand) => {
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
  
    const boat = {
      lat: lonLat[1],
      lon: lonLat[0],
      boat_id: boatId, // Keep as boat_id to match your BoatFeature function
      WaterorLand: WaterorLand,
      name: boatName,
      category,
    };
  
    // First, insert the boat record into the database
    axios.post('/api/boats_view/insert', {
      boat_id: boatId,
      lat: lonLat[1],
      lon: lonLat[0],
      view: activeView,
      WaterorLand: WaterorLand,
    })
    .then((response) => {
      // Assuming the response contains viewID in the format
      const viewID = response.data.viewID.id; // Extract viewID directly as a string
  
      // Now, create the boat feature after confirming the insert
      const boatFeature = BoatFeature({
        ...boat,
        viewID, // Add viewID to the boat object
      });
  
      vectorSourceRef.current.addFeature(boatFeature);
      map.updateSize();
  
      // Update boats state with the new boat properties including viewID
      setBoats(prevBoats => 
        prevBoats.filter(boat => boat.id !== boatId)
      );
  
      setMapBoats(prevBoats => [
        ...prevBoats, 
        { 
          id: boatId, 
          name: boatName, 
          lat: lonLat[1], 
          lon: lonLat[0], 
          category, 
          viewID: viewID // Add the viewID to the new boat's properties
        }
      ]);
    })
    .catch((error) => {
      console.error('Error inserting boat position', error);
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
        {/* Welcome page */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/station-editor" element={<StationEditor />} />
        {/* Add the route for StationCard */}
        <Route path="/station/:view/:name" element={<StationCard />} />
        <Route path="/boathouse-browser" element={<BoathouseBrowser />} />

        {/* Add routes for different views */}
        <Route path="/:view" element={
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
                  Delete a Boat
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
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
