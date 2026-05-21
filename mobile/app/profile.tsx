import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';

interface UserStats {
  routesPlanned: number;
  safeRoutesChosen: number;
  incidentsReported: number;
  communityRank: string;
}

export default function ProfileScreen() {
  const router = useRouter();

  // Mock user data
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [userName, setUserName] = useState('Safety Navigator');
  const [isEditing, setIsEditing] = useState(false);

  const userStats: UserStats = {
    routesPlanned: 24,
    safeRoutesChosen: 19,
    incidentsReported: 3,
    communityRank: 'Bronze'
  };

  const handleSaveProfile = () => {
    if (!userName.trim()) {
      Alert.alert('Error', 'Please enter a valid name');
      return;
    }
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleChangePassword = () => {
    Alert.prompt(
      'Change Password',
      'Enter your new password:',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel'
        },
        {
          text: 'Update',
          onPress: (password) => {
            if (password && password.length >= 6) {
              Alert.alert('Success', 'Password updated');
              console.log('[Profile] Password changed');
            } else {
              Alert.alert('Error', 'Password must be at least 6 characters');
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: () => {
            console.log('[Profile] Account deleted');
            // Would redirect to login screen
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          {!isEditing && (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          {/* Name Field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={userName}
                onChangeText={setUserName}
                placeholderTextColor="#666666"
              />
            ) : (
              <Text style={styles.fieldValue}>{userName}</Text>
            )}
          </View>

          {/* Email Field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValue}>{userEmail}</Text>
          </View>

          {/* Edit Actions */}
          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Activity</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.routesPlanned}</Text>
              <Text style={styles.statLabel}>Routes Planned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.safeRoutesChosen}</Text>
              <Text style={styles.statLabel}>Safe Routes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.incidentsReported}</Text>
              <Text style={styles.statLabel}>Incidents</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.communityRank}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
          </View>

          <View style={styles.contributionBar}>
            <View style={styles.contributionBackground}>
              <View
                style={[
                  styles.contributionFill,
                  { width: `${(userStats.safeRoutesChosen / userStats.routesPlanned) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.contributionText}>
              {Math.round((userStats.safeRoutesChosen / userStats.routesPlanned) * 100)}% of routes are safe
            </Text>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <TouchableOpacity
            style={styles.securityButton}
            onPress={handleChangePassword}
          >
            <View style={styles.securityButtonContent}>
              <Text style={styles.securityIcon}>🔐</Text>
              <View style={styles.securityText}>
                <Text style={styles.securityTitle}>Change Password</Text>
                <Text style={styles.securitySubtitle}>
                  Update your account password
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.securityButton}>
            <View style={styles.securityButtonContent}>
              <Text style={styles.securityIcon}>📱</Text>
              <View style={styles.securityText}>
                <Text style={styles.securityTitle}>Two-Factor Auth</Text>
                <Text style={styles.securitySubtitle}>
                  Enable extra security
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
          <Text style={styles.warningText}>
            This will permanently delete your account and all associated data.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  settingsIcon: {
    fontSize: 18
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarText: {
    fontSize: 40
  },
  editButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14
  },
  section: {
    marginBottom: 28
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  field: {
    marginBottom: 16
  },
  fieldLabel: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6
  },
  fieldValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500'
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  saveButton: {
    backgroundColor: '#10b981'
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center'
  },
  statValue: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4
  },
  statLabel: {
    color: '#a0a0a0',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center'
  },
  contributionBar: {
    marginTop: 10
  },
  contributionBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  contributionFill: {
    height: '100%',
    backgroundColor: '#10b981'
  },
  contributionText: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '500'
  },
  securityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 10
  },
  securityButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 12
  },
  securityText: {
    flex: 1
  },
  securityTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },
  securitySubtitle: {
    color: '#a0a0a0',
    fontSize: 12,
    marginTop: 2
  },
  chevron: {
    color: '#666666',
    fontSize: 18
  },
  dangerButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center'
  },
  dangerButtonText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 14
  },
  warningText: {
    color: '#a0a0a0',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
    textAlign: 'center'
  }
});
