import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Call authentication API
      console.log('[Login] Would send magic link to:', email);
      
      // For now, simulate success
      setTimeout(() => {
        setIsLoading(false);
        // Navigate to verification screen or home
        router.replace('/(map)');
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      setError('Failed to send login link. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.logo}>SaferStreets</Text>
            <Text style={styles.tagline}>Stay safe on every street</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Sign in to continue</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#666666"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Sending...' : 'Send Magic Link'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacySection}>
            <Text style={styles.privacyText}>
              By signing in, you agree to our Terms of Service and Privacy Policy.
              Your location is never stored precisely.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'space-between'
  },
  headerSection: {
    marginTop: 40,
    marginBottom: 60
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8
  },
  tagline: {
    fontSize: 16,
    color: '#999999',
    fontWeight: '400'
  },
  formSection: {
    marginBottom: 40
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24
  },
  inputContainer: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999999',
    marginBottom: 6
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#ffffff'
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  buttonDisabled: {
    opacity: 0.6
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerText: {
    color: '#999999',
    fontSize: 14
  },
  signupLink: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600'
  },
  privacySection: {
    marginTop: 24
  },
  privacyText: {
    color: '#666666',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center'
  }
});
