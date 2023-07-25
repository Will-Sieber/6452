import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import { MAPBOX_KEY } from '../config'; 
import MapboxDraw from "@mapbox/mapbox-gl-draw";

mapboxgl.accessToken = MAPBOX_KEY;

export default function MapboxComponent({showModal, onCloseModal, boundary, holes}) {

    const turf = require('@turf/turf');
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [zoom, setZoom] = useState(9);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        let updatedBoundary = formatCoords(boundary);
        console.log(updatedBoundary)
        const featureCollection = turf.featureCollection([
            turf.polygon([updatedBoundary])
        ]);
        const centerPoint = turf.centerOfMass(featureCollection);
        let long = (centerPoint.geometry.coordinates[0]);
        let latit = (centerPoint.geometry.coordinates[1]);

        if (map.current) return; // initialize map only once
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [long, latit],
            zoom: zoom,
            dragPan: false
        });

        const draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
              polygon: true,
              trash: true
            }
          });
        
         

        map.on('draw.create', (event) => {
            const newFeatures = event.features;
            console.log('New features:', newFeatures);
        });
    });

    function formatCoords(coords_dict) {
        if (coords_dict === undefined) return [];
        const result = [];
        coords_dict.forEach((point) => {
            result.push([point.lon, point.lat]);
        });
        console.log(result);
        result.push(result[0]); // Should be a complete loop to properly render the polygon
        return result;
    }

    useEffect(() => {
        if (!map.current) return;
        map.current.on('load', () => {setMapLoaded(true);});
        if (!mapLoaded) return;
        const sources = map.current.getStyle().sources;
        if (!sources.hasOwnProperty(`Polygon-0`))  {
            map.current.addSource(`Polygon-0`, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [formatCoords(boundary), formatCoords(...holes)]
                    }
                }
            });
            map.current.addLayer({
                id: `Polygon-0-Layer`,
                type: 'fill',
                source: `Polygon-0`,
                paint: {
                    'fill-color': '#FF0000',
                    'fill-opacity': 0.5
                    }
            })
        }
    }, [boundary, map, mapLoaded])

  return (
    <>
        {showModal && <div style={{width: '80%'}}>
            <div ref={mapContainer} className="map-container" style={{'height': '400px'}}/>
        </div>
        }
    </>
  );
};
