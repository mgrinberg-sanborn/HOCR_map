import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON'; 
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Modify } from 'ol/interaction';
import { Control } from 'ol/control';
import axios from 'axios';
import BoatFeature from './BoatFeature';
import { Style, Icon, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { Point } from 'ol/geom';
import Feature from 'ol/Feature';
import FridayPractice from '../assets/FridayPractice.geojson';
import BasinBuoys from '../assets/BasinBuoys2.geojson';
import StartFinish from '../assets/StartFinish.geojson';
import BasinWarmup from '../assets/BasinWarmup.geojson';

import '../MapComponent.css'; 

const MapComponent = ({ mapBoats, setMapBoats, vectorSourceRef, mapRef, isAuthenticated, isEditor, activeView }) => {
  const mapElementRef = useRef(null);
  const olMapRef = useRef(null); 
  const locationLayerRef = useRef(new VectorSource()); 

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
      center: fromLonLat([-71.1310, 42.3700]),
      zoom: 17.5,
      maxZoom: 19,
      minZoom: 15,
    },
    SaturdaySunday: {
      center: fromLonLat([-71.1200, 42.3625]),
      zoom: 15,
      maxZoom: 17,
      minZoom: 15,
    },
  };

  const geojsonStyleFunction = (feature) => {
    return new Style({
      fill: new Fill({
        color: 'black',
      }),
      stroke: new Stroke({
        color: 'black',
        width: 1,
      }),
    });
  };

  useEffect(() => {
    const layers = [
      new TileLayer({ source: new OSM() }),
      new VectorLayer({ source: vectorSourceRef.current }),
      new VectorLayer({ source: locationLayerRef.current }) // Layer for the location marker
    ];

    // Only add the GeoJSON vector layer if activeView is 'Friday'
    if (activeView === 'Friday') {
      const geojsonVectorSource = new VectorSource({
        url: FridayPractice,
        format: new GeoJSON(),
      });
      const geojsonLayer = new VectorLayer({
        source: geojsonVectorSource,
        style: geojsonStyleFunction,
      });

      layers.push(geojsonLayer);
    }

    if (activeView === 'SaturdaySunday') {
      const geojsonFiles = [
        { url: BasinBuoys, name: 'Basin Buoys' },
        { url: StartFinish, name: 'Start/Finish' },
        // { url: BasinWarmup, name: 'Basin Warmup' },
      ];
      geojsonFiles.forEach((file) => {
        const geojsonVectorSource = new VectorSource({
          url: file.url,
          format: new GeoJSON(),
        });
        const geojsonLayer = new VectorLayer({
          source: geojsonVectorSource,
          style: geojsonStyleFunction,
        });
        layers.push(geojsonLayer);
      });
    }

    const olMap = new Map({
      target: mapElementRef.current,
      layers: layers,
      view: new View(viewConfigurations[activeView]),
    });

    vectorSourceRef.current.map = olMap; 
    mapRef.current = olMap; 
    olMapRef.current = olMap; 

    const homeButton = document.createElement('button');
    homeButton.className = 'home-button';
    homeButton.innerHTML = '🏠';
    homeButton.addEventListener('click', resetMapView);
    olMap.addControl(new Control({ element: homeButton }));

    const locateButton = document.createElement('button');
    locateButton.className = 'locate';
    locateButton.innerHTML = '📍';
    locateButton.style.marginTop = '5px'; // Positioning below the home button
    locateButton.addEventListener('click', findMyLocation);
    olMap.addControl(new Control({ element: locateButton }));

    // Modify interaction if user is authenticated and editor
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
      // Rotate boat on shift-click
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

    olMap.on('pointermove', (event) => {
      const feature = olMap.forEachFeatureAtPixel(event.pixel, (feature) => feature);
      if (feature && feature.values_.boat_id && !isAuthenticated && !isEditor && activeView !== 'Parking') {
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
    vectorSourceRef.current.clear();

    // Fetch boats for the active view
    axios.get(`/api/boats_view/${activeView}`)
      .then((response) => {
        const boatData = response.data;
        if (!boatData || boatData.length === 0) {
          return;
        }
        setMapBoats(boatData);
        const features = boatData.map(boat => BoatFeature(boat)).filter(Boolean);
        vectorSourceRef.current.addFeatures(features);
        if (vectorSourceRef.current.map) {
          vectorSourceRef.current.map.render();
        }
      })
      .catch((error) => {
        console.error('Error fetching boat data:', error);
      });
  }, [setMapBoats, vectorSourceRef, activeView]);

  const findMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const [lon, lat] = [position.coords.longitude, position.coords.latitude];
        const coordinates = fromLonLat([lon, lat]);

        // Add a marker at the user's location
        const locationFeature = new Feature({
          geometry: new Point(coordinates),
        });
        locationFeature.setStyle(
          new Style({
            image: new CircleStyle({
              radius: 7,
              fill: new Fill({ color: '#3399CC' }),
              stroke: new Stroke({ color: '#fff', width: 2 })
            })
          })
        );
        locationLayerRef.current.clear(); // Remove previous marker
        locationLayerRef.current.addFeature(locationFeature);

        olMapRef.current.getView().setCenter(coordinates);
        olMapRef.current.getView().setZoom(15);
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };


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
