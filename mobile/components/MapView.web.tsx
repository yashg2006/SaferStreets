import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouteStore } from '../lib/stores/routeStore';
import { getSafetyColor } from '../lib/services/safetyService';
import { NCRB_CITIES } from '../lib/data/ncrbData';

interface MapViewProps {
  onRegionChange?: (bbox: { minLng: number; maxLng: number; minLat: number; maxLat: number }) => void;
}

const generateMapHTML = (
  origin: any,
  destination: any,
  fastestRoute: any,
  safestRoute: any,
  activeRoute: string | null
) => {
  const citiesJSON = JSON.stringify(
    NCRB_CITIES.map((c) => ({
      name: c.name,
      lat: c.lat,
      lng: c.lng,
      safetyScore: c.safetyScore,
      crimeRate: c.crimeRate,
      color: getSafetyColor(c.safetyScore),
    }))
  );

  const originJSON = origin ? JSON.stringify({ lat: origin.latitude, lng: origin.longitude, address: origin.address }) : 'null';
  const destJSON = destination ? JSON.stringify({ lat: destination.latitude, lng: destination.longitude, address: destination.address }) : 'null';

  const safestCoordsJSON = safestRoute?.latLngCoordinates
    ? JSON.stringify(safestRoute.latLngCoordinates.map((coord: any) => [coord.latitude, coord.longitude]))
    : '[]';

  const fastestCoordsJSON = fastestRoute?.latLngCoordinates
    ? JSON.stringify(fastestRoute.latLngCoordinates.map((coord: any) => [coord.latitude, coord.longitude]))
    : '[]';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body, html, #map {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background-color: #0b0b0d;
        }
        .leaflet-popup-content-wrapper {
          background-color: rgba(18, 18, 22, 0.96);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 6px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .leaflet-popup-tip {
          background-color: rgba(18, 18, 22, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .leaflet-popup-content h3 {
          margin: 0 0 6px 0;
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 4px;
        }
        .leaflet-popup-content p {
          margin: 4px 0;
          font-size: 11px;
          color: #9ca3af;
        }
        .leaflet-popup-content span {
          font-size: 11px;
        }
        .leaflet-container {
          background: #0b0b0d !important;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        var map = L.map('map', {
          zoomControl: false
        }).setView([22.5937, 78.9629], 5);
        
        // Premium Dark Tile layer from CARTO
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        var cities = ${citiesJSON};
        var originData = ${originJSON};
        var destData = ${destJSON};
        var safestCoords = ${safestCoordsJSON};
        var fastestCoords = ${fastestCoordsJSON};
        var activeRoute = "${activeRoute || ''}";

        // Add cities safety zone circles
        cities.forEach(function(city) {
          var circle = L.circle([city.lat, city.lng], {
            color: city.color,
            fillColor: city.color,
            fillOpacity: 0.12,
            weight: 1.5,
            radius: 14000 // 14km radius circles representing city bounds
          }).addTo(map);

          circle.bindPopup(
            "<h3>📍 " + city.name + " Safety Profile</h3>" +
            "<p><b>NCRB Safety Score:</b> <span style='color: " + city.color + "; font-weight: bold;'>" + city.safetyScore + "/100</span></p>" +
            "<p><b>Crime Exposure Rate:</b> " + city.crimeRate + " per lakh population</p>"
          );
        });

        var group = new L.featureGroup();

        // Custom start location icon (A)
        if (originData) {
          var markerAIcon = L.divIcon({
            html: '<div style="background-color: #3b82f6; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8); display: flex; justify-content: center; align-items: center; color: #ffffff; font-weight: bold; font-family: sans-serif; font-size: 12px;">A</div>',
            className: '',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          var originMarker = L.marker([originData.lat, originData.lng], { icon: markerAIcon })
            .addTo(map)
            .bindPopup("<h3>Start Point</h3><p>" + originData.address + "</p>");
          group.addLayer(originMarker);
        }

        // Custom destination location icon (B)
        if (destData) {
          var markerBIcon = L.divIcon({
            html: '<div style="background-color: #ef4444; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(239, 68, 68, 0.8); display: flex; justify-content: center; align-items: center; color: #ffffff; font-weight: bold; font-family: sans-serif; font-size: 12px;">B</div>',
            className: '',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          var destMarker = L.marker([destData.lat, destData.lng], { icon: markerBIcon })
            .addTo(map)
            .bindPopup("<h3>Destination Point</h3><p>" + destData.address + "</p>");
          group.addLayer(destMarker);
        }

        // Add Safest Route Polyline (Green)
        if (safestCoords.length > 0) {
          var safestPolyline = L.polyline(safestCoords, {
            color: '#10b981',
            weight: activeRoute === 'safest' ? 6 : 4,
            opacity: activeRoute === 'safest' ? 0.95 : 0.35,
            dashArray: activeRoute === 'safest' ? null : '5, 8'
          }).addTo(map);
          safestPolyline.bindPopup("<h3>🛡️ Safest Route Profile</h3><p>Optimized for security by avoiding high-crime sectors</p>");
          group.addLayer(safestPolyline);
        }

        // Add Fastest Route Polyline (Blue)
        if (fastestCoords.length > 0) {
          var fastestPolyline = L.polyline(fastestCoords, {
            color: '#3b82f6',
            weight: activeRoute === 'fastest' ? 6 : 4,
            opacity: activeRoute === 'fastest' ? 0.95 : 0.35,
            dashArray: activeRoute === 'fastest' ? null : '5, 8'
          }).addTo(map);
          fastestPolyline.bindPopup("<h3>⚡ Fastest Route Profile</h3><p>Fastest walking path based on direct OSRM segments</p>");
          group.addLayer(fastestPolyline);
        }

        // Zoom fit to layers
        if (group.getLayers().length > 0) {
          map.fitBounds(group.getBounds(), { padding: [50, 50] });
        } else if (originData) {
          map.setView([originData.lat, originData.lng], 13);
        }
      </script>
    </body>
    </html>
  `;
};

export const MapViewComponent: React.FC<MapViewProps> = () => {
  const { origin, destination, fastestRoute, safestRoute, activeRoute } = useRouteStore();

  const srcDoc = generateMapHTML(origin, destination, fastestRoute, safestRoute, activeRoute);

  return (
    <View style={styles.container}>
      <iframe
        srcDoc={srcDoc}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: '#0b0b0d',
        }}
        title="Interactive Safety Map"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
