import { Stack } from 'expo-router';

export default function MapLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' }
      }}
    >
      <Stack.Screen
        name="route-detail"
        options={{
          presentation: 'modal'
        }}
      />
    </Stack>
  );
}
