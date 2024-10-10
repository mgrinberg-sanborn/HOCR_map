import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Modify } from 'ol/interaction';
import { Control } from 'ol/control';
import axios from 'axios';
import BoatFeature from './BoatFeature';
import { Style, Icon } from 'ol/style';
import { Point } from 'ol/geom';
import Feature from 'ol/Feature';
import '../MapComponent.css'; // Import a CSS file for styles

const MapComponent = ({ mapBoats, setMapBoats, vectorSourceRef, mapRef, isAuthenticated, isEditor, activeView }) => {
  const mapElementRef = useRef(null);
  const olMapRef = useRef(null); 
  const [popupContent, setPopupContent] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState([0, 0]);

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
      maxZoom: 18,
      minZoom: 15,
    },
    SaturdaySunday: {
      center: fromLonLat([-71.1200, 42.3625]),
      zoom: 15,
      maxZoom: 17,
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
    olMapRef.current = olMap; 

    // Create a home button control
    const homeButton = document.createElement('button');
    homeButton.className = 'home-button';
    homeButton.innerHTML = '🏠';

    homeButton.addEventListener('click', resetMapView); 

    // Create a control for the button and add it to the map
    olMap.addControl(new Control({ element: homeButton }));

    const modify = new Modify({ source: vectorSourceRef.current });
    if (isAuthenticated && isEditor) {
      olMap.addInteraction(modify);

      modify.on('modifyend', (e) => {
        e.features.forEach((feature) => {
          const geometry = feature.getGeometry();
          const [lon, lat] = toLonLat(geometry.getCoordinates());
          const boatId = feature.get('boat_id');
          const viewID = feature.get('viewID');
          const rotation = feature.get('rotation') || 0;
          axios.post('/api/boats_view/insert', {
            boat_id: boatId,
            lat,
            lon,
            rotation,
            viewID: viewID,
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
          console.log('boat', clickedFeature.get('boat_id'), 'rotated to', newRotation);
          const boatId = clickedFeature.get('boat_id');
          const viewID = clickedFeature.get('viewID');
          axios.post('/api/boats_view/insert', {
            boat_id: boatId,
            lat,
            lon,
            rotation: newRotation,
            viewID: viewID,
            view: activeView,
          }).then((response) => {
            console.log('Boat rotation updated:', response);
          }).catch((error) => {
            console.error('Error updating boat rotation:', error);
          });
        }
      }
    });

    // Add pointermove event to show the popup
    olMap.on('pointermove', (event) => {
      const feature = olMap.forEachFeatureAtPixel(event.pixel, (feature) => feature);
      if (feature && !isAuthenticated && !isEditor && activeView != 'Parking') {
        const boat = feature.getProperties();
        const content = `
          <div>
            <strong>Water or Land:</strong> ${boat.WaterorLand}<br>
            <strong>Zone:</strong> ${boat.zone}<br>
            <strong>Position:</strong> ${boat.position}<br>
            <strong>Assignment:</strong> ${boat.assignment}<br>
            <strong>Motor Position:</strong> ${boat.motor_position}<br>
            <strong>At Ready Position:</strong> ${boat.at_ready_position}<br>
            <strong>Nearest Bio-break Location:</strong> ${boat.nearest_biobreak_location}
          </div>
        `;
        setPopupContent(content);
    
        // Convert the map coordinate to pixel values
        const pixel = olMap.getPixelFromCoordinate(event.coordinate);
        setPopupPosition([pixel[0], pixel[1]]);
        setPopupVisible(true);
      } else {
        setPopupVisible(false);
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
          vectorSourceRef.current.clear(); 
          return;
        }

        setMapBoats(boatData);

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
  }, [setMapBoats, vectorSourceRef, activeView]); 

  // Function to reset the map view to the default extent
  const resetMapView = () => {
    const viewConfig = viewConfigurations[activeView];
    olMapRef.current.getView().setCenter(viewConfig.center);
    olMapRef.current.getView().setZoom(viewConfig.zoom);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapElementRef} style={{ width: '100%', height: '80vh' }}></div>
      {popupVisible && (
        <div className="popup" style={{ position: 'absolute', left: popupPosition[0], top: popupPosition[1] }}>
          <div dangerouslySetInnerHTML={{ __html: popupContent }} />
        </div>
      )}
    </div>
  );
};

export default MapComponent;
