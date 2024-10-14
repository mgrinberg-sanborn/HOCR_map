import React, { useEffect, useState } from 'react';
import BoathouseMap from './BoathouseMap';
import BoathouseSelector from './BoathouseSelector';
import boathousesDataRaw from '../assets/Boathouses.geojson?raw';

const BoathouseBrowser = () => {
    const [selectedBoathouse, setSelectedBoathouse] = useState(null);
    const [boathousesData, setBoathousesData] = useState(null);

    useEffect(() => {
        // Parse the raw GeoJSON string into an object
        const parsedData = JSON.parse(boathousesDataRaw);
        setBoathousesData(parsedData);
    }, []);

    const handleBoathouseSelect = (boathouse) => {
        if (!selectedBoathouse || selectedBoathouse.properties.OBJECTID !== boathouse.properties.OBJECTID) {
            setSelectedBoathouse(boathouse);
            console.log('Browser selected:', boathouse);
        }
    };

    if (!boathousesData) {
        return <div>Loading...</div>; // Add a loading state while data is being parsed
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div>
                <BoathouseMap
                    boathouses={boathousesData.features}
                    onBoathouseSelect={handleBoathouseSelect}
                    selectedBoathouse={selectedBoathouse}
                />
            </div>
            <BoathouseSelector
                boathouses={boathousesData.features}
                onBoathouseSelect={handleBoathouseSelect}
                selectedBoathouse={selectedBoathouse}
            />
        </div>
    );
};

export default BoathouseBrowser;
