import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import { MAPBOX_KEY } from '../config'; 
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

mapboxgl.accessToken = MAPBOX_KEY;

export default function MapboxComponent({showModal, onCloseModal, boundary, holes}) {

    const turf = require('@turf/turf');
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [zoom, setZoom] = useState(9);
    const [mapLoaded, setMapLoaded] = useState(false);
    
    const [input1, setInput1] = useState("");
    const [input2, setInput2] = useState("");
    const [input3, setInput3] = useState("");
    const [input4, setInput4] = useState("");


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
        
         

        map.current.on('draw.create', (event) => {
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

    const handleInputChange = (e, setInput) => {
        setInput(e.target.value);
      };

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
                <br></br><br></br><br></br>
                <Stack spacing={2} p={2}>
                  <TextField 
                    variant="outlined" 
                    placeholder="New coords 1" 
                    value={input1} 
                    onChange={(e) => handleInputChange(e, setInput1)}
                    multiline
                  />
                  <TextField 
                    variant="outlined" 
                    placeholder="New coords 2" 
                    value={input2} 
                    onChange={(e) => handleInputChange(e, setInput2)}
                    multiline
                  />
                  <TextField 
                    variant="outlined" 
                    placeholder="New coords 3" 
                    value={input3} 
                    onChange={(e) => handleInputChange(e, setInput3)}
                    multiline
                  />
                  <TextField 
                    variant="outlined" 
                    placeholder="New coords 4" 
                    value={input4} 
                    onChange={(e) => handleInputChange(e, setInput4)}
                    multiline
                  />
                  <Button variant="contained" color="primary">Submit</Button>
                </Stack>
            </div>
            }
        </>
      );
    };