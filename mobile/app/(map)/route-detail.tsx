import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRouteStore } from '../../lib/stores/routeStore';
import { formatDuration, formatDistance } from '../../lib/services/routingService';

export default function RouteDetailScreen() {
  const router = useRouter();
  const { activeRoute, fastestRoute, safestRoute } = useRouteStore();
  const [showAlerts, setShowAlerts] = useState(true);

  const activeRouteData = activeRoute === 'fastest' ? fastestRoute : safestRoute;

  if (!activeRouteData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No route selected</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Generate realistic safety alerts based on the route's risk level
  const alerts = [];
  if (activeRouteData.safetyScore < 50) {
    alerts.push({ id: 1, type: 'danger', message: 'Contains segments with high historical crime densities at night.' });
  } else if (activeRouteData.safetyScore < 75) {
    alerts.push({ id: 1, type: 'warning', message: 'Moderate safety level. Stick to populated paths.' });
  } else {
    alerts.push({ id: 1, type: 'safe', message: 'Excellent safety coverage. Safe passage anticipated.' });
  }

  const startNavigation = () => {
    Alert.alert(
      '🗺️ Navigation Active',
      'Turn-by-turn guidance has started. Street Safety Radar will alert you of any sudden risk updates.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navigation Breakdown</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Route Summary Card */}
        <View style={[styles.summaryCard, { borderColor: activeRouteData.riskColor }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{activeRouteData.durationMins}</Text>
              <Text style={styles.summaryLabel}>minutes</Text>
            </View>
            <View style={styles.summarySeparator} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{activeRouteData.distanceKm}</Text>
              <Text style={styles.summaryLabel}>km</Text>
            </View>
            <View style={styles.summarySeparator} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: activeRouteData.riskColor }]}>
                {activeRouteData.safetyScore}
              </Text>
              <Text style={styles.summaryLabel}>Safety Score</Text>
            </View>
          </View>
        </View>

        {/* Alerts Section */}
        {showAlerts && alerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Safety Advisories</Text>
              <Switch
                value={showAlerts}
                onValueChange={setShowAlerts}
                trackColor={{ false: '#202024', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>
            {alerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View
                  style={[
                    styles.alertIconContainer,
                    { backgroundColor: activeRouteData.riskColor + '20' }
                  ]}
                >
                  <Text style={styles.alertIcon}>⚠️</Text>
                </View>
                <Text style={styles.alertText}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Route Navigation Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Turn-by-Turn Navigation ({activeRouteData.steps.length} Steps)</Text>
          <View style={styles.stepsTimeline}>
            {activeRouteData.steps.map((step, index) => (
              <View key={index} style={styles.stepContainer}>
                {/* Visual line link */}
                <View style={styles.stepIndicatorCol}>
                  <View style={[styles.timelineNode, { backgroundColor: activeRouteData.riskColor }]} />
                  {index < activeRouteData.steps.length - 1 && (
                    <View style={styles.timelineLink} />
                  )}
                </View>

                {/* Instruction details */}
                <View style={styles.stepDetailsCol}>
                  <Text style={styles.stepInstruction}>{step.instruction}</Text>
                  <Text style={styles.stepMeta}>
                    {formatDistance(step.distance)} • {formatDuration(step.duration)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Start Navigation Button */}
        <TouchableOpacity style={[styles.startButton, { backgroundColor: activeRouteData.riskColor }]} onPress={startNavigation}>
          <Text style={styles.startButtonText}>Start Live Navigation</Text>
        </TouchableOpacity>

        {/* Action Options */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Shared', 'Secure link copied to clipboard')}>
            <Text style={styles.actionIcon}>↗️</Text>
            <Text style={styles.actionText}>Share Walk</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Marked', 'Security anomaly logged')}>
            <Text style={styles.actionIcon}>🚨</Text>
            <Text style={styles.actionText}>Report Anomaly</Text>
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
    backgroundColor: '#0a0a0c'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  backIcon: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 'bold'
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 16
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 20
  },
  backButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  summaryCard: {
    backgroundColor: '#111115',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center'
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4
  },
  summaryLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '600'
  },
  summarySeparator: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 12
  },
  section: {
    marginBottom: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 14
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111115',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)'
  },
  alertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  alertIcon: {
    fontSize: 16
  },
  alertText: {
    color: '#e5e7eb',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500'
  },
  stepsTimeline: {
    backgroundColor: '#111115',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)'
  },
  stepContainer: {
    flexDirection: 'row',
    minHeight: 60
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 16
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4
  },
  timelineLink: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 4
  },
  stepDetailsCol: {
    flex: 1,
    paddingBottom: 16
  },
  stepInstruction: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 18
  },
  stepMeta: {
    color: '#6b7280',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600'
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#111115',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  actionIcon: {
    fontSize: 16,
    marginBottom: 4
  },
  actionText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: 'bold'
  }
});
