import React, { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, toLonLat } from 'ol/proj'; // Ensure this line is present
import { Modify } from 'ol/interaction';
import axios from 'axios';
import BoatFeature from './BoatFeature'; // Make sure to import BoatFeature
import { Style, Icon } from 'ol/style';
import { Point } from 'ol/geom';
import Feature from 'ol/Feature';

const MapComponent = ({ mapBoats, setMapBoats, vectorSourceRef, mapRef, isAuthenticated, isEditor }) => {
  const mapElementRef = useRef(null);

  // Initialize the map
  useEffect(() => {
    const olMap = new Map({
      target: mapElementRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: vectorSourceRef.current }),
      ],
      view: new View({
        center: fromLonLat([-71.0969, 42.3553]), // Correct usage of fromLonLat
        zoom: 20,
        maxZoom: 20,
        minZoom: 20,
      }),
    });

    vectorSourceRef.current.map = olMap; // Store map reference in vectorSourceRef
    mapRef.current = olMap; // Set the map reference here

    // Create a Modify interaction, but only enable it if the user is authenticated and an editor
    const modify = new Modify({ source: vectorSourceRef.current });
    if (isAuthenticated && isEditor) {
      olMap.addInteraction(modify);

      modify.on('modifyend', (e) => {
        e.features.forEach((feature) => {
          const geometry = feature.getGeometry();
          const [lon, lat] = toLonLat(geometry.getCoordinates());
          const boatId = feature.get('id');
          const rotation = feature.get('rotation') || 0;

          axios.post('/api/boats_view/insert', {
            boat_id: boatId,
            lat,
            lon,
            rotation,
            view: 'Parking',
          })
          .then((response) => {
            console.log('Boat position and rotation updated:', response);
          })
          .catch((error) => {
            console.error('Error updating boat position and rotation:', error);
          });
        });
      });
    }

    // Add click event to handle Shift key rotation
    olMap.on('click', (event) => {
      if (event.originalEvent.shiftKey) {
        const clickedFeature = olMap.forEachFeatureAtPixel(event.pixel, (feature) => feature);

        if (clickedFeature) {
          const currentStyle = clickedFeature.getStyle();
          const currentRotation = clickedFeature.get('rotation') || 0;
          const newRotation = currentRotation + (20 * Math.PI / 180); // Rotate 20 degrees

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

          olMap.render();

          const [lon, lat] = toLonLat(clickedFeature.getGeometry().getCoordinates());
          axios.post('/api/boats_view/insert', {
            boat_id: clickedFeature.get('id'),
            lat,
            lon,
            rotation: newRotation,
            view: 'Parking',
          }).then((response) => {
            console.log('Boat rotation updated:', response);
          }).catch((error) => {
            console.error('Error updating boat rotation:', error);
          });
        }
      }
    });

    // Cleanup on unmount
    return () => olMap.setTarget(undefined);
  }, [vectorSourceRef, isAuthenticated, isEditor]);

  // Fetch and update boat data
  useEffect(() => {
    axios.get('/api/boats_view/Parking')
      .then((response) => {
        const boatData = response.data;

        // Log API response for debugging
        console.log('API boat data response:', boatData);

        if (!boatData || boatData.length === 0) {
          console.error('No boat data received from API or API returned empty data.');
          return;
        }

        setMapBoats(boatData);

        const features = boatData.map(boat => {
          const feature = BoatFeature(boat); // Call BoatFeature directly
          if (!feature) {
            console.error('Invalid boat feature for:', boat);
          }
          return feature;
        }).filter(Boolean); // Ensure only valid features are added

        vectorSourceRef.current.clear();
        vectorSourceRef.current.addFeatures(features);

        if (vectorSourceRef.current.map) {
          vectorSourceRef.current.map.render(); // Render map only if it's initialized
        }
      })
      .catch((error) => {
        console.error('Error fetching boat data:', error);
      });
  }, [setMapBoats, vectorSourceRef]); // Include vectorSourceRef as a dependency

  return <div ref={mapElementRef} style={{ width: '100%', height: '80vh' }}></div>;
};

export default MapComponent;
