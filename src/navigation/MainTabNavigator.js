import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, Animated } from 'react-native';
import colors from '../styles/colors'; // Brand colors: primary (#ed2624) and secondary (#283891)
import Header from '../components/Header'; 

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import CargoScreen from '../screens/CargoScreen';
import SettingScreen from '../screens/SettingScreen';
import CargoListScreen from '../screens/CargoListScreen';
import PartiesScreen from '../screens/PartiesScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ focused, route }) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.8)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1 : 0.8,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [focused, scaleAnim]);

  let iconName;
  
  // Using outline variants for all to match the design aesthetics
  if (route.name === 'Home') {
    iconName = 'home-outline';
  } else if (route.name === 'Customers') {
    iconName = 'account-group-outline';
  } else if (route.name === 'Cargo') {
    iconName = 'truck-outline'; // Changed to match the box truck outline in the image
  } else if (route.name === 'History') {
    iconName = 'history';
  } else if (route.name === 'Setting') {
    iconName = 'cog-outline';
  }
  
  // Render the active state with the red circle background
  if (focused) {
    return (
      <Animated.View style={[styles.activeIconContainer, { transform: [{ scale: scaleAnim }] }]}>
        <MaterialCommunityIcons name={iconName} size={24} color="#FFFFFF" />
      </Animated.View>
    );
  }

  // Render the inactive state (just the icon)
  return (
    <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
      <MaterialCommunityIcons name={iconName} size={24} color="#1F2937" />
    </Animated.View>
  );
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true, 
        header: () => <Header />, 
        
        tabBarActiveTintColor: colors.primary, 
        tabBarInactiveTintColor: '#1F2937', // Darker gray/black for inactive text to match design
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => <TabIcon focused={focused} route={route} />,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      
      <Tab.Screen 
        name="Customers" 
        component={PartiesScreen} 
        options={{ title: 'Customers' }}
      />

      <Tab.Screen name="Cargo" component={CargoScreen} />
      
      <Tab.Screen 
          name="History" 
          component={CargoListScreen} 
          options={{ title: 'History' }}
      />
      
      <Tab.Screen 
        name="Setting" 
        component={SettingScreen} 
        options={{ title: 'Settings' }} // Updated to plural "Settings" to match image text
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0, 
    height: Platform.OS === 'ios' ? 110 : 100,
    paddingBottom: Platform.OS === 'ios' ? 34 : 10,
    paddingTop: 10, 
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    position: 'absolute', 
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center' 
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  activeIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary, // Fills the background with red
    width: 48,
    height: 48,
    borderRadius: 24, // Makes it a perfect circle
    marginTop: 2,
  }
});