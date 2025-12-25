import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../styles/colors';
import Header from '../components/Header'; // Import Header

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import CargoScreen from '../screens/CargoScreen';
import SettingScreen from '../screens/SettingScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // ENABLE HEADER and use custom component
        headerShown: true, 
        header: () => <Header />, 
        
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { height: 75 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Cargo') iconName = focused ? 'truck-delivery' : 'truck-delivery-outline';
          else if (route.name === 'Setting') iconName = focused ? 'cog' : 'cog-outline';
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Cargo" component={CargoScreen} />
      <Tab.Screen name="Setting" component={SettingScreen} />
    </Tab.Navigator>
  );
}