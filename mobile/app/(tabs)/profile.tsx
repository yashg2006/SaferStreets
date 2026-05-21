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
  const [userEmail, setUserEmail] = useState('user@saferstreets.in');
  const [userName, setUserName] = useState('Safety Navigator');
  const [isEditing, setIsEditing] = useState(false);

  const userStats: UserStats = {
    routesPlanned: 42,
    safeRoutesChosen: 36,
    incidentsReported: 4,
    communityRank: 'Delhi Guardian'
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
            } else {
              Alert.alert('Error', 'Password must be at least 6 characters');
            }
          }
        }
      ],
      'secure-text'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Security Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🛡️</Text>
          </View>
          {!isEditing && (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit Details</Text>
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
            <Text style={styles.fieldLabel}>Registered Mobile/Email</Text>
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
          <Text style={styles.sectionTitle}>Guardian Activity</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.routesPlanned}</Text>
              <Text style={styles.statLabel}>Radar Scans</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.safeRoutesChosen}</Text>
              <Text style={styles.statLabel}>Secure Walks</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.incidentsReported}</Text>
              <Text style={styles.statLabel}>Incidents Marked</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userStats.communityRank}</Text>
              <Text style={styles.statLabel}>Community Badge</Text>
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
              {Math.round((userStats.safeRoutesChosen / userStats.routesPlanned) * 100)}% route optimization via safety metrics
            </Text>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Credentials</Text>

          <TouchableOpacity
            style={styles.securityButton}
            onPress={handleChangePassword}
          >
            <View style={styles.securityButtonContent}>
              <Text style={styles.securityIcon}>🔐</Text>
              <View style={styles.securityText}>
                <Text style={styles.securityTitle}>Update Master Pin</Text>
                <Text style={styles.securitySubtitle}>
                  Change security pin for quick authentication
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  content: {
    paddingHorizontal: 24,
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarText: {
    fontSize: 32
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12
  },
  section: {
    marginBottom: 28
  },
  sectionTitle: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  field: {
    marginBottom: 16
  },
  fieldLabel: {
    color: '#4b5563',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6
  },
  fieldValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  input: {
    backgroundColor: '#111115',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14
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
    minWidth: '45%',
    backgroundColor: '#111115',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)'
  },
  statValue: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center'
  },
  contributionBar: {
    marginTop: 10
  },
  contributionBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8
  },
  contributionFill: {
    height: '100%',
    backgroundColor: '#10b981'
  },
  contributionText: {
    color: '#4b5563',
    fontSize: 11,
    fontWeight: '500'
  },
  securityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111115',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)'
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
    fontSize: 13,
    fontWeight: 'bold'
  },
  securitySubtitle: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2
  },
  chevron: {
    color: '#4b5563',
    fontSize: 16
  }
});
