import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';

interface IncidentReporterProps {
  visible: boolean;
  onClose: () => void;
}

interface ReportData {
  type: string;
  severity: string;
  description: string;
  includeLocation: boolean;
}

export const IncidentReporter: React.FC<IncidentReporterProps> = ({ visible, onClose }) => {
  const [step, setStep] = useState<'type' | 'details' | 'confirm'>('type');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({
    type: '',
    severity: 'medium',
    description: '',
    includeLocation: true
  });

  const incidentTypes = [
    { id: 'crime', label: 'Crime Incident', emoji: '🚨', color: '#ef4444' },
    { id: 'lighting', label: 'Poor Lighting', emoji: '💡', color: '#f59e0b' },
    { id: 'obstacle', label: 'Road Obstacle', emoji: '⚠️', color: '#f59e0b' },
    { id: 'other', label: 'Other', emoji: '📝', color: '#3b82f6' }
  ];

  const severityLevels = [
    { id: 'low', label: 'Low', color: '#10b981' },
    { id: 'medium', label: 'Medium', color: '#f59e0b' },
    { id: 'high', label: 'High', color: '#ef4444' }
  ];

  const handleSubmitReport = async () => {
    if (!reportData.description.trim()) {
      Alert.alert('Error', 'Please provide details about the incident');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('[IncidentReporter] Report submitted:', reportData);
      
      Alert.alert(
        'Thank You!',
        'Your report has been submitted successfully. It will help keep the community safer.',
        [
          {
            text: 'OK',
            onPress: () => {
              setStep('type');
              setReportData({
                type: '',
                severity: 'medium',
                description: '',
                includeLocation: true
              });
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Report an Issue</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width:
                  step === 'type'
                    ? '33%'
                    : step === 'details'
                    ? '66%'
                    : '100%'
              }
            ]}
          />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Step 1: Type Selection */}
          {step === 'type' && (
            <View>
              <Text style={styles.stepTitle}>What type of issue?</Text>
              <View style={styles.typeGrid}>
                {incidentTypes.map((incident) => (
                  <TouchableOpacity
                    key={incident.id}
                    style={[
                      styles.typeCard,
                      reportData.type === incident.id && styles.typeCardSelected
                    ]}
                    onPress={() => setReportData({ ...reportData, type: incident.id })}
                  >
                    <Text style={styles.typeEmoji}>{incident.emoji}</Text>
                    <Text style={styles.typeLabel}>{incident.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 2: Details */}
          {step === 'details' && (
            <View>
              <Text style={styles.stepTitle}>Describe the incident</Text>

              {/* Severity Selector */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Severity Level</Text>
                <View style={styles.severityRow}>
                  {severityLevels.map((level) => (
                    <TouchableOpacity
                      key={level.id}
                      style={[
                        styles.severityButton,
                        reportData.severity === level.id &&
                          styles.severityButtonSelected,
                        { borderColor: level.color }
                      ]}
                      onPress={() =>
                        setReportData({ ...reportData, severity: level.id })
                      }
                    >
                      <Text
                        style={[
                          styles.severityText,
                          reportData.severity === level.id &&
                            styles.severityTextSelected
                        ]}
                      >
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Details</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Describe what happened..."
                  placeholderTextColor="#666666"
                  value={reportData.description}
                  onChangeText={(text) =>
                    setReportData({ ...reportData, description: text })
                  }
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Location Option */}
              <View style={styles.locationOption}>
                <View>
                  <Text style={styles.locationTitle}>Include Location</Text>
                  <Text style={styles.locationSubtitle}>
                    Help us pinpoint the exact location
                  </Text>
                </View>
                <View style={styles.checkbox}>
                  {reportData.includeLocation && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirm' && (
            <View>
              <Text style={styles.stepTitle}>Review Your Report</Text>

              <View style={styles.confirmCard}>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Type:</Text>
                  <Text style={styles.confirmValue}>
                    {incidentTypes.find((t) => t.id === reportData.type)?.label}
                  </Text>
                </View>

                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Severity:</Text>
                  <Text
                    style={[
                      styles.confirmValue,
                      {
                        color: severityLevels.find((s) => s.id === reportData.severity)
                          ?.color
                      }
                    ]}
                  >
                    {severityLevels.find((s) => s.id === reportData.severity)?.label}
                  </Text>
                </View>

                <View style={styles.confirmDivider} />

                <Text style={styles.confirmLabel}>Description:</Text>
                <Text style={styles.confirmDescription}>{reportData.description}</Text>

                <View style={styles.confirmDivider} />

                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Location:</Text>
                  <Text style={styles.confirmValue}>
                    {reportData.includeLocation ? 'Included' : 'Not included'}
                  </Text>
                </View>
              </View>

              <Text style={styles.confirmNote}>
                ✓ Your report will be anonymously submitted to community moderators and
                local authorities
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          {step !== 'type' && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                if (step === 'details') setStep('type');
                if (step === 'confirm') setStep('details');
              }}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              (!reportData.type || (step === 'details' && !reportData.description.trim())) &&
                styles.buttonDisabled
            ]}
            onPress={() => {
              if (step === 'type' && reportData.type) setStep('details');
              else if (step === 'details' && reportData.description.trim())
                setStep('confirm');
              else if (step === 'confirm') handleSubmitReport();
            }}
            disabled={
              (!reportData.type && step === 'type') ||
              (!reportData.description.trim() && step === 'details') ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {step === 'confirm' ? 'Submit Report' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 30
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    display: 'flex'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700'
  },
  closeButton: {
    color: '#999999',
    fontSize: 20,
    fontWeight: '600'
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6'
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flex: 1
  },
  stepTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  typeCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  typeCardSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3b82f6'
  },
  typeEmoji: {
    fontSize: 32,
    marginBottom: 8
  },
  typeLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },
  section: {
    marginBottom: 20
  },
  sectionLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10
  },
  severityRow: {
    flexDirection: 'row',
    gap: 10
  },
  severityButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  severityButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  severityText: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '600'
  },
  severityTextSelected: {
    color: '#ffffff'
  },
  descriptionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 100
  },
  locationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14
  },
  locationTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600'
  },
  locationSubtitle: {
    color: '#a0a0a0',
    fontSize: 11,
    marginTop: 2
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkmark: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '700'
  },
  confirmCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  confirmLabel: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '600'
  },
  confirmValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600'
  },
  confirmDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12
  },
  confirmDescription: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12
  },
  confirmNote: {
    color: '#10b981',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center'
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  primaryButton: {
    backgroundColor: '#3b82f6'
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.5
  }
});
