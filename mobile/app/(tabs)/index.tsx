import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  ScrollView
} from 'react-native';
import { MapViewComponent } from '../../components/MapView';
import { ControlPanel } from '../../components/ControlPanel';
import { RouteCard } from '../../components/RouteCard';
import { useRouteStore } from '../../lib/stores/routeStore';

interface HeatmapBbox {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

export default function MapScreen() {
  const [showControlPanel, setShowControlPanel] = useState(false);

  const {
    origin,
    destination,
    timeBucket,
    fastestRoute,
    safestRoute,
    activeRoute,
    setActiveRoute,
    error
  } = useRouteStore();

  const handleRegionChange = async (bbox: HeatmapBbox) => {
    // Heatmap data is now handled dynamically directly inside our premium MapView component
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Map Layer */}
        <MapViewComponent onRegionChange={handleRegionChange} />

        {/* Top Control Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowControlPanel(true)}
          >
            <Text style={styles.searchButtonText}>
              {origin ? `From: ${origin.address || 'Location'}` : '🔍 Find Secure Route in India...'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoBar}>
            <Text style={styles.infoText}>
              🕒 Schedule Hour: {timeBucket}:00 • India Region Radar Active
            </Text>
            {error && (
              <Text style={[styles.infoText, { color: '#ef4444', marginTop: 4 }]}>
                ⚠️ Error: {error}
              </Text>
            )}
          </View>
        </View>

        {/* Bottom Routes Panel */}
        {origin && destination && (
          <View style={styles.bottomPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Optimized Route Profiles</Text>
              <Text style={styles.panelSubtitle}>
                {fastestRoute && safestRoute ? 'Compare options below' : 'Calculating security indices...'}
              </Text>
            </View>

            <ScrollView
              style={styles.routesScroll}
              showsVerticalScrollIndicator={false}
            >
              {safestRoute && (
                <RouteCard
                  route={safestRoute}
                  type="safest"
                  isActive={activeRoute === 'safest'}
                  onSelect={(type) => setActiveRoute(type)}
                />
              )}
              {fastestRoute && (
                <RouteCard
                  route={fastestRoute}
                  type="fastest"
                  isActive={activeRoute === 'fastest'}
                  onSelect={(type) => setActiveRoute(type)}
                />
              )}
            </ScrollView>
          </View>
        )}

        {/* Control Panel Modal */}
        <ControlPanel
          visible={showControlPanel}
          onClose={() => setShowControlPanel(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
  topBar: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10
  },
  searchButton: {
    backgroundColor: 'rgba(22, 22, 26, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  infoBar: {
    backgroundColor: 'rgba(10, 10, 12, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600'
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0a0a0c',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 5,
    maxHeight: '45%'
  },
  panelHeader: {
    marginBottom: 14
  },
  panelTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  panelSubtitle: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2
  },
  routesScroll: {
    maxHeight: '100%'
  }
});
