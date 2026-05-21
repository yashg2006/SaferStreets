import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions
} from 'react-native';
import { NCRB_CITIES, NCRBCityData, getSafestCities, getMostDangerousCities } from '../../lib/data/ncrbData';
import { getCrimeBreakdown, getCityTrend, getSafetyColor, getRiskLevel } from '../../lib/services/safetyService';
import { CrimeChart } from '../../components/CrimeChart';

const { width } = Dimensions.get('window');

export default function StatisticsScreen() {
  const [selectedCity, setSelectedCity] = useState<NCRBCityData>(
    NCRB_CITIES.find((c) => c.name === 'Delhi') || NCRB_CITIES[0]
  );
  
  const [activeSegment, setActiveSegment] = useState<'details' | 'rankings'>('details');

  const crimeBreakdown = getCrimeBreakdown(selectedCity);
  const trendData = getCityTrend(selectedCity);

  const safestCities = getSafestCities(5);
  const dangerousCities = getMostDangerousCities(5);

  const renderCityChip = ({ item }: { item: NCRBCityData }) => {
    const isSelected = item.name === selectedCity.name;
    return (
      <TouchableOpacity
        style={[styles.cityChip, isSelected && styles.activeCityChip]}
        onPress={() => setSelectedCity(item)}
      >
        <Text style={[styles.cityChipText, isSelected && styles.activeCityChipText]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 NCRB Security Radar</Text>
        <Text style={styles.headerSubtitle}>Official Crime Records Bureau statistics (2022)</Text>
      </View>

      {/* City horizontal selector */}
      <View style={styles.selectorWrapper}>
        <FlatList
          data={NCRB_CITIES}
          renderItem={renderCityChip}
          keyExtractor={(item) => item.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        />
      </View>

      {/* Content Toggle Buttons */}
      <View style={styles.segmentWrapper}>
        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === 'details' && styles.activeSegment]}
          onPress={() => setActiveSegment('details')}
        >
          <Text style={[styles.segmentText, activeSegment === 'details' && styles.activeSegmentText]}>
            City Analysis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === 'rankings' && styles.activeSegment]}
          onPress={() => setActiveSegment('rankings')}
        >
          <Text style={[styles.segmentText, activeSegment === 'rankings' && styles.activeSegmentText]}>
            National Rankings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeSegment === 'details' ? (
          <View>
            {/* Overview Card */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <View>
                  <Text style={styles.cityName}>{selectedCity.name}</Text>
                  <Text style={styles.stateName}>{selectedCity.state} • India</Text>
                </View>
                <View 
                  style={[
                    styles.scoreRing, 
                    { borderColor: getSafetyColor(selectedCity.safetyScore) }
                  ]}
                >
                  <Text style={[styles.scoreNumber, { color: getSafetyColor(selectedCity.safetyScore) }]}>
                    {selectedCity.safetyScore}
                  </Text>
                  <Text style={styles.scoreLabel}>Score</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaColumn}>
                  <Text style={styles.metaLabel}>IPC Registered</Text>
                  <Text style={styles.metaValue}>{selectedCity.totalIPC.toLocaleString()}</Text>
                </View>
                <View style={styles.metaColumn}>
                  <Text style={styles.metaLabel}>Crime Rate</Text>
                  <Text style={styles.metaValue}>{selectedCity.crimeRate.toFixed(1)}</Text>
                  <Text style={styles.metaValueSub}>per lakh population</Text>
                </View>
                <View style={styles.metaColumn}>
                  <Text style={styles.metaLabel}>Risk Profile</Text>
                  <Text style={[styles.metaValue, { color: getSafetyColor(selectedCity.safetyScore) }]}>
                    {getRiskLevel(selectedCity.safetyScore)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Custom Interactive Crime Bar Chart */}
            <CrimeChart data={crimeBreakdown} />

            {/* Historical Trends */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>📊 Annual Crime Rate Trajectory (2019-2022)</Text>
              <View style={styles.trendList}>
                {trendData.map((item) => (
                  <View key={item.year} style={styles.trendRow}>
                    <Text style={styles.trendYear}>{item.year}</Text>
                    <View style={styles.trendLineWrapper}>
                      <View style={[styles.trendBarFill, { width: `${(item.crimeRate / 1000) * 100}%` }]} />
                    </View>
                    <Text style={styles.trendValue}>{item.crimeRate.toFixed(1)} /L</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.trendCaption}>
                * Normalization factors show a sharp drop in 2020 due to national lockdown cycles, returning to normal indices by 2022.
              </Text>
            </View>
          </View>
        ) : (
          <View>
            {/* National Safest Cities */}
            <View style={styles.card}>
              <Text style={[styles.cardHeader, { color: '#10b981' }]}>🛡️ Top 5 Safest Metro Cities</Text>
              {safestCities.map((city, index) => (
                <View key={city.name} style={styles.rankRow}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankName}>{city.name}</Text>
                    <Text style={styles.rankState}>{city.state}</Text>
                  </View>
                  <View style={styles.rankScoreBadge}>
                    <Text style={[styles.rankScoreValue, { color: getSafetyColor(city.safetyScore) }]}>
                      {city.safetyScore}/100
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* National Dangerous Cities */}
            <View style={styles.card}>
              <Text style={[styles.cardHeader, { color: '#ef4444' }]}>⚠️ Top 5 High Crime Cities</Text>
              {dangerousCities.map((city, index) => (
                <View key={city.name} style={styles.rankRow}>
                  <Text style={[styles.rankNumber, { color: '#ef4444' }]}>#{index + 1}</Text>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankName}>{city.name}</Text>
                    <Text style={styles.rankState}>{city.state}</Text>
                  </View>
                  <View style={styles.rankScoreBadge}>
                    <Text style={[styles.rankScoreValue, { color: getSafetyColor(city.safetyScore) }]}>
                      {city.safetyScore}/100
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.infoNote}>
              <Text style={styles.noteText}>
                ⚠️ NCRB scores calculated using registered cases under the Indian Penal Code (IPC) per 100,000 residents. Crime index varies widely based on local registration policies and municipal infrastructure.
              </Text>
            </View>
          </View>
        )}
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 4,
  },
  selectorWrapper: {
    backgroundColor: '#111115',
    paddingVertical: 10,
  },
  chipScroll: {
    paddingHorizontal: 20,
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    marginRight: 8,
  },
  activeCityChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  cityChipText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  activeCityChipText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  segmentWrapper: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginVertical: 14,
    backgroundColor: '#111115',
    borderRadius: 8,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeSegment: {
    backgroundColor: '#22c55e'
  },
  segmentText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  activeSegmentText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 24,
  },
  overviewCard: {
    backgroundColor: '#111115',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cityName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  stateName: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  scoreRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#9ca3af',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaColumn: {
    flex: 1,
  },
  metaLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
  },
  metaValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  metaValueSub: {
    color: '#6b7280',
    fontSize: 8,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#111115',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  trendList: {
    gap: 12,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendYear: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: 'bold',
    width: 40,
  },
  trendLineWrapper: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    marginHorizontal: 12,
  },
  trendBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  trendValue: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: 'bold',
    width: 60,
    textAlign: 'right',
  },
  trendCaption: {
    color: '#4b5563',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 14,
    lineHeight: 14,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  rankNumber: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 'bold',
    width: 32,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  rankState: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
  },
  rankScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rankScoreValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  infoNote: {
    padding: 12,
  },
  noteText: {
    color: '#4b5563',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
  },
});
