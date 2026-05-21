import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';

export default function SignupScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>Coming soon in phase 2</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 32
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(30, 64, 175, 0.2)',
    borderRadius: 6
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600'
  }
});
