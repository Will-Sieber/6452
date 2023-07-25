import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import { MAPBOX_KEY } from '../config'; 

mapboxgl.accessToken = MAPBOX_KEY;



export default function Map(props) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng, setLng] = useState(-70.9);
    const [lat, setLat] = useState(42.35);
    const [zoom, setZoom] = useState(9);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        if (map.current) return; // initialize map only once
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: zoom
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
        props.geometries.forEach((geometry, index) => {
            console.log(`Adding polygon ${index}:`)
            console.log(geometry);
            map.current.addSource(`Polygon-${index}`, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [formatCoords(geometry.boundary), formatCoords(...geometry.holes)]
                    }
                }
            });
            map.current.addLayer({
                id: `Polygon-${index}-Layer`,
                type: 'fill',
                source: `Polygon-${index}`,
                paint: {
                    'fill-color': '#FF0000',
                    'fill-opacity': 0.5
                    }
            })
        })
    }, [props.geometries, map, mapLoaded])

        return (
            <div style={{width: '80%'}}>
                <div ref={mapContainer} className="map-container" style={{'height': '400px'}}/>
            </div>
        );
}