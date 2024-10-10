import React from 'react';

const BoatToolbar = ({ draggableBoats, handleBoatDrop }) => {
  return (
    <div className="boat-toolbar">
      <h3>Boats</h3>
      <div className="boat-list">
        {draggableBoats.map((boat) => (
          <div
            key={boat.id}
            className="boat-item"
            draggable
            onDragEnd={(e) => handleBoatDrop(e, boat.id, boat.name, boat.category)}
          >
            <svg width="50" height="20" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" width="35" height="20" fill={boat.category === 'SL' ? 'red' : 'yellow'} />
              <polygon points="10,0 0,10 10,20" fill={boat.category === 'SL' ? 'red' : 'yellow'} />
              <text x="25" y="14" font-size="12" fill="black" font-family="Arial" text-anchor="middle">
                {boat.name}
              </text>
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoatToolbar;
