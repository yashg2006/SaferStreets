import React, { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
// Make Leaflet available globally (existing code uses window.L pattern)
window.L = L;

// LOCAL DATA & METRICS
const LOC = [
  { id: 'm1', name: 'Andheri East', city: 'Mumbai', state: 'Maharashtra', lat: 19.1136, lng: 72.8697, crime: 145, lights: 65, cctv: 3.2, police: 1.2 },
  { id: 'm2', name: 'Dharavi', city: 'Mumbai', state: 'Maharashtra', lat: 19.0408, lng: 72.8549, crime: 312, lights: 35, cctv: 0.8, police: 2.1 },
  { id: 'm3', name: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', lat: 19.0596, lng: 72.8295, crime: 87, lights: 82, cctv: 5.1, police: 0.8 },
  { id: 'm4', name: 'Colaba', city: 'Mumbai', state: 'Maharashtra', lat: 18.9068, lng: 72.8147, crime: 102, lights: 78, cctv: 6.2, police: 0.6 },
  { id: 'm5', name: 'Kurla West', city: 'Mumbai', state: 'Maharashtra', lat: 19.0728, lng: 72.8826, crime: 267, lights: 42, cctv: 1.8, police: 1.5 },
  { id: 'm6', name: 'Worli', city: 'Mumbai', state: 'Maharashtra', lat: 19.0177, lng: 72.8177, crime: 95, lights: 75, cctv: 4.5, police: 0.9 },
  { id: 'm7', name: 'Borivali East', city: 'Mumbai', state: 'Maharashtra', lat: 19.2281, lng: 72.8567, crime: 118, lights: 60, cctv: 2.8, police: 1.3 },
  { id: 'm8', name: 'Govandi', city: 'Mumbai', state: 'Maharashtra', lat: 19.0558, lng: 72.9183, crime: 285, lights: 38, cctv: 0.9, police: 1.8 },
  { id: 'd1', name: 'Connaught Place', city: 'Delhi', state: 'Delhi', lat: 28.6315, lng: 77.2167, crime: 156, lights: 85, cctv: 8.2, police: 0.5 },
  { id: 'd2', name: 'Paharganj', city: 'Delhi', state: 'Delhi', lat: 28.6448, lng: 77.2097, crime: 298, lights: 48, cctv: 2.1, police: 1.1 },
  { id: 'd3', name: 'Saket', city: 'Delhi', state: 'Delhi', lat: 28.5289, lng: 77.2065, crime: 78, lights: 88, cctv: 6.5, police: 0.7 },
  { id: 'd4', name: 'Karol Bagh', city: 'Delhi', state: 'Delhi', lat: 28.6519, lng: 77.1909, crime: 185, lights: 65, cctv: 3.8, police: 0.9 },
  { id: 'd5', name: 'Rohini Sec 3', city: 'Delhi', state: 'Delhi', lat: 28.7358, lng: 77.1147, crime: 132, lights: 72, cctv: 4.2, police: 1.0 },
  { id: 'd6', name: 'Dwarka Sec 6', city: 'Delhi', state: 'Delhi', lat: 28.5921, lng: 77.0460, crime: 88, lights: 80, cctv: 5.8, police: 0.8 },
  { id: 'd7', name: 'Mustafabad', city: 'Delhi', state: 'Delhi', lat: 28.7267, lng: 77.2755, crime: 356, lights: 32, cctv: 0.6, police: 2.5 },
  { id: 'b1', name: 'Koramangala', city: 'Bengaluru', state: 'Karnataka', lat: 12.9352, lng: 77.6245, crime: 72, lights: 78, cctv: 5.5, police: 0.9 },
  { id: 'b2', name: 'Whitefield', city: 'Bengaluru', state: 'Karnataka', lat: 12.9698, lng: 77.7500, crime: 65, lights: 75, cctv: 4.8, police: 1.2 },
  { id: 'b3', name: 'Shivajinagar', city: 'Bengaluru', state: 'Karnataka', lat: 12.9850, lng: 77.6011, crime: 178, lights: 58, cctv: 2.9, police: 0.8 },
  { id: 'b4', name: 'Majestic', city: 'Bengaluru', state: 'Karnataka', lat: 12.9784, lng: 77.5706, crime: 245, lights: 52, cctv: 2.2, police: 0.7 },
  { id: 'c1', name: 'T Nagar', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0418, lng: 80.2341, crime: 112, lights: 72, cctv: 4.5, police: 0.9 },
  { id: 'c2', name: 'Anna Nagar', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0850, lng: 80.2101, crime: 68, lights: 85, cctv: 5.8, police: 0.7 },
  { id: 'c3', name: 'Vyasarpadi', city: 'Chennai', state: 'Tamil Nadu', lat: 13.1150, lng: 80.2543, crime: 289, lights: 40, cctv: 0.9, police: 1.9 },
  { id: 'h1', name: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', lat: 17.4156, lng: 78.4347, crime: 65, lights: 88, cctv: 6.8, police: 0.6 },
  { id: 'h2', name: 'Secunderabad', city: 'Hyderabad', state: 'Telangana', lat: 17.4399, lng: 78.4983, crime: 132, lights: 70, cctv: 4.1, police: 0.9 },
  { id: 'h3', name: 'Charminar', city: 'Hyderabad', state: 'Telangana', lat: 17.3616, lng: 78.4747, crime: 278, lights: 45, cctv: 1.8, police: 1.3 },
  { id: 'p1', name: 'Koregaon Park', city: 'Pune', state: 'Maharashtra', lat: 18.5362, lng: 73.8944, crime: 58, lights: 82, cctv: 5.9, police: 0.8 },
  { id: 'p2', name: 'Swargate', city: 'Pune', state: 'Maharashtra', lat: 18.5018, lng: 73.8606, crime: 165, lights: 60, cctv: 2.8, police: 1.1 },
  { id: 'k1', name: 'Park Street', city: 'Kolkata', state: 'West Bengal', lat: 22.5518, lng: 88.3525, crime: 95, lights: 80, cctv: 5.2, police: 0.7 },
  { id: 'k2', name: 'Howrah', city: 'Kolkata', state: 'West Bengal', lat: 22.5958, lng: 88.2636, crime: 198, lights: 55, cctv: 2.5, police: 1.2 },
  { id: 'a1', name: 'Navrangpura', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0395, lng: 72.5615, crime: 88, lights: 78, cctv: 4.8, police: 0.8 },
  { id: 'j1', name: 'Civil Lines', city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, crime: 92, lights: 75, cctv: 4.2, police: 0.9 },
  { id: 'j2', name: 'Walled City', city: 'Jaipur', state: 'Rajasthan', lat: 26.9239, lng: 75.8267, crime: 215, lights: 48, cctv: 1.9, police: 1.4 },
  { id: 'l1', name: 'Hazratganj', city: 'Lucknow', state: 'U.P.', lat: 26.8467, lng: 80.9462, crime: 138, lights: 68, cctv: 3.5, police: 1.0 },
  { id: 'l2', name: 'Aminabad', city: 'Lucknow', state: 'U.P.', lat: 26.8487, lng: 80.9337, crime: 225, lights: 52, cctv: 1.7, police: 1.4 }
];

const INC_T = [
  { v: 'theft', e: '🎒', l: 'Theft / pickpocket', sev: 3 },
  { v: 'robbery', e: '🔪', l: 'Robbery', sev: 5 },
  { v: 'harassment', e: '😤', l: 'Harassment', sev: 3 },
  { v: 'eve_teasing', e: '⚠️', l: 'Eve teasing', sev: 4 },
  { v: 'chain_snatching', e: '⛓', l: 'Chain snatching', sev: 4 },
  { v: 'assault', e: '🚨', l: 'Assault', sev: 5 },
  { v: 'suspicious', e: '👁', l: 'Suspicious activity', sev: 2 },
  { v: 'road_hazard', e: '🚧', l: 'Road hazard', sev: 1 },
  { v: 'broken_light', e: '💡', l: 'Broken street light', sev: 1 },
  { v: 'other', e: '📌', l: 'Other', sev: 2 }
];

const POLICE_ST = [
  { name: 'Andheri PS', lat: 19.1201, lng: 72.8478 },
  { name: 'Dharavi PS', lat: 19.0468, lng: 72.8521 },
  { name: 'Bandra PS', lat: 19.0543, lng: 72.8313 },
  { name: 'Connaught Place PS', lat: 28.6337, lng: 77.2191 },
  { name: 'Paharganj PS', lat: 28.6452, lng: 77.2143 },
  { name: 'Saket PS', lat: 28.5237, lng: 77.2105 },
  { name: 'Koramangala PS', lat: 12.9311, lng: 77.6225 },
  { name: 'T Nagar PS', lat: 13.0438, lng: 80.2361 },
  { name: 'Banjara Hills PS', lat: 17.4121, lng: 78.4378 },
  { name: 'Koregaon Park PS', lat: 18.5391, lng: 73.8921 },
  { name: 'Park Street PS', lat: 22.5498, lng: 88.3541 },
  { name: 'Civil Lines PS', lat: 26.9141, lng: 75.7885 },
  { name: 'Hazratganj PS', lat: 26.8441, lng: 80.9481 }
];

const INC_COLORS = {
  theft: '#E53935',
  robbery: '#B71C1C',
  harassment: '#F97316',
  eve_teasing: '#F97316',
  chain_snatching: '#E53935',
  assault: '#B71C1C',
  suspicious: '#7C3AED',
  road_hazard: '#D97706',
  broken_light: '#6B7280',
  other: '#4B5563'
};

// SCORING LOGIC
function calculateScore(l, nightActive = false) {
  let s = 100;
  s -= Math.min(40, l.crime * 0.08);
  s += (l.lights - 50) * 0.15;
  s += Math.min(10, l.cctv * 2.5);
  s -= Math.min(5, l.police * 1.2);
  if (nightActive) s *= 0.72;
  return Math.max(0, Math.min(100, Math.round(s * 10) / 10));
}

function sCol(s) {
  if (s >= 75) return { bg: '#F0FDF4', txt: '#14532D', ring: '#22C55E' };
  if (s >= 55) return { bg: '#FFFBEB', txt: '#713F12', ring: '#F59E0B' };
  if (s >= 35) return { bg: '#FFF7ED', txt: '#7C2D12', ring: '#F97316' };
  return { bg: '#FEF2F2', txt: '#7F1D1D', ring: '#EF4444' };
}

function sGrade(s) {
  return s >= 75 ? 'A' : s >= 55 ? 'B' : s >= 35 ? 'C' : 'D';
}

function sLabel(s) {
  return s >= 75 ? 'Very Safe' : s >= 55 ? 'Mostly Safe' : s >= 35 ? 'Use Caution' : 'High Risk';
}

function App() {
  // STATE MANAGEMENT
  const [night, setNight] = useState(false);
  const [selLoc, setSelLoc] = useState(null);
  const [repCoords, setRepCoords] = useState(null);
  const [selInc, setSelInc] = useState('');
  
  // Modals Visibility
  const [repOv, setRepOv] = useState(false);
  const [aiOv, setAiOv] = useState(false);
  const [emgOv, setEmgOv] = useState(false);
  
  // AI advice
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTips, setAiTips] = useState([]);
  const [aiSummary, setAiSummary] = useState('');

  // Search input & Suggestions
  const [searchVal, setSearchVal] = useState('');
  const [sugs, setSugs] = useState([]);
  const [sugOpen, setSugOpen] = useState(false);

  // Map Toggles
  const [lyrs, setLyrs] = useState({
    crime: true,
    incidents: true,
    lights: false,
    cctv: false,
    police: true
  });

  // Routing
  const [routeMode, setRouteMode] = useState(false);
  const [routePts, setRoutePts] = useState([]);
  
  // Real-time backend incident zones
  const [dbZones, setDbZones] = useState([]);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastOn, setToastOn] = useState(false);
  const toastTimeout = useRef(null);

  // Form Inputs
  const [rDesc, setRDesc] = useState('');
  const [rArea, setRArea] = useState('');
  const [rNight, setRNight] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // MAP REFERENCES
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Layer groups refs to easily add/remove on toggle
  const heatLayerRef = useRef(null);
  const incidentMarkersRef = useRef([]);
  const cctvMarkersRef = useRef([]);
  const lampMarkersRef = useRef([]);
  const policeMarkersRef = useRef([]);
  const localityMarkersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const routePointMarkersRef = useRef([]);
  // Refs to avoid stale closures inside the map click handler
  const routeModeRef = useRef(false);
  const routePtsRef = useRef([]);
  // Current location (Google Maps-style blue dot)
  const locationMarkerRef = useRef(null);
  const locationCircleRef = useRef(null);
  const watchIdRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [followLocation, setFollowLocation] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    if (token && email) {
      setIsLoggedIn(true);
      setUserEmail(email);
    }
  }, []);

  // Keep refs in sync with state so stable map handlers always see current values
  useEffect(() => { routeModeRef.current = routeMode; }, [routeMode]);
  useEffect(() => { routePtsRef.current = routePts; }, [routePts]);

  // ── GPS: Watch user position like Google Maps ──
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => setUserLocation({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
      (err) => console.warn('GPS error:', err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 4000 }
    );
    watchIdRef.current = id;
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ── Update blue-dot marker whenever position changes ──
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    const { lat, lng, accuracy } = userLocation;

    if (locationCircleRef.current) {
      locationCircleRef.current.setLatLng([lat, lng]);
      locationCircleRef.current.setRadius(accuracy);
    } else {
      locationCircleRef.current = window.L.circle([lat, lng], {
        radius: accuracy, color: '#4285F4', fillColor: '#4285F4',
        fillOpacity: 0.12, weight: 1.5, interactive: false,
      }).addTo(mapRef.current);
    }

    if (locationMarkerRef.current) {
      locationMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const icon = window.L.divIcon({
        html: `<div class="my-loc-wrap"><div class="my-loc-pulse"></div><div class="my-loc-dot"></div></div>`,
        className: '', iconSize: [24, 24], iconAnchor: [12, 12],
      });
      locationMarkerRef.current = window.L.marker([lat, lng], { icon, zIndexOffset: 1000 })
        .bindPopup('<b>📍 Your Location</b>')
        .addTo(mapRef.current);
    }

    if (followLocation) {
      mapRef.current.setView([lat, lng], Math.max(mapRef.current.getZoom(), 16));
    }
  }, [userLocation, followLocation]);

  const handleGoogleSuccess = async (response) => {
    try {
      const res = await fetch('http://localhost:8000/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
      });
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userEmail', data.email);
        setUserEmail(data.email);
        setIsLoggedIn(true);
        triggerToast(`👋 Welcome, ${data.email.split('@')[0]}! Signed in via Google.`);
      } else {
        triggerToast('❌ Backend failed to issue OAuth session.');
      }
    } catch (err) {
      console.error(err);
      triggerToast('❌ Backend authentication handshake failed.');
    }
  };

  // Toast helper
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setToastOn(true);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => {
      setToastOn(false);
    }, 3200);
  };

  // 1. INITIALIZE MAP (Leaflet)
  useEffect(() => {
    if (mapRef.current) return;

    // Center map roughly in Mumbai coordinates as standard initial view
    const initialMap = window.L.map(mapContainerRef.current, {
      center: [19.0760, 72.8777],
      zoom: 12,
      minZoom: 4,
      maxZoom: 18,
      maxBounds: [[6.5, 68.1], [35.7, 97.4]],
      maxBoundsViscosity: 0.85,
      zoomControl: true
    });

    // Add premium CartoDB basemap tiles (Day theme by default) - fast, reliable, no key needed
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(initialMap);

    // Map Event Listeners
    initialMap.on('click', (e) => {
      // Handle Route Point Selection — use ref to avoid stale closure
      if (routeModeRef.current) {
        handleMapClickForRoute(e.latlng, initialMap);
        return;
      }
      
      // Otherwise, select the nearest locality
      const best = findNearestLocality(e.latlng.lat, e.latlng.lng);
      if (best) {
        selectLocality(best);
      }
    });

    initialMap.on('contextmenu', (e) => {
      setRepCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      setRepOv(true);
    });

    mapRef.current = initialMap;

    // Load initial safety and incident data from FastAPI
    fetchHeatmapData();

    // Hook up real-time websocket
    connectWebSocket();

    // Load initial static marks
    updateCCTVLayer(initialMap);
    updateLampsLayer(initialMap);
    updatePoliceLayer(initialMap);
    updateLocalityLabelsLayer(initialMap);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Stable — uses refs for routeMode/routePts to avoid stale closures

  // Hook WebSocket and HTTP data fetching
  const fetchHeatmapData = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/safety-heatmap');
      const data = await res.json();
      if (data.status === 'success') {
        setDbZones(data.zones);
      }
    } catch (e) {
      console.warn('FastAPI not running, falling back to local seeding visual simulation.', e);
      // Simulate backend zones locally
      const simulated = LOC.filter((_, i) => i % 3 === 0).map((l, i) => {
        const types = ['theft', 'harassment', 'chain_snatching', 'robbery'];
        const emojis = ['🎒', '😤', '⛓', '🔪'];
        return {
          lat: l.lat + (Math.random() - 0.5) * 0.02,
          lng: l.lng + (Math.random() - 0.5) * 0.02,
          risk_score: minmax(0.1, 1.0, l.crime / 320.0),
          primary_factor: types[i % types.length],
          description: `Reported safety concern in ${l.name}. Area needs vigilant watch.`,
          time: '2h ago'
        };
      });
      setDbZones(simulated);
    }
  };

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/reports');
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'new_report') {
          const newZ = msg.report;
          // Add to state
          setDbZones((prev) => [newZ, ...prev]);
          triggerToast(`🚨 New Live Incident: ${newZ.primary_factor.replace('_', ' ')} reported in ${newZ.description}!`);
        }
      };
      
      ws.onerror = () => {
        console.warn('WS connection failed, real-time live events bypassed.');
      };
    } catch (e) {
      console.log('No WS socket server available.', e);
    }
  };

  const minmax = (min, max, val) => Math.max(min, Math.min(max, val));

  // Find nearest locality based on click coordinates
  const findNearestLocality = (lat, lng) => {
    let best = null;
    let bd = Infinity;
    LOC.forEach((l) => {
      const d = Math.hypot(l.lat - lat, l.lng - lng);
      if (d < bd) {
        bd = d;
        best = l;
      }
    });
    return bd < 1.8 ? best : null;
  };

  // Helper to select a locality
  const selectLocality = (l) => {
    setSelLoc(l);
    if (mapRef.current) {
      mapRef.current.flyTo([l.lat, l.lng], 14, {
        duration: 1.0,
        easeLinearity: 0.5
      });
    }
  };

  // 2. LAYER CONTROLLERS (React effect syncing to Leaflet)
  // Heatmap Layer
  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Clean old heatmap layer
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (lyrs.crime && dbZones.length > 0) {
      // Map zones to heatmap data array: [lat, lng, risk_score]
      const hData = dbZones.map((z) => [z.lat, z.lng, z.risk_score]);
      
      heatLayerRef.current = window.L.heatLayer(hData, {
        radius: 38,
        blur: 28,
        maxZoom: 10,
        gradient: {
          0: 'rgba(0,0,0,0)',
          0.3: 'rgba(253,186,56,.4)',
          0.6: 'rgba(234,88,12,.6)',
          1: 'rgba(185,28,28,.82)'
        }
      }).addTo(mapRef.current);
    }
  }, [lyrs.crime, dbZones]);

  // Live Incident Pins
  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Clean old markers
    incidentMarkersRef.current.forEach((m) => mapRef.current.removeLayer(m));
    incidentMarkersRef.current = [];

    if (lyrs.incidents && dbZones.length > 0) {
      dbZones.forEach((inc) => {
        const col = INC_COLORS[inc.primary_factor] || '#555';
        
        // Find corresponding emoji
        const matched = INC_T.find((x) => x.v === inc.primary_factor);
        const emoji = matched ? matched.e : '📌';

        const m = window.L.circleMarker([inc.lat, inc.lng], {
          radius: 9,
          color: '#ffffff',
          weight: 1.5,
          fillColor: col,
          fillOpacity: 0.9
        });

        m.bindPopup(`
          <div class="pc">
            <div class="pt">${emoji} ${inc.primary_factor.toUpperCase().replace('_', ' ')}</div>
            <div class="pm">${inc.description} · ${inc.time || 'Recent'}</div>
          </div>
        `, { maxWidth: 200 });

        m.addTo(mapRef.current);
        incidentMarkersRef.current.push(m);
      });
    }
  }, [lyrs.incidents, dbZones]);

  // CCTV Layer
  const updateCCTVLayer = (mInstance) => {
    cctvMarkersRef.current.forEach((m) => mInstance.removeLayer(m));
    cctvMarkersRef.current = [];

    if (lyrs.cctv) {
      // Seed CCTV cameras around localities
      LOC.filter((_, i) => i % 2 === 0).forEach((l) => {
        const cctvCoords = [
          { lat: l.lat + 0.005, lng: l.lng - 0.006, on: Math.random() > 0.15 },
          { lat: l.lat - 0.006, lng: l.lng + 0.004, on: Math.random() > 0.15 }
        ];

        cctvCoords.forEach((c) => {
          const m = window.L.circleMarker([c.lat, c.lng], {
            radius: 5.5,
            color: '#ffffff',
            weight: 1.2,
            fillColor: c.on ? '#10B981' : '#EF4444',
            fillOpacity: 0.95
          });

          m.bindPopup(`
            <div class="pc">
              <div class="pt">📷 CCTV Camera</div>
              <div class="pm">${c.on ? '🟢 Online & Secure' : '🔴 Offline/Maintenance'}</div>
            </div>
          `);

          m.addTo(mInstance);
          cctvMarkersRef.current.push(m);
        });
      });
    }
  };

  useEffect(() => {
    if (mapRef.current) updateCCTVLayer(mapRef.current);
  }, [lyrs.cctv]);

  // Street Lights Layer
  const updateLampsLayer = (mInstance) => {
    lampMarkersRef.current.forEach((m) => mInstance.removeLayer(m));
    lampMarkersRef.current = [];

    if (lyrs.lights) {
      LOC.filter((_, i) => i % 2 === 0).forEach((l) => {
        // Create 4 streetlights around each locality
        for (let idx = 0; idx < 4; idx++) {
          const latOffset = (Math.random() - 0.5) * 0.015;
          const lngOffset = (Math.random() - 0.5) * 0.015;
          const isLampsOn = Math.random() < (l.lights / 100);

          const m = window.L.circleMarker([l.lat + latOffset, l.lng + lngOffset], {
            radius: 4,
            color: '#ffffff',
            weight: 1,
            fillColor: isLampsOn ? '#FBBF24' : '#94A3B8',
            fillOpacity: 0.9
          });

          m.bindPopup(`
            <div class="pc">
              <div class="pt">💡 Public Street Lamp</div>
              <div class="pm">${isLampsOn ? '🟢 Powered & active' : '⚠️ Reporting outage'}</div>
            </div>
          `);

          m.addTo(mInstance);
          lampMarkersRef.current.push(m);
        }
      });
    }
  };

  useEffect(() => {
    if (mapRef.current) updateLampsLayer(mapRef.current);
  }, [lyrs.lights]);

  // Police Station Badges
  const updatePoliceLayer = (mInstance) => {
    policeMarkersRef.current.forEach((m) => mInstance.removeLayer(m));
    policeMarkersRef.current = [];

    if (lyrs.police) {
      POLICE_ST.forEach((ps) => {
        const htmlIcon = `
          <div style="width:22px;height:22px;background:#3B82F6;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 3px 8px rgba(59,130,246,0.4)">
            🚔
          </div>
        `;
        const divIco = window.L.divIcon({
          html: htmlIcon,
          className: '',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const m = window.L.marker([ps.lat, ps.lng], { icon: divIco });
        m.bindPopup(`
          <div class="pc">
            <div class="pt">🚔 ${ps.name}</div>
            <div class="pm">India Police Command Centre · Active 24/7</div>
          </div>
        `);
        m.addTo(mInstance);
        policeMarkersRef.current.push(m);
      });
    }
  };

  useEffect(() => {
    if (mapRef.current) updatePoliceLayer(mapRef.current);
  }, [lyrs.police]);

  // Locality Badge overlay labels on Map
  const updateLocalityLabelsLayer = (mInstance) => {
    localityMarkersRef.current.forEach((m) => mInstance.removeLayer(m));
    localityMarkersRef.current = [];

    LOC.forEach((l) => {
      const s = calculateScore(l, night);
      const c = sCol(s);
      
      const htmlIcon = `
        <div style="background:${c.bg};border:1.5px solid ${c.ring};border-radius:18px;padding:3px 8px;font-size:11px;font-weight:700;color:${c.txt};white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.12);cursor:pointer;font-family:'DM Sans',sans-serif">
          📍 ${l.name.split(' ')[0]} ${Math.round(s)}
        </div>
      `;

      const divIco = window.L.divIcon({
        html: htmlIcon,
        className: '',
        iconAnchor: [0, 0]
      });

      const m = window.L.marker([l.lat, l.lng], { icon: divIco });
      m.on('click', () => selectLocality(l));
      m.addTo(mInstance);
      localityMarkersRef.current.push(m);
    });
  };

  useEffect(() => {
    if (mapRef.current) updateLocalityLabelsLayer(mapRef.current);
  }, [night]);

  // ── Locate Me (Google Maps-style) ──
  const handleLocateMe = () => {
    if (!userLocation) {
      triggerToast('📍 Waiting for GPS signal...');
      return;
    }
    if (mapRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 17, { duration: 1.5, easeLinearity: 0.5 });
      setFollowLocation(true);
      setTimeout(() => setFollowLocation(false), 10000); // auto-stop follow after 10s
    }
    triggerToast('📍 Centered on your location');
  };

  // 3. SECURE ROUTER CONTROLLERS
  const handleMapClickForRoute = async (latlng, mapInst) => {
    // Read from ref (always current) to avoid stale closure bug
    const updatedPts = [...routePtsRef.current, latlng];
    routePtsRef.current = updatedPts; // update ref immediately
    setRoutePts(updatedPts);

    // Drop temporary coordinate marker
    const marker = window.L.circleMarker([latlng.lat, latlng.lng], {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: '#3B82F6',
      fillOpacity: 1
    }).addTo(mapInst);

    routePointMarkersRef.current.push(marker);

    if (updatedPts.length === 2) {
      triggerToast('🗺 Planning premium route. Requesting safe detour from backend...');
      
      try {
        const res = await fetch('http://localhost:8000/api/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_lat: updatedPts[0].lat,
            start_lng: updatedPts[0].lng,
            end_lat: updatedPts[1].lat,
            end_lng: updatedPts[1].lng,
            safe_mode: true
          })
        });
        
        const data = await res.json();
        if (data.status === 'success') {
          // Draw standard polyline
          const pathCoords = data.route_coordinates.map((c) => [c[1], c[0]]);
          
          if (routeLayerRef.current) {
            mapInst.removeLayer(routeLayerRef.current);
          }

          // Safe detour style: bright emerald casing
          routeLayerRef.current = window.L.polyline(pathCoords, {
            color: '#10B981',
            weight: 6,
            opacity: 0.9,
            lineJoin: 'round'
          }).addTo(mapInst);

          // Fly map to fit the route
          mapInst.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });

          triggerToast(`✅ Safest Route Planned! ETA: ${data.eta_mins} mins (${data.risk_level} Risk)`);
        }
      } catch (err) {
        console.error(err);
        // Fallback drawing direct line
        const fallbackCoords = updatedPts.map((p) => [p.lat, p.lng]);
        if (routeLayerRef.current) mapInst.removeLayer(routeLayerRef.current);
        
        routeLayerRef.current = window.L.polyline(fallbackCoords, {
          color: '#3B82F6',
          weight: 5,
          opacity: 0.85
        }).addTo(mapInst);
        
        triggerToast('✅ Route plotted. Standard straight line connection (Backend router fallback).');
      }

      // Exit route planning mode
      setRouteMode(false);
    }
  };

  const cancelRouteSelection = () => {
    setRouteMode(false);
    setRoutePts([]);
    if (mapRef.current) {
      routePointMarkersRef.current.forEach((m) => mapRef.current.removeLayer(m));
      if (routeLayerRef.current) mapRef.current.removeLayer(routeLayerRef.current);
    }
    routePointMarkersRef.current = [];
    routeLayerRef.current = null;
    triggerToast('Route planning cleared.');
  };

  // 4. GET AI SAFETY RECOMMENDATIONS
  const triggerAIAssistant = async () => {
    if (!selLoc) return;
    setAiTips([]);
    setAiSummary('');
    setAiLoading(true);
    setAiOv(true);

    const s = calculateScore(selLoc, night);
    try {
      const res = await fetch('http://localhost:8000/api/ai-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locality: selLoc.name,
          city: selLoc.city,
          state: selLoc.state,
          crime_index: selLoc.crime,
          lights: selLoc.lights,
          cctv: selLoc.cctv,
          police: selLoc.police,
          score: s,
          night: night
        })
      });
      const data = await res.json();
      setAiTips(data.tips);
      setAiSummary(data.summary);
    } catch (e) {
      console.error(e);
      // Local safety engine fallback
      setTimeout(() => {
        const grade = sGrade(s);
        const label = sLabel(s);
        setAiSummary(`${selLoc.name} has a safety score of ${s}/100 and is rated ${grade} (${label}).`);
        
        const localTips = [
          `💡 Streetlight coverage is at ${selLoc.lights}%. Stick to well-illuminated main thoroughfares.`,
          `📷 CCTV Density stands at ${selLoc.cctv}/km². Blind spots exist in small residential alleys.`,
          `🚔 Nearby Police Command is located within ${selLoc.police} km. Reach out to 112 instantly in danger.`,
          night ? "🌙 Night Alert: Keep tracking active and share coordinates with close family members." : "☀️ Day conditions are standard. Standard urban street alertness is advised."
        ];
        setAiTips(localTips);
      }, 1000);
    } finally {
      setAiLoading(false);
    }
  };

  // 5. INCIDENT FORM SUBMISSION
  const submitIncidentReport = async () => {
    if (!selInc) {
      triggerToast('Please select what happened from the categories.');
      return;
    }
    setSubmitting(true);

    const coords = repCoords || (mapRef.current ? mapRef.current.getCenter() : { lat: 19.0760, lng: 72.8777 });
    const payload = {
      report_type: selInc,
      description: rDesc || `${selInc.toUpperCase()} concern reported inside Indian locality.`,
      lat: coords.lat,
      lng: coords.lng
    };

    try {
      const res = await fetch('http://localhost:8000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        // Reset & Close
        setRNight(false);
        setRDesc('');
        setRArea('');
        setSelInc('');
        setRepOv(false);
        triggerToast('✅ Safety Report Recorded! Live maps and tickers synchronized.');
        fetchHeatmapData(); // Reload heatmap
      }
    } catch (err) {
      console.warn('API unavailable, recording report in local simulation...', err);
      // Fallback local update
      const matched = INC_T.find((x) => x.v === selInc);
      const emoji = matched ? matched.e : '📌';
      
      const newLocInc = {
        lat: coords.lat,
        lng: coords.lng,
        risk_score: 1.0,
        primary_factor: selInc,
        description: rDesc || `Safety concern reported at ${coords.lat.toFixed(4)}°N.`,
        time: 'Just now'
      };
      
      setDbZones((prev) => [newLocInc, ...prev]);
      setRepOv(false);
      triggerToast('✅ Safety Report Saved (Local visual simulation)!');
    } finally {
      setSubmitting(false);
    }
  };

  // 6. AUTOCOMPLETE SEARCH LOGIC
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchVal(q);
    if (!q || q.length < 2) {
      setSugs([]);
      setSugOpen(false);
      return;
    }

    const filtered = LOC.filter((l) =>
      l.name.toLowerCase().includes(q.toLowerCase()) ||
      l.city.toLowerCase().includes(q.toLowerCase()) ||
      l.state.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 8);

    setSugs(filtered);
    setSugOpen(filtered.length > 0);
  };

  const handlePickSug = (l) => {
    setSearchVal(`${l.name}, ${l.city}`);
    setSugOpen(false);
    selectLocality(l);
  };

  // Rank localities by score
  const sortedRankings = [...LOC].sort((a, b) => {
    return calculateScore(b, night) - calculateScore(a, night);
  });

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "790850127206-nvbcl2jv26cbdhv4luqhukqidnclhn3h.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className={`app ${night ? 'dark-theme' : ''}`} id="appRoot">
      
      {/* ── TOPBAR BRAND & HEADERS ── */}
      <div className="topbar">
        <a href="#" className="logo">
          <div className="logo-ico">🛡️</div>
          <span className="logo-text">SaferStreets</span>
          <span className="logo-sub">India</span>
        </a>
        
        {/* Search Container */}
        <div className="srch">
          <i className="ti ti-search si" aria-hidden="true"></i>
          <input
            id="sInp"
            placeholder="Search locality, city in India..."
            value={searchVal}
            onChange={handleSearchChange}
            onFocus={() => { if (sugs.length > 0) setSugOpen(true); }}
            onBlur={() => setTimeout(() => setSugOpen(false), 220)}
            autoComplete="off"
          />
          {sugOpen && (
            <div className="sug" id="sugBox">
              {sugs.map((l) => {
                const s = calculateScore(l, night);
                const c = sCol(s);
                return (
                  <div key={l.id} className="si2" onMouseDown={() => handlePickSug(l)}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c.ring, flexShrink: 0 }}></div>
                    <div>
                      <div className="sn">{l.name}</div>
                      <div className="sm">{l.city}, {l.state} · Score {Math.round(s)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Widgets */}
        <button
          className={`tbtn ${night ? 'night' : ''}`}
          id="nightBtn"
          onClick={() => {
            const nextN = !night;
            setNight(nextN);
            triggerToast(nextN ? '🌙 Night mode — safety scores adjusted (×0.72)' : '☀️ Day mode restored');
          }}
        >
          <i className={night ? "ti ti-sun" : "ti ti-moon"} aria-hidden="true"></i>
          <span>{night ? 'Day' : 'Night'}</span>
        </button>

        <button
          className={`tbtn ${routeMode ? 'route-active' : ''}`}
          onClick={() => {
            if (routeMode) {
              cancelRouteSelection();
            } else {
              setRouteMode(true);
              setRoutePts([]);
              triggerToast('Plan route: Click any 2 locations on the map to calculate safest detours!');
            }
          }}
        >
          <i className="ti ti-route" aria-hidden="true"></i>
          {routeMode ? 'Clear Route' : 'Safe Route'}
        </button>

        {/* Locate Me — Google Maps-style blue dot centering */}
        <button
          className={`tbtn ${followLocation ? 'route-active' : ''}`}
          id="locateBtn"
          onClick={handleLocateMe}
          title={userLocation ? 'Center on my location' : 'Waiting for GPS...'}
        >
          <i className="ti ti-current-location" aria-hidden="true" />
          <span>{followLocation ? 'Following' : 'Locate'}</span>
        </button>

        <button className="tbtn sos" onClick={() => setEmgOv(true)}>
          <i className="ti ti-phone-call" aria-hidden="true"></i>
          112
        </button>

        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: night ? '#E2E8F0' : '#475569' }}>
              👤 {userEmail.split('@')[0]}
            </span>
            <button
              className="tbtn"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userEmail');
                setIsLoggedIn(false);
                setUserEmail('');
                triggerToast('👋 Logged out successfully.');
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={{ marginLeft: '6px' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => triggerToast('❌ Google Sign-In failed.')}
              useOneTap
              shape="pill"
              theme={night ? 'dark' : 'light'}
              size="medium"
            />
          </div>
        )}
      </div>

      {/* ── CENTRAL APP CONSOLE ── */}
      <div className="main">
        
        {/* Left Side Console Column */}
        <div className="sb">
          <div className="sb-inner">
            
            {/* Map Layer Panel Toggles */}
            <div className="ss">
              <div className="st">Map layers</div>
              
              <div className="lr">
                <label className="ll">
                  <div className="ld" style={{ background: '#E53935' }} />
                  Crime heat map
                </label>
                <button
                  className={`tog ${lyrs.crime ? 'on' : ''}`}
                  onClick={() => setLyrs((p) => ({ ...p, crime: !p.crime }))}
                  aria-label="Toggle crime heatmap"
                />
              </div>

              <div className="lr">
                <label className="ll">
                  <div className="ld" style={{ background: '#FB923C' }} />
                  Live incidents
                </label>
                <button
                  className={`tog ${lyrs.incidents ? 'on' : ''}`}
                  onClick={() => setLyrs((p) => ({ ...p, incidents: !p.incidents }))}
                  aria-label="Toggle incidents"
                />
              </div>

              <div className="lr">
                <label className="ll">
                  <div className="ld" style={{ background: '#FCD34D' }} />
                  Street lights
                </label>
                <button
                  className={`tog ${lyrs.lights ? 'on' : ''}`}
                  onClick={() => setLyrs((p) => ({ ...p, lights: !p.lights }))}
                  aria-label="Toggle street lights"
                />
              </div>

              <div className="lr">
                <label className="ll">
                  <div className="ld" style={{ background: '#34D399' }} />
                  CCTV cameras
                </label>
                <button
                  className={`tog ${lyrs.cctv ? 'on' : ''}`}
                  onClick={() => setLyrs((p) => ({ ...p, cctv: !p.cctv }))}
                  aria-label="Toggle CCTV"
                />
              </div>

              <div className="lr">
                <label className="ll">
                  <div className="ld" style={{ background: '#60A5FA' }} />
                  Police stations
                </label>
                <button
                  className={`tog ${lyrs.police ? 'on' : ''}`}
                  onClick={() => setLyrs((p) => ({ ...p, police: !p.police }))}
                  aria-label="Toggle police stations"
                />
              </div>
            </div>

            {/* Dynamic Safety Score card details */}
            <div className="ss" id="scSec">
              <div className="st">Safety score</div>
              {selLoc ? (
                <div>
                  {(() => {
                    const s = calculateScore(selLoc, night);
                    const c = sCol(s);
                    const R = 22;
                    const circ = 2 * Math.PI * R;
                    const dash = (s / 100) * circ;
                    const crPts = Math.max(0, 40 - Math.min(40, selLoc.crime * 0.08));

                    return (
                      <>
                        <div className="sc-loc">{selLoc.name}, {selLoc.city}</div>
                        <div className="sc-main">
                          <div className="sc-ring">
                            <svg viewBox="0 0 54 54">
                              <circle cx="27" cy="27" r={R} fill="none" stroke={night ? "#334155" : "#F1F5F9"} strokeWidth="4.5" />
                              <circle
                                cx="27"
                                cy="27"
                                r={R}
                                fill="none"
                                stroke={c.ring}
                                strokeWidth="4.5"
                                strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`}
                                strokeLinecap="round"
                                transform="rotate(-90 27 27)"
                              />
                            </svg>
                            <div className="sc-inner">
                              <span className="sc-n" style={{ color: c.txt }}>{sGrade(s)}</span>
                              <span className="sc-g" style={{ color: c.txt }}>{Math.round(s)}</span>
                            </div>
                          </div>
                          <div>
                            <div className="sc-lbl">{sLabel(s)}</div>
                            <div className="sc-sub">{selLoc.state}</div>
                            {night && <div className="sc-night">🌙 Night adjusted</div>}
                          </div>
                        </div>

                        {/* Breakdown progress rows */}
                        <div className="brow">
                          <div className="blbl"><span>Crime index</span><span>{Math.round(crPts)}/40</span></div>
                          <div className="btrack"><div className="bfill" style={{ width: `${(crPts / 40) * 100}%`, background: c.ring }} /></div>
                        </div>

                        <div className="brow">
                          <div className="blbl"><span>Street lights</span><span>{selLoc.lights}/100</span></div>
                          <div className="btrack"><div className="bfill" style={{ width: `${selLoc.lights}%`, background: '#FCD34D' }} /></div>
                        </div>

                        <div className="brow">
                          <div className="blbl"><span>CCTV Density</span><span>{Math.round(Math.min(10, selLoc.cctv * 2.5))}/10</span></div>
                          <div className="btrack"><div className="bfill" style={{ width: `${(Math.min(10, selLoc.cctv * 2.5) / 10) * 100}%`, background: '#34D399' }} /></div>
                        </div>

                        <button className="ai-btn" onClick={triggerAIAssistant}>
                          <i className="ti ti-sparkles" aria-hidden="true" />
                          Get AI safety tips
                        </button>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="score-empty">
                  Click any locality tag<br />on the map to see safety index
                </div>
              )}
            </div>

            {/* Locality Rankings List */}
            <div>
              <div style={{ padding: '12px 14px 6px', fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '.9px' }}>
                Locality rankings
              </div>
              <div id="locList">
                {sortedRankings.map((l) => {
                  const s = calculateScore(l, night);
                  const c = sCol(s);
                  const isSelected = selLoc && selLoc.id === l.id;
                  return (
                    <div key={l.id} className={`li ${isSelected ? 'sel' : ''}`} onClick={() => selectLocality(l)}>
                      <div className="li-top">
                        <span className="li-name">{l.name}</span>
                        <span className="li-pill" style={{ background: c.bg, color: c.txt }}>
                          {sGrade(s)} {Math.round(s)}
                        </span>
                      </div>
                      <div className="li-city">{l.city} · {l.state}</div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* ── Central Leaflet Map Container ── */}
        <div className="mw">
          <div id="map" ref={mapContainerRef} />
          
          <button className="fab" onClick={() => {
            setRepCoords(mapRef.current ? mapRef.current.getCenter() : null);
            setRepOv(true);
          }}>
            <i className="ti ti-plus" aria-hidden="true"></i>
            Report incident
          </button>
          
          <div className="mhint">Click maps for Safety Score · Right-click to report custom incident</div>
          
          {/* Centralized Premium Toast Notifications */}
          <div className={`toast ${toastOn ? 'on' : ''}`} id="toast">
            {toastMsg}
          </div>
        </div>

      </div>

      {/* ── Bottom Live Incident ticker ── */}
      <div className="feed">
        <div className="flbl">
          <i className="ti ti-radio" aria-hidden="true" style={{ color: '#E53935' }} />
          Live
        </div>
        <div className="fscroll" id="feedEl">
          {dbZones.map((inc, i) => {
            const col = INC_COLORS[inc.primary_factor] || '#555';
            const matched = INC_T.find((x) => x.v === inc.primary_factor);
            const emoji = matched ? matched.e : '📌';
            
            return (
              <div key={i} className="fchip" onClick={() => {
                if (mapRef.current) {
                  mapRef.current.flyTo([inc.lat, inc.lng], 15);
                }
              }}>
                <div className="fdot" style={{ backgroundColor: col }} />
                <span>{emoji} {inc.description.length > 34 ? `${inc.description.slice(0, 34)}...` : inc.description}</span>
                <span className="ftime">{inc.time || 'Recent'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── OVERLAYS / MODALS ── */}

      {/* REPORT MODAL */}
      <div className={`ov ${repOv ? 'on' : ''}`} id="repOv" role="dialog" aria-modal="true">
        <div className="sheet">
          <div className="sh-handle"></div>
          <div className="sh-hdr">
            <div className="sh-ttl">
              <i className="ti ti-alert-triangle" aria-hidden="true" style={{ color: '#E53935', fontSize: '18px' }} />
              Report incident
            </div>
            <button className="sh-cls" onClick={() => setRepOv(false)} aria-label="Close">✕</button>
          </div>
          
          {repCoords && (
            <div style={{ background: '#EFF6FF', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', color: '#1E40AF', marginBottom: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ti ti-map-pin" aria-hidden="true"></i>
              <span>Coordinates: {repCoords.lat.toFixed(4)}°N, {repCoords.lng.toFixed(4)}°E</span>
            </div>
          )}

          <div className="fg">
            <label className="fl">What happened? <span style={{ color: '#E53935' }}>*</span></label>
            <div className="ig" id="incGrid">
              {INC_T.map((t) => {
                const isSel = selInc === t.v;
                return (
                  <div key={t.v} className={`io ${isSel ? 'sel' : ''}`} onClick={() => setSelInc(t.v)}>
                    <span className="ie">{t.e}</span>
                    {t.l}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="fg">
            <label className="fl">Description <span style={{ color: '#94A3B8' }}>(optional)</span></label>
            <textarea
              className="fta"
              id="rDesc"
              rows="2"
              placeholder="Describe what occurred clearly..."
              value={rDesc}
              onChange={(e) => setRDesc(e.target.value)}
            />
          </div>

          <div className="fg">
            <label className="fl">Your locality / area</label>
            <input
              className="fi"
              id="rArea"
              placeholder="e.g. Andheri East, Mumbai"
              value={rArea}
              onChange={(e) => setRArea(e.target.value)}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', marginBottom: '14px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              id="rNight"
              style={{ width: '15px', height: '15px' }}
              checked={rNight}
              onChange={(e) => setRNight(e.target.checked)}
            />
            🌙 Happened at night (after 8 PM)
          </label>

          <button className="sub-btn" id="rBtn" onClick={submitIncidentReport} disabled={submitting}>
            {submitting ? 'Recording Report...' : 'Submit report'}
          </button>
        </div>
      </div>

      {/* AI SAFETY RECOMMENDATIONS MODAL */}
      <div className={`ov mid ${aiOv ? 'on' : ''}`} id="aiOv" role="dialog" aria-modal="true">
        <div className="sheet">
          <div className="sh-hdr">
            <div className="sh-ttl">
              <i className="ti ti-sparkles" aria-hidden="true" style={{ color: '#3B82F6', fontSize: '18px' }} />
              AI Safety Analysis
            </div>
            <button className="sh-cls" onClick={() => setAiOv(false)} aria-label="Close">✕</button>
          </div>
          
          <div id="aiContent">
            {aiLoading ? (
              <div style={{ textAlign: 'center', padding: '28px' }}>
                <div className="ai-spin" />
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>Analyzing real-time metrics...</div>
              </div>
            ) : (
              <>
                {selLoc && (
                  <div style={{
                    background: sCol(calculateScore(selLoc, night)).bg,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: sCol(calculateScore(selLoc, night)).txt
                  }}>
                    🛡️ {aiSummary || 'Locality Safety Report Calculated'}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.6px' }}>
                  Safety suggestions for {selLoc?.name}
                </div>
                {aiTips.map((tip, i) => (
                  <div key={i} className="ai-tip">
                    {tip}
                  </div>
                ))}
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '14px', textAlign: 'center', fontWeight: '500' }}>
                  Powered by Claude AI · Integrated with NCRB Community safety frameworks
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* EMERGENCY HELP CONTACTS MODAL */}
      <div className={`ov mid ${emgOv ? 'on' : ''}`} id="emgOv" role="dialog" aria-modal="true">
        <div className="sheet">
          <div className="sh-hdr">
            <div className="sh-ttl">
              <i className="ti ti-phone-call" aria-hidden="true" style={{ color: '#B91C1C', fontSize: '18px' }} />
              Emergency contacts
            </div>
            <button className="sh-cls" onClick={() => setEmgOv(false)} aria-label="Close">✕</button>
          </div>
          
          <div className="eg">
            <button className="ec red" onClick={() => triggerToast('📞 Initiating Speed-Dial 112: All Emergencies...')}>
              <span className="ec-num">112</span>
              <div className="ec-lbl">All emergencies</div>
            </button>
            <button className="ec red" onClick={() => triggerToast('📞 Initiating Speed-Dial 100: Police Assistance...')}>
              <span className="ec-num">100</span>
              <div className="ec-lbl">Police</div>
            </button>
            <button className="ec blue" onClick={() => triggerToast('📞 Speed-Dialing 1091: National Women Helpline...')}>
              <span className="ec-num">1091</span>
              <div className="ec-lbl">Women helpline</div>
            </button>
            <button className="ec blue" onClick={() => triggerToast('📞 Speed-Dialing 102: Emergency Ambulance Services...')}>
              <span className="ec-num">102</span>
              <div className="ec-lbl">Ambulance</div>
            </button>
            <button className="ec blue" onClick={() => triggerToast('📞 Speed-Dialing 101: Fire Brigade Dispatch...')}>
              <span className="ec-num">101</span>
              <div className="ec-lbl">Fire brigade</div>
            </button>
            <button className="ec red" onClick={() => triggerToast('📞 Speed-Dialing 1930: National Cybercrime Department...')}>
              <span className="ec-num">1930</span>
              <div className="ec-lbl">Cyber crime</div>
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', fontWeight: '500' }}>
            All safety helplines are toll-free and accessible from any carrier inside India.
          </div>
        </div>
      </div>

      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
