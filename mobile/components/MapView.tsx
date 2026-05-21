import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { useRouteStore } from '../lib/stores/routeStore';
import { getSafetyColor } from '../lib/services/safetyService';
import { NCRB_CITIES } from '../lib/data/ncrbData';

interface MapViewProps {
  onRegionChange?: (bbox: { minLng: number; maxLng: number; minLat: number; maxLat: number }) => void;
}

export const MapViewComponent: React.FC<MapViewProps> = ({ onRegionChange }) => {
  const mapRef = useRef<MapView>(null);
  const { origin, destination, fastestRoute, safestRoute, activeRoute } = useRouteStore();

  const [initialRegion] = useState({
    latitude: 28.6139, // Delhi defaults
    longitude: 77.209,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Fit to coordinates when routes change
  useEffect(() => {
    if (!mapRef.current) return;

    const route = activeRoute === 'fastest' ? fastestRoute : safestRoute;
    if (route?.latLngCoordinates && route.latLngCoordinates.length > 0) {
      mapRef.current.fitToCoordinates(route.latLngCoordinates, {
        edgePadding: { top: 80, right: 50, bottom: 80, left: 50 },
        animated: true,
      });
    } else if (origin) {
      mapRef.current.animateToRegion({
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }, 1000);
    }
  }, [fastestRoute, safestRoute, activeRoute, origin]);

  const handleRegionChangeComplete = (region: any) => {
    if (!onRegionChange) return;
    const minLng = region.longitude - region.longitudeDelta / 2;
    const maxLng = region.longitude + region.longitudeDelta / 2;
    const minLat = region.latitude - region.latitudeDelta / 2;
    const maxLat = region.latitude + region.latitudeDelta / 2;
    onRegionChange({ minLng, maxLng, minLat, maxLat });
  };

  // Sleek Premium Dark Theme for Map (Google Maps format)
  const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#747474' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#f3f4f6' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#858585' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#122614' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2d2d2d' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e5d6c' }] }
  ];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={darkMapStyle}
        showsUserLocation
        showsMyLocationButton
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {/* NCRB City Markers/Circles as Heatmaps */}
        {NCRB_CITIES.map((city) => (
          <React.Fragment key={city.name}>
            <Circle
              center={{ latitude: city.lat, longitude: city.lng }}
              radius={8000} // 8km radius for city overview
              fillColor={getSafetyColor(city.safetyScore) + '33'} // 20% opacity hex
              strokeColor={getSafetyColor(city.safetyScore) + '88'}
              strokeWidth={1}
            />
            <Marker
              coordinate={{ latitude: city.lat, longitude: city.lng }}
              title={`${city.name} Safety: ${city.safetyScore}/100`}
              description={`Crime rate: ${city.crimeRate} per lakh population`}
            >
              <View style={[styles.customCityMarker, { backgroundColor: getSafetyColor(city.safetyScore) }]}>
                <Text style={styles.markerMiniText}>{city.safetyScore}</Text>
              </View>
            </Marker>
          </React.Fragment>
        ))}

        {/* Start Point Pin */}
        {origin && (
          <Marker
            coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
            title="Start Point"
            description={origin.address}
            pinColor="#3b82f6"
          />
        )}

        {/* End Point Pin */}
        {destination && (
          <Marker
            coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
            title="Destination"
            description={destination.address}
            pinColor="#ef4444"
          />
        )}

        {/* Fastest Route Line */}
        {fastestRoute && activeRoute === 'fastest' && (
          <Polyline
            coordinates={fastestRoute.latLngCoordinates}
            strokeColor="#3b82f6"
            strokeWidth={5}
          />
        )}

        {/* Safest Route Line */}
        {safestRoute && activeRoute === 'safest' && (
          <Polyline
            coordinates={safestRoute.latLngCoordinates}
            strokeColor="#10b981"
            strokeWidth={6}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customCityMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 4,
  },
  markerMiniText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
