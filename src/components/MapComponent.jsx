import React, { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Modify } from 'ol/interaction';
import { Control } from 'ol/control'; // Import Control for custom controls
import axios from 'axios';
import BoatFeature from './BoatFeature';
import { Style, Icon } from 'ol/style';
import { Point } from 'ol/geom';
import Feature from 'ol/Feature';
import '../MapComponent.css'; // Import a CSS file for styles

const MapComponent = ({ mapBoats, setMapBoats, vectorSourceRef, mapRef, isAuthenticated, isEditor, activeView }) => {
  const mapElementRef = useRef(null);
  const olMapRef = useRef(null); // Store the OpenLayers map instance

  const viewConfigurations = {
    Parking: {
      center: fromLonLat([-71.0969, 42.3553]),
      zoom: 20,
      maxZoom: 20,
      minZoom: 20,
    },
    Friday: {
      center: fromLonLat([-71.0969, 42.3553]),
      zoom: 15,
      maxZoom: 20,
      minZoom: 15,
    },
    SaturdaySunday: {
      center: fromLonLat([-71.1200, 42.3625]),
      zoom: 15,
      maxZoom: 20,
      minZoom: 15,
    },
  };

  useEffect(() => {
    const olMap = new Map({
      target: mapElementRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: vectorSourceRef.current }),
      ],
      view: new View(viewConfigurations[activeView]),
    });

    vectorSourceRef.current.map = olMap; 
    mapRef.current = olMap; 
    olMapRef.current = olMap; // Store the map instance in the ref

    // Create a home button control
    const homeButton = document.createElement('button');
    homeButton.className = 'home-button'; // Add a class for styling
    homeButton.innerHTML = '🏠'; // Use an emoji for the home icon

    homeButton.addEventListener('click', resetMapView); // Attach the click event

    // Create a control for the button and add it to the map
    olMap.addControl(new Control({ element: homeButton }));

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
            view: activeView,
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

    olMap.on('click', (event) => {
      if (event.originalEvent.shiftKey) {
        const clickedFeature = olMap.forEachFeatureAtPixel(event.pixel, (feature) => feature);

        if (clickedFeature) {
          const currentStyle = clickedFeature.getStyle();
          const currentRotation = clickedFeature.get('rotation') || 0;
          const newRotation = currentRotation + (20 * Math.PI / 180); 

          clickedFeature.set('rotation', newRotation);
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
            view: activeView,
          }).then((response) => {
            console.log('Boat rotation updated:', response);
          }).catch((error) => {
            console.error('Error updating boat rotation:', error);
          });
        }
      }
    });

    return () => olMap.setTarget(undefined);
  }, [vectorSourceRef, isAuthenticated, isEditor, activeView]); 

  useEffect(() => {
    // Fetch and update boat data whenever activeView changes
    axios.get(`/api/boats_view/${activeView}`)
      .then((response) => {
        const boatData = response.data;

        if (!boatData || boatData.length === 0) {
          console.error('No boat data received from API or API returned empty data.');
          vectorSourceRef.current.clear(); // Clear existing features
          return;
        }

        setMapBoats(boatData);

        // Clear existing features before adding new ones
        vectorSourceRef.current.clear(); 

        const features = boatData.map(boat => {
          const feature = BoatFeature(boat); 
          if (!feature) {
            console.error('Invalid boat feature for:', boat);
          }
          return feature;
        }).filter(Boolean);

        vectorSourceRef.current.addFeatures(features);

        if (vectorSourceRef.current.map) {
          vectorSourceRef.current.map.render(); 
        }
      })
      .catch((error) => {
        console.error('Error fetching boat data:', error);
      });
  }, [setMapBoats, vectorSourceRef, activeView]); // Include activeView to refetch on change

  // Function to reset the map view to the default extent
  const resetMapView = () => {
    const viewConfig = viewConfigurations[activeView];
    olMapRef.current.getView().setCenter(viewConfig.center);
    olMapRef.current.getView().setZoom(viewConfig.zoom);
  };

  return (
    <div ref={mapElementRef} style={{ width: '100%', height: '80vh' }}></div>
  );
};

export default MapComponent;
