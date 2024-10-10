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

export default BoatFeature;
