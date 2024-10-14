import React, { useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';
import { Feature } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Point } from 'ol/geom';
import { Style, Fill, Stroke, Circle } from 'ol/style';

const BoathouseMap = ({ boathouses, onBoathouseSelect, selectedBoathouse }) => {
    console.log('Map', selectedBoathouse)
    const mapRef = useRef(); // For the DOM element
    const mapInstanceRef = useRef(); // For the Map instance
    const featureRefs = useRef([]); // For tracking features

    useEffect(() => {
        // Create the map instance only once
        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
            ],
            view: new View({
                center: fromLonLat([-71.0968, 42.363421]), // Default center
                zoom: 13,
            }),
        });

        mapInstanceRef.current = map;

        return () => {
            // Cleanup the map instance when component unmounts
            map.setTarget(undefined);
        };
    }, []);

    useEffect(() => {
        if (boathouses.length > 0) {
            const features = boathouses.map((boathouse) => {
                const feature = new Feature({
                    geometry: new Point(fromLonLat([boathouse.properties.Longitude, boathouse.properties.Latitude])),
                    properties: boathouse.properties,
                });

                feature.setStyle(new Style({
                    image: new Circle({
                        radius: 7,
                        fill: new Fill({ color: 'blue' }), // Default color for boathouses
                        stroke: new Stroke({ color: 'white', width: 2 }),
                    }),
                }));

                return feature;
            });

            featureRefs.current = features; // Store the features

            const vectorSource = new VectorSource({ features });
            const vectorLayer = new VectorLayer({ source: vectorSource });

            // Clear previous layers and add the new one
            mapInstanceRef.current.getLayers().clear();
            mapInstanceRef.current.addLayer(new TileLayer({ source: new OSM() }));
            mapInstanceRef.current.addLayer(vectorLayer);

            // Set up click event for features
            mapInstanceRef.current.on('click', (event) => {
                mapInstanceRef.current.forEachFeatureAtPixel(event.pixel, (feature) => {
                    const properties = feature.get('properties');
                    console.log('Selected:', properties);
                    onBoathouseSelect(properties);
                });
            });
        }
    }, [boathouses, onBoathouseSelect]);

    useEffect(() => {
        console.log(selectedBoathouse);
        if (selectedBoathouse && mapInstanceRef.current) {
            const coords = [
                selectedBoathouse.properties.Longitude,
                selectedBoathouse.properties.Latitude,
            ];

            if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                mapInstanceRef.current.getView().animate({
                    center: fromLonLat(coords),
                    zoom: 15,
                });
            }

            // Update styles of all features based on selection
            featureRefs.current.forEach((feature) => {
                const isSelected = feature.get('properties').OBJECTID === selectedBoathouse.properties.OBJECTID;
                feature.setStyle(new Style({
                    image: new Circle({
                        radius: isSelected ? 10 : 7, // Make selected larger
                        fill: new Fill({ color: isSelected ? 'red' : 'blue' }), // Change color if selected
                        stroke: new Stroke({ color: 'white', width: 2 }),
                    }),
                }));
            });
        }
    }, [selectedBoathouse]);

    return (
            <div ref={mapRef} style={{ width: '100%', height: '25vh' }}></div>
    );
};

export default BoathouseMap;
