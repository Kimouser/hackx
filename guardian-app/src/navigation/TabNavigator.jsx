import React from 'react';
import { Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapScreen from '../screens/MapScreen';
import ReportScreen from '../screens/ReportScreen';
import DashboardScreen from '../screens/DashboardScreen';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'rgba(10,10,20,0.92)',
          borderTopColor: 'rgba(255,255,255,0.05)',
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 58 : 65,
          paddingBottom: Platform.OS === 'web' ? 6 : 12,
          paddingTop: 6,
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } : {}),
        },
        tabBarActiveTintColor: colors.safe,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
        headerStyle: {
          backgroundColor: '#0d0d1a',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.05)',
          ...(Platform.OS === 'web' ? { boxShadow: 'none' } : {}),
        },
        headerTintColor: colors.safe,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
      }}
    >
      <Tab.Screen
        name="SafeMap"
        component={MapScreen}
        options={{
          title: 'Safe Map',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🗺️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          title: 'Report',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📢</Text>
          ),
          headerTitle: 'Report Issue',
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>📊</Text>
          ),
          headerTitle: 'Community Dashboard',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
