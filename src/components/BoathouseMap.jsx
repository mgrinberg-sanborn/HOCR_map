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
    const mapRef = useRef(); // For the DOM element
    const mapInstanceRef = useRef(); // For the Map instance
    const featureRefs = useRef([]); // For tracking features

    useEffect(() => {
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

                    // Debug logs to inspect current and new selections
                    console.log('Current selected:', selectedBoathouse);
                    console.log('New selected:', selectedFeature);

                    if (!selectedBoathouse || selectedBoathouse.properties.OBJECTID !== selectedFeature.properties.OBJECTID) {
                        console.log('Selecting new feature:', selectedFeature);
                        onBoathouseSelect(selectedFeature); // Pass the new format to the callback
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

    return <div ref={mapRef} style={{ width: '100%', height: '25vh' }}></div>;
};

export default BoathouseMap;
