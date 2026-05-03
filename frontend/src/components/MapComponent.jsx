import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Note: Replace with your actual Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.replace_this_with_your_actual_mapbox_token_here_from_mapbox_website';

const MapComponent = ({ safeMode }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    
    // Using a light, aesthetic map style
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-74.006, 40.7128], // Default to NYC
      zoom: 13,
      pitch: 45, // Add some pitch for a modern 3D look
      bearing: -17.6,
      antialias: true
    });

    map.current.on('style.load', () => {
      // Add 3D buildings for aesthetic
      const layers = map.current.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout['text-field']
      ).id;

      map.current.addLayer(
        {
          'id': 'add-3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        },
        labelLayerId
      );

      // Add a mock safe route
      map.current.addSource('route', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': [
              [-74.010, 40.710],
              [-74.008, 40.713],
              [-74.003, 40.715],
              [-73.999, 40.718]
            ]
          }
        }
      });

      map.current.addLayer({
        'id': 'route-line',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': safeMode ? '#10B981' : '#3B82F6',
          'line-width': 6,
          'line-opacity': 0.8
        }
      });
      
      // Add a mock crime heatmap zone
      map.current.addSource('risk-zones', {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': [
            {
              'type': 'Feature',
              'geometry': {
                'type': 'Point',
                'coordinates': [-74.005, 40.714]
              },
              'properties': { 'risk': 0.8 }
            }
          ]
        }
      });

      map.current.addLayer({
        id: 'risk-heatmap',
        type: 'heatmap',
        source: 'risk-zones',
        paint: {
          'heatmap-weight': ['get', 'risk'],
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(239, 68, 68, 0)',
            0.5,
            'rgba(239, 68, 68, 0.5)',
            1,
            'rgba(239, 68, 68, 0.8)'
          ],
          'heatmap-radius': 50,
          'heatmap-opacity': safeMode ? 0.8 : 0.3 // Show clearly in safe mode to explain why it routes around
        }
      });
    });
  }, []);

  // Update route color and heatmap opacity when safeMode changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    
    if (map.current.getLayer('route-line')) {
      map.current.setPaintProperty(
        'route-line',
        'line-color',
        safeMode ? '#10B981' : '#3B82F6'
      );
    }
    
    if (map.current.getLayer('risk-heatmap')) {
      map.current.setPaintProperty(
        'risk-heatmap',
        'heatmap-opacity',
        safeMode ? 0.8 : 0.3
      );
    }
  }, [safeMode]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default MapComponent;
