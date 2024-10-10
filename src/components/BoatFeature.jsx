import React from 'react';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Icon } from 'ol/style';

const BoatFeature = (boat) => { // Change to take boat directly
  if (!boat) {
    console.error('Invalid boat data:', boat);
    return null;
  }

  console.log('Boat data:', boat);

  const { lat, lon, name, viewID, rotation = 0, category, WaterorLand, Zone, Position, assignment, motor_position, at_ready_position, nearest_biobreak_location } = boat;

  const boatCoordinates = fromLonLat([lon, lat]);

  const boatFeature = new Feature({
    geometry: new Point(boatCoordinates),
    viewID,
    rotation,
    WaterorLand,
    Zone,
    Position,
    assignment,
    motor_position,
    at_ready_position,
    nearest_biobreak_location,
  });

  const fillColor = category === 'SL' ? 'red' : 'yellow';

  let svgIcon;

  // Check if the station is on land or water
  if (WaterorLand === 'Land') {
    // Rectangle icon for land stations
    svgIcon = `
      <svg width="50" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" width="50" height="20" fill="${fillColor}"/>
        <text x="28" y="14" font-size="12" fill="black" font-family="Arial" text-anchor="middle">${name}</text>
      </svg>`;
  } else {
    // Existing icon for water stations (rectangle with a triangle)
    svgIcon = `
      <svg width="50" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" width="35" height="20" fill="${fillColor}"/>
        <polygon points="10,0 0,10 10,20" fill="${fillColor}"/>
        <text x="25" y="14" font-size="12" fill="black" font-family="Arial" text-anchor="middle">${name}</text>
      </svg>`;
  }

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

export default BoatFeature;
