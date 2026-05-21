import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

export default function RootLayout() {
  useEffect(() => {
    // Request location permission on app startup
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#000000' }
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              title: 'SaferStreets'
            }}
          />
          <Stack.Screen
            name="(map)"
            options={{
              title: 'Safety Map'
            }}
          />
          <Stack.Screen
            name="(auth)"
            options={{
              title: 'Authentication',
              presentation: 'modal'
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
