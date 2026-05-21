import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRouteStore } from '../lib/stores/routeStore';
import { searchAddress, POPULAR_PLACES } from '../lib/services/geocodingService';
import { calculateRoutes } from '../lib/services/routingService';

interface ControlPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ visible, onClose }) => {
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  
  const [loadingOrigin, setLoadingOrigin] = useState(false);
  const [loadingDest, setLoadingDest] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const {
    origin,
    destination,
    timeBucket,
    lambdaSafety,
    setOrigin,
    setDestination,
    setTimeBucket,
    setLambdaSafety,
    setFastestRoute,
    setSafestRoute,
    setActiveRoute,
    setError
  } = useRouteStore();

  // Debounced search for Origin suggestions
  useEffect(() => {
    if (originQuery.length < 3) {
      setOriginSuggestions([]);
      return;
    }
    const delay = setTimeout(async () => {
      setLoadingOrigin(true);
      try {
        const results = await searchAddress(originQuery);
        setOriginSuggestions(results);
      } catch (err) {
        console.warn('Origin geocoding failed', err);
      } finally {
        setLoadingOrigin(false);
      }
    }, 600);
    return () => clearTimeout(delay);
  }, [originQuery]);

  // Debounced search for Destination suggestions
  useEffect(() => {
    if (destQuery.length < 3) {
      setDestSuggestions([]);
      return;
    }
    const delay = setTimeout(async () => {
      setLoadingDest(true);
      try {
        const results = await searchAddress(destQuery);
        setDestSuggestions(results);
      } catch (err) {
        console.warn('Dest geocoding failed', err);
      } finally {
        setLoadingDest(false);
      }
    }, 600);
    return () => clearTimeout(delay);
  }, [destQuery]);

  const selectOrigin = (item: any) => {
    setOrigin({
      latitude: item.lat,
      longitude: item.lng,
      address: item.shortName || item.displayName
    });
    setOriginQuery('');
    setOriginSuggestions([]);
  };

  const selectDest = (item: any) => {
    setDestination({
      latitude: item.lat,
      longitude: item.lng,
      address: item.shortName || item.displayName
    });
    setDestQuery('');
    setDestSuggestions([]);
  };

  const handleCalculateRoute = async () => {
    if (!origin || !destination) {
      setError('Please set both origin and destination');
      return;
    }

    setIsCalculating(true);
    setError(null);
    try {
      const result = await calculateRoutes(
        { latitude: origin.latitude, longitude: origin.longitude, address: origin.address },
        { latitude: destination.latitude, longitude: destination.longitude, address: destination.address },
        timeBucket
      );

      setFastestRoute(result.fastest);
      setSafestRoute(result.safest);
      setActiveRoute('safest');
      onClose(); // Close sheet after calculation
    } catch (err: any) {
      setError(err.message || 'Failed to calculate safe routes. Check OSRM connections.');
    } finally {
      setIsCalculating(false);
    }
  };

  const setPopularAsOrigin = (place: any) => {
    setOrigin({
      latitude: place.lat,
      longitude: place.lng,
      address: place.name
    });
  };

