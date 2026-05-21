import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import { CalculatedRoute } from '../lib/services/routingService';

interface RouteCardProps {
  route: CalculatedRoute | null;
  type: 'fastest' | 'safest';
  isActive: boolean;
  onSelect: (type: 'fastest' | 'safest') => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  type,
  isActive,
  onSelect
}) => {
  const router = useRouter();

  if (!route) {
    return null;
  }

  const getIcon = (type: string) => {
    return type === 'fastest' ? '⚡' : '🛡️';
  };

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={() => onSelect(type)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{getIcon(type)}</Text>
          <Text style={styles.routeType}>
            {type === 'fastest' ? 'Fastest Route' : 'Safest Route'}
          </Text>
        </View>
        {isActive && <View style={styles.activeBadge} />}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{route.durationMins}</Text>
          <Text style={styles.statLabel}>min</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{route.distanceKm}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: route.riskColor }]}>
            {route.safetyScore}/100
          </Text>
          <Text style={styles.statLabel}>Safety</Text>
        </View>
      </View>

      {/* Top Factor */}
      <View style={styles.factorSection}>
        <Text style={styles.factorLabel}>Route Advisory:</Text>
        <Text style={styles.factorText}>
          {type === 'safest' 
            ? `• Minimizes dangerous intersections. Calculated risk: ${route.riskLevel}.`
            : `• Prioritizes transit speed. Risk index: ${route.riskLevel}.`
          }
        </Text>
      </View>

      {/* Footer Button */}
      <TouchableOpacity
        style={[styles.detailButton, isActive && styles.detailButtonActive]}
        onPress={() => router.push({
          pathname: '/(map)/route-detail',
          params: { type }
        })}
      >
        <Text style={[styles.detailButtonText, isActive && styles.detailButtonTextActive]}>
          {isActive ? 'View Navigation Details' : 'Select Route'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111115',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10
  },
  cardActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10b981'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  icon: {
    fontSize: 16
  },
  routeType: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  activeBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981'
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)'
  },
  stat: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '600'
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 8
  },
  factorSection: {
    marginBottom: 12
  },
  factorLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4
  },
  factorText: {
    color: '#9ca3af',
    fontSize: 11,
    lineHeight: 16
  },
  detailButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    alignItems: 'center'
  },
  detailButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981'
  },
  detailButtonText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: 'bold'
  },
  detailButtonTextActive: {
    color: '#ffffff'
  }
});
