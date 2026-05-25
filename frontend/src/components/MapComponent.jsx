import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// ⚡ FASTEST ROUTE (Passes directly through Foley Square and Canal St crime hotspots)
const FASTEST_ROUTE = [
  [-74.0100, 40.7100], // Start: WTC
  [-74.0090, 40.7112],
  [-74.0078, 40.7124],
  [-74.0062, 40.7136],
  [-74.0045, 40.7148], // Near Foley Square vandalism & poor lighting spot (-74.0030, 40.7145)
  [-74.0028, 40.7156], // Directly through Lafayette & Worth physical altercation spot (-74.0018, 40.7158)
  [-74.0010, 40.7163],
  [-73.9995, 40.7172], // Near Canal & Mott St heavy robbery hotspot (-73.9983, 40.7162)
  [-73.9985, 40.7180], // Destination
];

// 🛡️ SAFEST ROUTE (detours South-East and around to completely bypass all crime hotspots!)
const SAFEST_ROUTE = [
  [-74.0100, 40.7100], // Start: WTC
  [-74.0085, 40.7095], // Detour South-East away from Chambers St larceny
  [-74.0065, 40.7102],
  [-74.0048, 40.7110], // Avoid Chambers St loitering
  [-74.0035, 40.7120], 
  [-74.0012, 40.7132], // Avoid Foley Square vandalism spot
  [-73.9990, 40.7145], // Bypass Lafayette/Worth altercation spot
  [-73.9975, 40.7160], // Detour East around Canal St robbery hotspot
  [-73.9985, 40.7180], // Destination
];

const ORIGIN = FASTEST_ROUTE[0];
const DESTINATION = FASTEST_ROUTE[FASTEST_ROUTE.length - 1];

const MapComponent = ({ safeMode }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const animFrame = useRef(null);
  const rotationFrame = useRef(null);
  const activeRoute = useRef(FASTEST_ROUTE);

  // Smoothly draw route coordinate by coordinate
  const animateRouteDraw = (coords) => {
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
    
    let step = 0;
    const totalSteps = 80;

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

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-74.005, 40.714],
      zoom: 12.5,
      pitch: 45,
      bearing: -10,
      antialias: true,
      dragRotate: true,
      touchZoomRotate: true,
      pitchWithRotate: true,
    });

    // Uber-style scale control
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    // Premium navigation controllers in top-right for zoom, rotation, and compass
    map.current.addControl(new maplibregl.NavigationControl({ 
      showCompass: true, 
      showZoom: true,
      visualizePitch: true 
    }), 'top-right');

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

      // ── Route source ──
      map.current.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
      });

      // Layer 1: Casing (Uber route border effect)
      map.current.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 18, 'line-opacity': 0.95 },
      });

      // Layer 2: Main route coloring
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

      // Draw initial route
      activeRoute.current = safeMode ? SAFEST_ROUTE : FASTEST_ROUTE;
      animateRouteDraw(activeRoute.current);

      // Markers
      addOriginMarker();
      addDestinationMarker();

      // ── Risk Heatmap Source ──
      map.current.addSource('risk-zones', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
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

      // Load crime/incident seeding data from Backend
      const loadHeatmapData = async () => {
        try {
          const res = await fetch('http://localhost:8000/api/safety-heatmap');
          const data = await res.json();
          
          let features = data.zones.map(z => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [z.lng, z.lat] },
            properties: { risk: z.risk_score }
          }));
          
          if (map.current.getSource('risk-zones')) {
            map.current.getSource('risk-zones').setData({
              type: 'FeatureCollection',
              features: features
            });
          }

          // Live websocket updates for newly submitted crime reports
          const ws = new WebSocket('ws://localhost:8000/ws/reports');
          ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'new_report') {
              const z = msg.report;
              features.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [z.lng, z.lat] },
                properties: { risk: z.risk_score }
              });
              
              if (map.current.getSource('risk-zones')) {
                map.current.getSource('risk-zones').setData({
                  type: 'FeatureCollection',
                  features: features
                });
              }
            }
          };
        } catch (e) {
          console.error('Failed to load heatmap data', e);
        }
      };

      loadHeatmapData();

      // ── Smooth Cinematic Auto-Rotation on Idle ──
      let isUserInteracting = false;
      let idleTimeout;

      const rotateCamera = () => {
        if (!isUserInteracting && map.current) {
          const currentBearing = map.current.getBearing();
          // Slow, butter-smooth 60fps rotation (0.035 degrees per frame)
          map.current.setBearing((currentBearing + 0.035) % 360);
        }
        rotationFrame.current = requestAnimationFrame(rotateCamera);
      };

      rotateCamera();

      // Pause auto-rotation on drag/scroll/manual rotate, then resume after 5s idle
      const pauseRotation = () => {
        isUserInteracting = true;
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => {
          isUserInteracting = false;
        }, 5000);
      };

      map.current.on('mousedown', pauseRotation);
      map.current.on('touchstart', pauseRotation);
      map.current.on('movestart', pauseRotation);
    });

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
      if (rotationFrame.current) cancelAnimationFrame(rotationFrame.current);
    };
  }, []);

  const addOriginMarker = () => {
    const el = document.createElement('div');
    el.className = 'origin-marker';
    el.innerHTML = `<div class="origin-pulse"></div><div class="origin-dot"></div>`;
    new maplibregl.Marker({ element: el }).setLngLat(ORIGIN).addTo(map.current);
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
    new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(DESTINATION)
      .addTo(map.current);
  };

  // Animate route and color transition when Safe Mode toggles
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    activeRoute.current = safeMode ? SAFEST_ROUTE : FASTEST_ROUTE;
    animateRouteDraw(activeRoute.current);

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
