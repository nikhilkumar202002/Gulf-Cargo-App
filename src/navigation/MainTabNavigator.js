import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, StyleSheet, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../styles/colors'; // Brand colors: primary (#ed2624) and secondary (#283891)

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import CargoScreen from '../screens/CargoScreen';
import SettingScreen from '../screens/SettingScreen';
import CargoListScreen from '../screens/CargoListScreen';
import PartiesScreen from '../screens/PartiesScreen';

const Tab = createBottomTabNavigator();

// Custom component to handle the smooth spring animation
const AnimatedTabIcon = ({ iconName, focused, IconComponent = Ionicons, isPrimary = false }) => {
  const scaleValue = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
      tension: 50, // Adjust for a bouncier or stiffer animation
    }).start();
  }, [focused]);

  return (
    <View style={[styles.iconContainer, isPrimary && styles.primaryIconContainer]}>
      <Animated.View
        style={[
          isPrimary ? styles.primaryBackground : styles.activeBackground,
          {
            opacity: isPrimary ? 1 : scaleValue,
            transform: [{ scale: isPrimary ? 1 : scaleValue }],
          },
        ]}
      />
      {/* Render the Icon */}
      <IconComponent 
        name={iconName} 
        size={isPrimary ? 25 : 22} 
        color={focused || isPrimary ? "#FFFFFF" : "#64748B"} 
        style={styles.iconElement}
      />
    </View>
  );
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        keyboardHidesTabBar: true,
        tabBarActiveTintColor: colors.primary, 
        tabBarInactiveTintColor: '#1F2937', 
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => {
          let iconName;
          let IconComponent = Ionicons;
          let isPrimary = false;
          
          // Map routes to their respective Ionicons
          if (route.name === 'Home') {
            iconName = 'home-outline';
          } else if (route.name === 'Customers') {
            iconName = 'people-outline';
          } else if (route.name === 'Create Cargo') {
            iconName = 'truck-delivery-outline'; 
            IconComponent = MaterialCommunityIcons;
            isPrimary = true;
          } else if (route.name === 'History') {
            iconName = 'time-outline';
          } else if (route.name === 'Setting') {
            iconName = 'settings-outline';
          }
          
          return <AnimatedTabIcon iconName={iconName} focused={focused} IconComponent={IconComponent} isPrimary={isPrimary} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      
      <Tab.Screen 
        name="Customers" 
        component={PartiesScreen} 
        options={{ title: 'Customers' }}
      />

      <Tab.Screen name="Create Cargo" component={CargoScreen} />
      
      <Tab.Screen 
          name="History" 
          component={CargoListScreen} 
          options={{ title: 'History' }}
      />
      
      <Tab.Screen 
        name="Setting" 
        component={SettingScreen} 
        options={{ title: 'Settings' }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0, 
    height: Platform.OS === 'ios' ? 88 : 82,
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
    paddingTop: 8,
    paddingHorizontal: 8,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    position: 'absolute', 
    bottom: Platform.OS === 'ios' ? 8 : 10,
    left: 12,
    right: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    fontFamily: 'InstrumentSans-Regular'
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 32,
    marginTop: 4,
  },
  primaryIconContainer: {
    width: 48,
    height: 42,
    marginTop: -8,
  },
  activeBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.secondary,
    borderRadius: 16, 
  },
  primaryBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    borderRadius: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  iconElement: {
    zIndex: 1, 
  }
});
