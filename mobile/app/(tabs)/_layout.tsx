import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBackground: () => <View style={styles.tabBackground} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <View style={[styles.dot, { backgroundColor: color }]} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <View style={[styles.dot, { backgroundColor: color }]} />,
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS Urgent',
          tabBarIcon: ({ color }) => <View style={[styles.dot, { backgroundColor: color }]} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <View style={[styles.dot, { backgroundColor: color }]} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0a0a0c',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0c',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
});
