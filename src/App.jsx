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
import './App.css'; // Import the CSS file

function App() {
  const [boats, setBoats] = useState([]);
  const [mapBoats, setMapBoats] = useState([]);
  const mapRef = useRef(null);
  const mapElementRef = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());

  useEffect(() => {
    axios.get('/api/boats').then((response) => {
      setBoats(response.data);
    });
  }, []);

  useEffect(() => {
    axios.get('/api/boats_view/Parking').then((response) => {
      const boatData = response.data;
      setMapBoats(boatData);

      const features = boatData.map(createBoatFeature);
      vectorSourceRef.current.clear(); // Clear existing features before adding new ones
      vectorSourceRef.current.addFeatures(features);
      mapRef.current.render();
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
          const rotation = feature.get('rotation') || 0;

          axios.post('/api/boats_view/insert', {
            boat_id: boatId,
            lat,
            lon,
            rotation,
            view: 'Parking',
          }).then((response) => {
            console.log('Boat position and rotation updated:', response);
          }).catch((error) => {
            console.error('Error updating boat position and rotation:', error);
          });
        });
      });

      mapRef.current.on('click', (event) => {
        if (event.originalEvent.shiftKey) {
          const clickedFeature = mapRef.current.forEachFeatureAtPixel(event.pixel, (feature) => feature);

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

            mapRef.current.render();

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
    }
  }, []);

  const createBoatFeature = (boat) => {
    const { lat, lon, name, id, rotation = 0, category } = boat;
    const boatCoordinates = fromLonLat([lon, lat]);

    const boatFeature = new Feature({
      geometry: new Point(boatCoordinates),
      id,
      rotation,
    });

    const fillColor = category === 'SL' ? 'red' : 'yellow';

    const svgIcon = `
      <svg width="50" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" width="35" height="20" fill="${fillColor}"/>
        <polygon points="10,0 0,10 10,20" fill="${fillColor}"/>
        <text x="25" y="14" font-size="12" fill="black" font-family="Arial" text-anchor="middle">${name}</text>
      </svg>`;

    const svgIconDataURL = `data:image/svg+xml;utf8,${encodeURIComponent(svgIcon)}`;

    boatFeature.setStyle(
      new Style({
        image: new Icon({
          src: svgIconDataURL,
          scale: 1,
          rotation,
        }),
      })
    );

    return boatFeature;
  };

  const boatsOnMap = new Set(mapBoats.map(boat => boat.id));
  const draggableBoats = boats.filter(boat => !boatsOnMap.has(boat.id));

  const handleBoatDrop = (e, boatId, boatName) => {
    const map = mapRef.current;
    const pixel = map.getEventPixel(e);
    const coordinates = toLonLat(map.getCoordinateFromPixel(pixel));

    const boatFeature = createBoatFeature({ lat: coordinates[1], lon: coordinates[0], name: boatName, id: boatId });
    vectorSourceRef.current.addFeature(boatFeature);
    map.updateSize();

    axios.post('/api/boats_view/insert', {
      boat_id: boatId,
      lat: coordinates[1],
      lon: coordinates[0],
      view: 'Parking',
    }).then((response) => {
      console.log('Boat position updated', response);

      setBoats(prevBoats => prevBoats.filter(boat => boat.id !== boatId));
    }).catch((error) => {
      console.error('Error updating boat position', error);
    });
  };

  return (
    <div>
      <div ref={mapElementRef} style={{ width: '100%', height: '80vh' }}></div>
      <div className="boat-toolbar">
        <h3>Boats</h3>
        <div className="boat-list">
          {draggableBoats.map((boat) => (
            <div
              key={boat.id}
              className="boat-item"
              draggable
              onDragEnd={(e) => handleBoatDrop(e, boat.id, boat.name)}
            >
              <svg width="50" height="20" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" width="35" height="20" fill={boat.category === 'SL' ? 'red' : 'yellow'}/>
                <polygon points="10,0 0,10 10,20" fill={boat.category === 'SL' ? 'red' : 'yellow'}/>
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