  const setPopularAsDest = (place: any) => {
    setDestination({
      latitude: place.lat,
      longitude: place.lng,
      address: place.name
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>🧭 Safety Route Planner</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Origin Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Start Location (Origin)</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Type street, landmark or city in India..."
                  placeholderTextColor="#666666"
                  value={originQuery}
                  onChangeText={setOriginQuery}
                />
                {loadingOrigin && <ActivityIndicator size="small" color="#10b981" style={styles.loader} />}
              </View>
              
              {/* Origin Search Results */}
              {originSuggestions.length > 0 && (
                <View style={styles.suggestionBox}>
                  {originSuggestions.map((item, idx) => (
                    <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => selectOrigin(item)}>
                      <Text style={styles.suggestionText}>📍 {item.displayName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {origin && (
                <Text style={styles.selectedText}>✓ Selected: {origin.address}</Text>
              )}
            </View>

            {/* Destination Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Where to? (Destination)</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Search destination in India..."
                  placeholderTextColor="#666666"
                  value={destQuery}
                  onChangeText={setDestQuery}
                />
                {loadingDest && <ActivityIndicator size="small" color="#10b981" style={styles.loader} />}
              </View>

              {/* Destination Search Results */}
              {destSuggestions.length > 0 && (
                <View style={styles.suggestionBox}>
                  {destSuggestions.map((item, idx) => (
                    <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => selectDest(item)}>
                      <Text style={styles.suggestionText}>📍 {item.displayName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {destination && (
                <Text style={styles.selectedText}>✓ Selected: {destination.address}</Text>
              )}
            </View>

            {/* Popular Landmarks in India */}
            {(!origin || !destination) && (
              <View style={styles.section}>
                <Text style={styles.label}>Popular Safe Points (Quick Set)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.popularScroll}>
                  {POPULAR_PLACES.map((place) => (
                    <TouchableOpacity
                      key={place.name}
                      style={styles.popularChip}
                      onPress={() => {
                        if (!origin) setPopularAsOrigin(place);
                        else setPopularAsDest(place);
                      }}
                    >
                      <Text style={styles.popularText}>{place.name.split(',')[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Time of Day Bucket Selection */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Schedule Hour (Safety adjusts via time model)</Text>
                <Text style={styles.valueText}>{timeBucket}:00</Text>
              </View>
              <View style={styles.buttonGrid}>
                <TouchableOpacity
                  style={[styles.optionButton, (timeBucket >= 6 && timeBucket < 12) && styles.activeButton]}
                  onPress={() => setTimeBucket(8)}
                >
                  <Text style={styles.optionText}>🌅 Morning</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, (timeBucket >= 12 && timeBucket < 18) && styles.activeButton]}
                  onPress={() => setTimeBucket(14)}
                >
                  <Text style={styles.optionText}>☀️ Afternoon</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, (timeBucket >= 18 || timeBucket < 6) && styles.activeButton]}
                  onPress={() => setTimeBucket(22)}
                >
                  <Text style={styles.optionText}>🌌 Late Night</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Safety Penalty weight */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Security Profile Mode</Text>
                <Text style={styles.valueText}>
                  {lambdaSafety <= 2 ? 'Balanced' : lambdaSafety <= 3.5 ? 'Guard' : 'Maximum Security'}
                </Text>
              </View>
              <View style={styles.buttonGrid}>
                <TouchableOpacity
                  style={[styles.optionButton, lambdaSafety <= 2 && styles.activeButton]}
                  onPress={() => setLambdaSafety(1.5)}
                >
                  <Text style={styles.optionText}>🚶 Balanced</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, (lambdaSafety > 2 && lambdaSafety <= 3.5) && styles.activeButton]}
                  onPress={() => setLambdaSafety(3.0)}
                >
                  <Text style={styles.optionText}>🛡️ High Guard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, lambdaSafety > 3.5 && styles.activeButton]}
                  onPress={() => setLambdaSafety(5.0)}
                >
                  <Text style={styles.optionText}>🚔 Max Escort</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity
              style={[styles.calculateButton, (isCalculating || !origin || !destination) && styles.buttonDisabled]}
              onPress={handleCalculateRoute}
              disabled={isCalculating || !origin || !destination}
            >
              {isCalculating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.calculateButtonText}>Calculate Secure Routes</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.helperText}>
              * Routes computed using open-source OSRM routing nodes coupled with verified NCRB 2022 safety models.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  container: {
    backgroundColor: '#16161a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  headerText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  closeButton: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: 'bold'
  },
  content: {
    padding: 24
  },
  section: {
    marginBottom: 24
  },
  label: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  valueText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: 'bold'
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    backgroundColor: '#202024',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14
  },
  loader: {
    position: 'absolute',
    right: 14,
  },
  selectedText: {
    color: '#10b981',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600'
  },
  suggestionBox: {
    backgroundColor: '#1f1f23',
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    maxHeight: 180,
    overflow: 'hidden'
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)'
  },
  suggestionText: {
    color: '#e5e7eb',
    fontSize: 12
  },
  popularScroll: {
    flexDirection: 'row',
    marginTop: 4
  },
  popularChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8
  },
  popularText: {
    color: '#d1d5db',
    fontSize: 11,
    fontWeight: '600'
  },
  buttonGrid: {
    flexDirection: 'row',
    gap: 10
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#202024',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center'
  },
  activeButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981'
  },
  optionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  helperText: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 16
  },
  calculateButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  buttonDisabled: {
    opacity: 0.4
  },
  calculateButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold'
  }
});
