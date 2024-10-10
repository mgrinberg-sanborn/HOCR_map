import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';
import BoatFeature from './BoatFeature'; // Assuming BoatFeature is in the same directory

function StationCard() {
  const { view, name } = useParams(); // Get view and name from the URL
  const [boat, setBoat] = useState(null); // Store boat data
  const mapRef = useRef(null); // Reference for the map element
  const mapInstance = useRef(null); // Keep track of the map instance

  // Fetch the boat data when the component mounts
  useEffect(() => {
    axios.get(`/api/boats_view/${view}/${name}`)
      .then(response => {
        setBoat(response.data);
      })
      .catch(error => {
        console.error('Error fetching boat data:', error);
      });
  }, [view, name]);

  // Initialize the map only once
  useEffect(() => {
    if (boat && boat.lat && boat.lon && mapRef.current && !mapInstance.current) {
      // Create a map only if it hasn't been initialized
      mapInstance.current = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: new View({
          center: fromLonLat([boat.lon, boat.lat]),
          zoom: 15,
        }),
      });

      // Create a vector layer to hold the boat feature
      const vectorSource = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: vectorSource,
      });

      // Add the vector layer to the map
      mapInstance.current.addLayer(vectorLayer);

      // Add the boat feature using the BoatFeature component
      const boatFeature = BoatFeature(boat); // Pass the boat data to BoatFeature
      if (boatFeature) {
        vectorSource.addFeature(boatFeature); // Add the boat feature to the vector source
      }
    }
  }, [boat]);

  if (!boat) {
    return <div>Loading...</div>; // Show loading while boat data is being fetched
  }

  // Determine the style for the station name based on the category
  const stationNameStyle = {
    color: boat.category === 'SL' ? 'red' : 'black', // Red text for "SL", black text otherwise
    backgroundColor: boat.category === 'RC' ? 'yellow' : 'transparent', // Yellow highlight for "RC"
    padding: '2px 5px', // Optional padding to make the highlight more visible
    borderRadius: '3px', // Optional rounded corners for better visual
  };

  return (
    <div>
      {/* Apply the dynamic style to the station name */}
      <h2 style={stationNameStyle}>{boat.name}</h2>
      <p><strong>Category:</strong> {boat.category === 'RC' ? 'River Control' : boat.category === 'SL' ? 'Safety' : boat.category}</p>
        <p><strong>Zone:</strong> {boat.Zone}<strong>Latitude:</strong> {boat.lat} <strong>Longitude:</strong> {boat.lon}</p>
        <p><strong>Water/Land:</strong> {boat.WaterorLand}</p>
        <p><strong>Position:</strong> {boat.position}</p>
      <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div> {/* Map container */}

      {/* Display the boat details (same data as the popup) */}
      <div className="boat-details">
        
        <p><strong>Assignment:</strong> {boat.Assigment}</p>
        {boat.WaterorLand === 'Water' && (
            <>
                <p><strong>Motor Position:</strong> {boat.motor_position}</p>
                <p><strong>Idle/Docked:</strong> {boat.at_ready_position}</p>
            </>
        )}
        <p><strong>Nearest Biobreak Location:</strong> {boat.nearest_biobreak_location}</p>
      </div>
    </div>
  );
}

export default StationCard;
