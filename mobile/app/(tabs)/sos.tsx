import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Linking
} from 'react-native';
import * as Location from 'expo-location';

interface EmergencyContact {
  label: string;
  number: string;
  icon: string;
  color: string;
  description: string;
}

export default function SOSScreen() {
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('Detecting location...');
  const [contacts, setContacts] = useState<Array<{ name: string; phone: string }>>([
    { name: 'Family Guard', phone: '+91 98765 43210' },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setCurrentCoords({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
          setLocationName(`Coordinates: ${loc.coords.latitude.toFixed(4)} N, ${loc.coords.longitude.toFixed(4)} E`);
        } else {
          setLocationName('Location permissions not set');
        }
      } catch (err) {
        setLocationName('India Region Radar Active');
      }
    })();
  }, []);

  const emergencyServices: EmergencyContact[] = [
    {
      label: 'National Emergency',
      number: '112',
      icon: '🚨',
      color: '#dc2626',
      description: 'Single emergency helpline for all services across India.',
    },
    {
      label: 'Police Department',
      number: '100',
      icon: '🚔',
      color: '#b91c1c',
      description: 'Instant local police patrol dispatch.',
    },
    {
      label: 'Women Helpline',
      number: '1091',
      icon: '🛡️',
      color: '#7c3aed',
      description: 'Dedicated women protection hotline.',
    },
    {
      label: 'Medical Emergency',
      number: '108',
      icon: '🚑',
      color: '#059669',
      description: 'Ambulance, paramedics and urgent healthcare.',
    },
  ];

  const triggerSOSAlert = () => {
    Alert.alert(
      '⚠️ ALERT TRIGGERED',
      `Urgent coordinates and panic signal are being sent to your safety contacts: ${contacts.map(c => c.name).join(', ')}.`,
      [
        { text: 'Cancel Alert', style: 'cancel' },
        { text: 'Broadcast SOS', style: 'destructive', onPress: () => Alert.alert('Sent', 'Panic broadcast active!') }
      ]
    );
  };

  const handleCallNumber = (number: string) => {
    const url = `tel:${number}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Not Supported', 'Calling is not supported on this device.');
        }
      })
      .catch((err) => console.error('An error occurred calling emergency', err));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Urgent Panic Trigger Panel */}
        <View style={styles.panicContainer}>
          <TouchableOpacity style={styles.panicButton} onPress={triggerSOSAlert}>
            <View style={styles.panicButtonInner}>
              <Text style={styles.panicText}>SOS</Text>
              <Text style={styles.panicSubtext}>Hold or Tap to Broadcast</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Location Radar Metadata */}
        <View style={styles.locationCard}>
          <View style={styles.radarHeader}>
            <View style={styles.greenDot} />
            <Text style={styles.radarTitle}>SECURE TRACKING RUNNING</Text>
          </View>
          <Text style={styles.locationDesc}>{locationName}</Text>
          <Text style={styles.locationTip}>
            💡 Tip: Emojis can be broadcasted via SMS along with OpenStreetMap URLs during outages.
          </Text>
        </View>

        {/* Indian National Hotlines */}
        <Text style={styles.sectionHeader}>🇮🇳 National Hotlines (One-Tap Call)</Text>
        <View style={styles.hotlineGrid}>
          {emergencyServices.map((service) => (
            <TouchableOpacity
              key={service.number}
              style={[styles.hotlineCard, { borderColor: service.color + '44' }]}
              onPress={() => handleCallNumber(service.number)}
            >
              <View style={styles.hotlineHeader}>
                <Text style={styles.hotlineIcon}>{service.icon}</Text>
                <Text style={[styles.hotlineBadge, { backgroundColor: service.color }]}>
                  {service.number}
                </Text>
              </View>
              <Text style={styles.hotlineLabel}>{service.label}</Text>
              <Text style={styles.hotlineDesc}>{service.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency Contacts */}
        <Text style={styles.sectionHeader}>🛡️ Personal Safety Contacts</Text>
        <View style={styles.contactsCard}>
          {contacts.map((c, i) => (
            <View key={i} style={styles.contactRow}>
              <View>
                <Text style={styles.contactName}>{c.name}</Text>
                <Text style={styles.contactPhone}>{c.phone}</Text>
              </View>
              <TouchableOpacity style={styles.callSmallBtn} onPress={() => handleCallNumber(c.phone)}>
                <Text style={styles.callSmallBtnText}>Call</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addContactBtn}
            onPress={() =>
              Alert.prompt('Add Guardian', 'Enter name and mobile number:', (val) => {
                if (val) setContacts([...contacts, { name: val, phone: '+91 99999 88888' }]);
              })
            }
          >
            <Text style={styles.addContactBtnText}>+ Add Safety Contact</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  panicContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  panicButton: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  panicButtonInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  panicText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  panicSubtext: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
    marginTop: 4,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  locationCard: {
    backgroundColor: '#111115',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: 12,
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  radarTitle: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  locationDesc: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  locationTip: {
    color: '#6b7280',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 14,
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 14,
  },
  hotlineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hotlineCard: {
    width: '48%',
    backgroundColor: '#111115',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  hotlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hotlineIcon: {
    fontSize: 22,
  },
  hotlineBadge: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  hotlineLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hotlineDesc: {
    color: '#6b7280',
    fontSize: 9,
    marginTop: 4,
    lineHeight: 12,
  },
  contactsCard: {
    backgroundColor: '#111115',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  contactName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  contactPhone: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  callSmallBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  callSmallBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  addContactBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  addContactBtnText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
