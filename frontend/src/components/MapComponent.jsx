import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Note: Replace with your actual Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.replace_with_your_token_in_env_file';

const MapComponent = ({ safeMode }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    
    // Using a sleek dark map style for a premium look
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Premium dark mode Mapbox style
      center: [-74.006, 40.7128], // Default to NYC
      zoom: 14.5,
      pitch: 60, // Higher pitch for a more immersive 3D feel
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
            'fill-extrusion-color': '#1f2937', // Dark slate for buildings
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
            'fill-extrusion-opacity': 0.8
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

      // Route glow effect
      map.current.addLayer({
        'id': 'route-line-glow',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': safeMode ? '#10B981' : '#6366f1',
          'line-width': 14,
          'line-opacity': 0.3,
          'line-blur': 10
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
          'line-color': safeMode ? '#34d399' : '#818cf8',
          'line-width': 6,
          'line-opacity': 1
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
          'heatmap-intensity': 1.5,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(244, 63, 94, 0)', // Rose 500
            0.5,
            'rgba(244, 63, 94, 0.4)',
            1,
            'rgba(244, 63, 94, 0.9)'
          ],
          'heatmap-radius': 70,
          'heatmap-opacity': safeMode ? 0.7 : 0.2
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
        safeMode ? '#34d399' : '#818cf8'
      );
      map.current.setPaintProperty(
        'route-line-glow',
        'line-color',
        safeMode ? '#10B981' : '#6366f1'
      );
    }
    
    if (map.current.getLayer('risk-heatmap')) {
      map.current.setPaintProperty(
        'risk-heatmap',
        'heatmap-opacity',
        safeMode ? 0.7 : 0.2
      );
    }
  }, [safeMode]);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#1f2937]">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default MapComponent;
