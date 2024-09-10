import React, { useEffect, useState, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Icon } from 'ol/style';
import { Modify } from 'ol/interaction';
import axios from 'axios';

function App() {
  const [boats, setBoats] = useState([]); // Draggable boats
  const [mapBoats, setMapBoats] = useState([]); // Boats on the map
  const mapRef = useRef(null);
  const mapElementRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());

  // Fetch boats for dragging
  useEffect(() => {
    axios.get('/api/boats').then((response) => {
      setBoats(response.data);
    });
  }, []);

  // Fetch boats for the map
  useEffect(() => {
    axios.get('/api/boats_view/Parking').then((response) => {
      const boatData = response.data;
      setMapBoats(boatData);

      const features = boatData.map(createBoatFeature);
      vectorSourceRef.current.addFeatures(features);
      mapRef.current.render(); // Ensure the map is refreshed
    });

    if (!mapRef.current) {
      const olMap = new Map({
        target: mapElementRef.current,
        layers: [
          new TileLayer({ source: new OSM() }),
          new VectorLayer({ source: vectorSourceRef.current }),
        ],
        view: new View({
          center: fromLonLat([-71.0969, 42.3553]),
          zoom: 20,
        }),
      });

      mapRef.current = olMap;

      const modify = new Modify({ source: vectorSourceRef.current });
      mapRef.current.addInteraction(modify);

      modify.on('modifyend', (e) => {
        e.features.forEach((feature) => {
          const geometry = feature.getGeometry();
          const [lon, lat] = toLonLat(geometry.getCoordinates());
          const boatId = feature.get('id');
          const rotation = feature.get('rotation') || 0; // Get the rotation from the feature

          axios.post('/api/boats_view/insert', {
            boat_id: boatId,
            lat,
            lon,
            rotation, // Include rotation in the request
            view: 'Parking',
          }).then((response) => {
            console.log('Boat position and rotation updated:', response);
          }).catch((error) => {
            console.error('Error updating boat position and rotation:', error);
          });
        });
      });

      // Add click event to the map for rotating boats
      mapRef.current.on('click', (event) => {
        if (event.originalEvent.shiftKey) {
          const clickedFeature = mapRef.current.forEachFeatureAtPixel(event.pixel, (feature) => feature);

          if (clickedFeature) {
            const currentStyle = clickedFeature.getStyle();
            const currentRotation = clickedFeature.get('rotation') || 0; // Get rotation from feature property
            const newRotation = currentRotation + (20 * Math.PI / 180); // Rotate by 10 degrees

            // Update the feature's rotation property
            clickedFeature.set('rotation', newRotation);

            // Update the style with the new rotation
            clickedFeature.setStyle(
              new Style({
                image: new Icon({
                  src: currentStyle.getImage().getSrc(),
                  scale: currentStyle.getImage().getScale(),
                  rotation: newRotation,
                }),
              })
            );

            mapRef.current.render(); // Force the map to re-render with the updated rotation

            // Optionally, update the rotation on click
            const [lon, lat] = toLonLat(clickedFeature.getGeometry().getCoordinates());
            console.log(newRotation);
            axios.post('/api/boats_view/insert', {
              boat_id: clickedFeature.get('id'),
              lat,
              lon,
              rotation: newRotation, // Send the new rotation
              view: 'Parking',
            }).then((response) => {
              console.log('Boat rotation updated:', response);
            }).catch((error) => {
              console.error('Error updating boat rotation:', error);
            });
          }
        }
      });
    }
  }, []);

  // Common function to create boat features
  const createBoatFeature = (boat) => {
    const { lat, lon, name, id, rotation = 0 } = boat; // Default rotation to 0
    const boatCoordinates = fromLonLat([lon, lat]);

    const boatFeature = new Feature({
      geometry: new Point(boatCoordinates),
      id, // Store the boat ID for later use
      rotation, // Store rotation in the feature
    });

    const svgIcon = `
      <svg width="50" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" width="35" height="20" fill="yellow"/>
        <polygon points="10,0 0,10 10,20" fill="yellow"/>
        <text x="25" y="14" font-size="12" fill="black" font-family="Arial" text-anchor="middle">${name}</text>
      </svg>`;

    const svgIconDataURL = `data:image/svg+xml;utf8,${encodeURIComponent(svgIcon)}`;

    boatFeature.setStyle(
      new Style({
        image: new Icon({
          src: svgIconDataURL,
          scale: 1,
          rotation, // Initial rotation
        }),
      })
    );

    return boatFeature;
  };

  const boatsOnMap = new Set(mapBoats.map(boat => boat.id));
  const draggableBoats = boats.filter(boat => !boatsOnMap.has(boat.id));

  return (
    <div>
      <div ref={mapElementRef} style={{ width: '100%', height: '80vh' }}></div>
      <div style={{ padding: '10px', background: '#f0f0f0' }}>
        <h3>Boats</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {draggableBoats.map((boat) => (
            <div
              key={boat.id}
              draggable
              onDragEnd={(e) => handleBoatDrop(e, boat.id, boat.name)}
            >
              <svg width="50" height="20" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" width="35" height="20" fill="yellow"/>
                <polygon points="10,0 0,10 10,20" fill="yellow"/>
                <text x="25" y="14" font-size="12" fill="black" font-family="Arial" text-anchor="middle">{boat.name}</text>
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
