import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.replace_with_your_token_in_env_file';

// Full NYC route with more waypoints for smooth drawing
const ROUTE_COORDS = [
  [-74.0100, 40.7100],
  [-74.0090, 40.7112],
  [-74.0078, 40.7124],
  [-74.0062, 40.7136],
  [-74.0045, 40.7148],
  [-74.0028, 40.7156],
  [-74.0010, 40.7163],
  [-73.9995, 40.7172],
  [-73.9985, 40.7180],
];

const ORIGIN = ROUTE_COORDS[0];
const DESTINATION = ROUTE_COORDS[ROUTE_COORDS.length - 1];

const MapComponent = ({ safeMode }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const animFrame = useRef(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: [-74.005, 40.714],
      zoom: 12.5,
      pitch: 45,
      bearing: -10,
      antialias: true,
    });

    // Only scale — minimal like Uber
    map.current.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.current.on('load', () => {
      // Cinematic fly-in on load
      map.current.flyTo({
        center: [-74.004, 40.7145],
        zoom: 14.5,
        pitch: 45,
        bearing: -10,
        speed: 1.2,
        curve: 1.42,
        duration: 2200,
        easing: (t) => t * (2 - t),
      });

      // ── Route source (starts empty, animated in) ──
      map.current.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
      });

      // Layer 1: thick white casing (Uber border effect)
      map.current.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 18, 'line-opacity': 0.95 },
      });

      // Layer 2: main coloured route on top
      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': safeMode ? '#10b981' : '#1e40af',
          'line-width': 9,
          'line-opacity': 1,
        },
      });

      // ── Animated route draw ──
      animateRouteDraw();

      // ── Custom markers ──
      addOriginMarker();
      addDestinationMarker();

      // ── Risk heatmap ──
      map.current.addSource('risk-zones', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', geometry: { type: 'Point', coordinates: [-74.005, 40.714] }, properties: { risk: 0.8 } },
            { type: 'Feature', geometry: { type: 'Point', coordinates: [-74.002, 40.716] }, properties: { risk: 0.5 } },
          ],
        },
      });

      map.current.addLayer({
        id: 'risk-heatmap',
        type: 'heatmap',
        source: 'risk-zones',
        paint: {
          'heatmap-weight': ['get', 'risk'],
          'heatmap-intensity': 1.5,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(244,63,94,0)',
            0.5, 'rgba(244,63,94,0.4)',
            1, 'rgba(244,63,94,0.9)',
          ],
          'heatmap-radius': 70,
          'heatmap-opacity': safeMode ? 0.7 : 0.25,
        },
      });
    });

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, []);

  // ── Animated route draw: smoothly interpolates between waypoints ──
  const animateRouteDraw = () => {
    const coords = ROUTE_COORDS;
    let step = 0;
    const totalSteps = 90;

    const animate = () => {
      step++;
      const progress = step / totalSteps;
      const rawIndex = progress * (coords.length - 1);
      const floorIdx = Math.floor(rawIndex);
      const frac = rawIndex - floorIdx;

      const slice = coords.slice(0, floorIdx + 1);
      if (floorIdx < coords.length - 1) {
        const from = coords[floorIdx];
        const to = coords[floorIdx + 1];
        slice.push([
          from[0] + (to[0] - from[0]) * frac,
          from[1] + (to[1] - from[1]) * frac,
        ]);
      }

      if (map.current?.getSource('route')) {
        map.current.getSource('route').setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: slice },
        });
      }

      if (step < totalSteps) {
        animFrame.current = requestAnimationFrame(animate);
      }
    };

    animFrame.current = requestAnimationFrame(animate);
  };

  const addOriginMarker = () => {
    const el = document.createElement('div');
    el.className = 'origin-marker';
    el.innerHTML = `<div class="origin-pulse"></div><div class="origin-dot"></div>`;
    new mapboxgl.Marker({ element: el }).setLngLat(ORIGIN).addTo(map.current);
  };

  const addDestinationMarker = () => {
    const el = document.createElement('div');
    el.className = 'destination-marker';
    el.innerHTML = `
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.611 0 0 7.611 0 17c0 11.314 17 27 17 27S34 28.314 34 17C34 7.611 26.389 0 17 0z" fill="#0f172a"/>
        <circle cx="17" cy="17" r="8" fill="white"/>
        <circle cx="17" cy="17" r="4" fill="#0f172a"/>
      </svg>`;
    new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(DESTINATION)
      .addTo(map.current);
  };

  // Update colours when safeMode toggles
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    if (map.current.getLayer('route-line')) {
      map.current.setPaintProperty('route-line', 'line-color', safeMode ? '#10b981' : '#1e40af');
    }
    if (map.current.getLayer('risk-heatmap')) {
      map.current.setPaintProperty('risk-heatmap', 'heatmap-opacity', safeMode ? 0.7 : 0.25);
    }
  }, [safeMode]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default MapComponent;
