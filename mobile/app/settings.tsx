import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  SectionList
} from 'react-native';
import { useRouter } from 'expo-router';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'button' | 'divider';
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}

interface SettingsSection {
  title: string;
  data: SettingItem[];
}

export default function SettingsScreen() {
  const router = useRouter();

  // App Settings State
  const [notifications, setNotifications] = useState(true);
  const [incidentAlerts, setIncidentAlerts] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [locationTracking, setLocationTracking] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [shareData, setShareData] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: () => {
          // TODO: Handle logout
          console.log('[Settings] User signed out');
          router.replace('/(auth)/login');
        },
        style: 'destructive'
      }
    ]);
  };

  const handleReportIssue = () => {
    Alert.alert('Report an Issue', 'What type of issue would you like to report?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Crime Incident',
        onPress: () => {
          console.log('[Settings] Crime incident report initiated');
          Alert.alert('Crime Report', 'Incident details sent to local authorities.');
        }
      },
      {
        text: 'Poor Lighting',
        onPress: () => {
          console.log('[Settings] Lighting issue report initiated');
          Alert.alert('Lighting Report', 'Issue reported. Thank you for contributing!');
        }
      },
      {
        text: 'Map Error',
        onPress: () => {
          console.log('[Settings] Map error report initiated');
          Alert.alert('Map Error', 'Issue reported to our team.');
        }
      }
    ]);
  };

  const handlePrivacyPolicy = () => {
    console.log('[Settings] Opening privacy policy');
    // In production, would open privacy policy URL
    Alert.alert(
      'Privacy Policy',
      'Your location data is encrypted and stored securely. We never sell personal information.',
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  const handleTermsOfService = () => {
    console.log('[Settings] Opening terms of service');
    Alert.alert(
      'Terms of Service',
      'By using SaferStreets, you agree to our terms and conditions.',
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About SaferStreets',
      'Version 1.0.0\n\nSaferStreets helps you find the safest routes home by combining real-time crime data, lighting analysis, and community reports.',
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  const settingsSections: SettingsSection[] = [
    {
      title: 'Notifications',
      data: [
        {
          id: 'push-notifications',
          title: 'Push Notifications',
          subtitle: 'Receive route alerts and updates',
          type: 'toggle',
          value: notifications,
          onToggle: setNotifications
        },
        {
          id: 'incident-alerts',
          title: 'Incident Alerts',
          subtitle: 'Get notified of nearby incidents',
          type: 'toggle',
          value: incidentAlerts,
          onToggle: setIncidentAlerts
        },
        {
          id: 'weather-alerts',
          title: 'Weather Alerts',
          subtitle: 'Weather conditions affecting safety',
          type: 'toggle',
          value: weatherAlerts,
          onToggle: setWeatherAlerts
        }
      ]
    },
    {
      title: 'Privacy & Location',
      data: [
        {
          id: 'location-tracking',
          title: 'Background Location',
          subtitle: 'Share your location in background (uses battery)',
          type: 'toggle',
          value: locationTracking,
          onToggle: setLocationTracking
        },
        {
          id: 'share-data',
          title: 'Share Anonymous Data',
          subtitle: 'Help improve route safety for everyone',
          type: 'toggle',
          value: shareData,
          onToggle: setShareData
        },
        {
          id: 'privacy-policy',
          title: 'Privacy Policy',
          type: 'button',
          onPress: handlePrivacyPolicy
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          type: 'button',
          onPress: handleTermsOfService
        }
      ]
    },
    {
      title: 'Display',
      data: [
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          type: 'toggle',
          value: darkMode,
          onToggle: setDarkMode
        }
      ]
    },
    {
      title: 'Support & Feedback',
      data: [
        {
          id: 'report-issue',
          title: 'Report an Issue',
          subtitle: 'Tell us about safety concerns',
          type: 'button',
          onPress: handleReportIssue
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Help us improve SaferStreets',
          type: 'button',
          onPress: () => {
            Alert.alert(
              'Feedback',
              'Thank you for using SaferStreets. Your feedback is valuable!',
              [{ text: 'OK', onPress: () => {} }]
            );
          }
        },
        {
          id: 'about',
          title: 'About',
          type: 'button',
          onPress: handleAbout
        }
      ]
    },
    {
      title: 'Account',
      data: [
        {
          id: 'logout',
          title: 'Sign Out',
          type: 'button',
          onPress: handleLogout
        }
      ]
    }
  ];

  const renderItem = ({ item }: { item: SettingItem }) => {
    if (item.type === 'divider') {
      return <View style={styles.divider} />;
    }

    if (item.type === 'toggle') {
      return (
        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            )}
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#333333', true: '#10b981' }}
            thumbColor="#ffffff"
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.settingRow}
        onPress={item.onPress}
        activeOpacity={0.6}
      >
        <View style={styles.settingContent}>
          <Text
            style={[
              styles.settingTitle,
              item.id === 'logout' && styles.logoutText
            ]}
          >
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        <Text style={styles.settingChevron}>›</Text>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: SettingsSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderSectionFooter = () => <View style={styles.sectionFooter} />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Settings Sections */}
      <SectionList
        sections={settingsSections}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      />

      {/* App Version Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>SaferStreets v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  backIcon: {
    color: '#3b82f6',
    fontSize: 18,
    fontWeight: '700'
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  content: {
    paddingVertical: 12
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  },
  sectionTitle: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  sectionFooter: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 8
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  settingContent: {
    flex: 1,
    marginRight: 12
  },
  settingTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500'
  },
  settingSubtitle: {
    color: '#a0a0a0',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16
  },
  settingChevron: {
    color: '#666666',
    fontSize: 18,
    fontWeight: '400'
  },
  logoutText: {
    color: '#ef4444'
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 8
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)'
  },
  footerText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '500'
  }
});
