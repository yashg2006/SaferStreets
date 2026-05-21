import React from 'react';
import { View, StyleSheet, Text, DimensionValue } from 'react-native';
import { CrimeBreakdown } from '../lib/services/safetyService';

interface CrimeChartProps {
  data: CrimeBreakdown[];
}

export const CrimeChart: React.FC<CrimeChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <Text style={styles.noData}>No data available for visualizer</Text>;
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.chartHeader}>Crime Distribution (Annual Registered Cases)</Text>
      
      <View style={styles.chartArea}>
        {data.map((item) => {
          const percentage = ((item.count / maxCount) * 100).toFixed(0);
          
          return (
            <View key={item.category} style={styles.barRow}>
              {/* Category Info */}
              <View style={styles.labelSection}>
                <Text style={styles.categoryText}>{item.category}</Text>
                <Text style={styles.countText}>{item.count.toLocaleString()}</Text>
              </View>

              {/* Bar */}
              <View style={styles.barWrapper}>
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      backgroundColor: item.color || '#3b82f6',
                      width: `${percentage}%` as DimensionValue
                    }
                  ]} 
                />
              </View>

              {/* Crime rate per lakh */}
              <View style={styles.rateSection}>
                <Text style={styles.rateValue}>{item.perLakh}</Text>
                <Text style={styles.rateLabel}>/lakh</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Violent</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>Property</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: '#7c3aed' }]} />
          <Text style={styles.legendText}>Gender-based</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f1f23',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  chartHeader: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartArea: {
    gap: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelSection: {
    width: 90,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  countText: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
  },
  barWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  rateSection: {
    width: 55,
    alignItems: 'flex-end',
  },
  rateValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rateLabel: {
    color: '#6b7280',
    fontSize: 9,
    marginTop: 1,
  },
  noData: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    padding: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
  },
});
