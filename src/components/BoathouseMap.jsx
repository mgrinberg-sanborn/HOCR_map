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
import { Control } from 'ol/control';

const BoathouseMap = ({ boathouses, onBoathouseSelect, selectedBoathouse }) => {
    const mapRef = useRef(); // For the DOM element
    const mapInstanceRef = useRef(); // For the Map instance
    const featureRefs = useRef([]); // For tracking features
    const defaultCenter = fromLonLat([-71.0968, 42.363421]); // Default center coordinates

    useEffect(() => {
        const map = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
            ],
            view: new View({
                center: defaultCenter, // Default center
                zoom: 13,
            }),
        });

        mapInstanceRef.current = map;

        // Create the Find My Location button
        const locateButton = document.createElement('button');
        locateButton.className = 'locate';
        locateButton.innerHTML = '📍'; // Location pin emoji
        locateButton.title = 'Find My Location';
        locateButton.addEventListener('click', findMyLocation);
        locateButton.style.marginTop = '5px'; // Adjust position to avoid overlap
        map.addControl(new Control({ element: locateButton }));

        // Create the Return to Home button
        const homeButton = document.createElement('button');
        homeButton.className = 'home-button';
        homeButton.innerHTML = '🏠'; // Home emoji
        homeButton.title = 'Return to Home';
        homeButton.addEventListener('click', returnToHome);
        homeButton.style.marginTop = '0px'; // Adjust position to avoid overlap
        map.addControl(new Control({ element: homeButton }));

        return () => {
            map.setTarget(undefined);
        };
    }, []);

    // Function to find and center map on the user's location
    const findMyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                const coords = fromLonLat([longitude, latitude]);

                mapInstanceRef.current.getView().animate({
                    center: coords,
                    zoom: 15,
                });
            }, () => {
                alert('Geolocation not supported or permission denied.');
            });
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    };

    // Function to return the map to the default home view
    const returnToHome = () => {
        mapInstanceRef.current.getView().animate({
            center: defaultCenter,
            zoom: 13,
        });
    };

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

            mapInstanceRef.current.getLayers().clear();
            mapInstanceRef.current.addLayer(new TileLayer({ source: new OSM() }));
            mapInstanceRef.current.addLayer(vectorLayer);

            mapInstanceRef.current.on('click', (event) => {
                mapInstanceRef.current.forEachFeatureAtPixel(event.pixel, (feature) => {
                    const properties = feature.get('properties');
                    const id = properties.OBJECTID;

                    const selectedFeature = {
                        type: "Feature",
                        id: id,
                        properties: {
                            OBJECTID: properties.OBJECTID,
                            Boathouse: properties.Boathouse,
                            Users: properties.Users,
                            Longitude: properties.Longitude,
                            Latitude: properties.Latitude,
                            Construction_Year: properties.Construction_Year,
                            Image_URL: properties.Image_URL,
                            sort: properties.sort,
                        }
                    };

                    if (!selectedBoathouse || selectedBoathouse.properties.OBJECTID !== selectedFeature.properties.OBJECTID) {
                        onBoathouseSelect(selectedFeature);
                    }
                });
            });
        }
    }, [boathouses, onBoathouseSelect]);

    useEffect(() => {
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

            featureRefs.current.forEach((feature) => {
                const isSelected = feature.get('properties').OBJECTID === selectedBoathouse.properties.OBJECTID;
                feature.setStyle(new Style({
                    image: new Circle({
                        radius: isSelected ? 10 : 7,
                        fill: new Fill({ color: isSelected ? 'red' : 'blue' }),
                        stroke: new Stroke({ color: 'white', width: 2 }),
                    }),
                }));
            });
        }
    }, [selectedBoathouse]);

    return <div ref={mapRef} style={{ width: '100%', height: '40vh' }}></div>;
};

export default BoathouseMap;
