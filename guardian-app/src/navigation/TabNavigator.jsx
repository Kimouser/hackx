import React from 'react';
import { Text, Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapScreen from '../screens/MapScreen';
import ReportScreen from '../screens/ReportScreen';
import DashboardScreen from '../screens/DashboardScreen';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 60 : 65,
          paddingBottom: Platform.OS === 'web' ? 8 : 12,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.safe,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.safe,
        headerTitleStyle: { fontWeight: '700' },
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={{ marginRight: 16, padding: 8 }}
          >
            <Text style={{ fontSize: 24 }}>👤</Text>
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen
        name="SafeMap"
        component={MapScreen}
        options={{
          title: 'Safe Map',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>🗺️</Text>
          ),
          headerTitle: '🛡️ Project Guardian',
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
