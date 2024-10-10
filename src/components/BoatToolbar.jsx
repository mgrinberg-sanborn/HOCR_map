import React from 'react';

const BoatToolbar = ({ draggableBoats, handleBoatDrop, activeView }) => {
  return (
    <div className="boat-toolbar">
      <h3>Boats</h3>
      <div className="boat-list">
        {draggableBoats
          .filter((boat) => {
            // If activeView is 'parking', show only boats where WaterorLand = 'Water'
            return activeView === 'Parking' ? boat.WaterorLand === 'Water' : true;
          })
          .map((boat) => {
            // Determine the fill color based on category
            const fillColor = boat.category === 'SL' ? 'red' : 'yellow';
            let svgIcon;

            // Logic for SVG icon based on WaterorLand
            if (boat.WaterorLand === 'Land') {
              // Rectangle icon for land stations
              svgIcon = `
                <svg width="50" height="20" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" width="50" height="20" fill="${fillColor}"/>
                  <text x="28" y="14" font-size="12" fill="black" font-family="Arial" text-anchor="middle">${boat.name}</text>
                </svg>`;
            } else {
              // Existing icon for water stations (rectangle with a triangle)
              svgIcon = `
                <svg width="50" height="20" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" width="35" height="20" fill="${fillColor}"/>
                  <polygon points="10,0 0,10 10,20" fill="${fillColor}"/>
                  <text x="25" y="14" font-size="12" fill="black" font-family="Arial" text-anchor="middle">${boat.name}</text>
                </svg>`;
            }

            const svgIconDataURL = `data:image/svg+xml;utf8,${encodeURIComponent(svgIcon)}`;
            return (
              <div
                key={boat.id}
                className="boat-item"
                draggable
                onDragEnd={(e) => handleBoatDrop(e, boat.id, boat.name, boat.category)}
              >
                <img src={svgIconDataURL} alt={boat.name} width="50" height="20" />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default BoatToolbar;
