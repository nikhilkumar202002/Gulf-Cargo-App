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
const AnimatedTabIcon = ({ iconName, focused, IconComponent = Ionicons }) => {
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
    <View style={styles.iconContainer}>
      <Animated.View
        style={[
          styles.activeBackground,
          {
            opacity: scaleValue,
            transform: [{ scale: scaleValue }],
          },
        ]}
      />
      {/* Render the Icon */}
      <IconComponent 
        name={iconName} 
        size={24} 
        color={focused ? "#FFFFFF" : "#1F2937"} 
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
        tabBarActiveTintColor: colors.primary, 
        tabBarInactiveTintColor: '#1F2937', 
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => {
          let iconName;
          let IconComponent = Ionicons;
          
          // Map routes to their respective Ionicons
          if (route.name === 'Home') {
            iconName = 'home-outline';
          } else if (route.name === 'Customers') {
            iconName = 'people-outline';
          } else if (route.name === 'Create Cargo') {
            iconName = 'truck-delivery-outline'; 
            IconComponent = MaterialCommunityIcons;
          } else if (route.name === 'History') {
            iconName = 'time-outline';
          } else if (route.name === 'Setting') {
            iconName = 'settings-outline';
          }
          
          return <AnimatedTabIcon iconName={iconName} focused={focused} IconComponent={IconComponent} />;
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
    height: Platform.OS === 'ios' ? 120 : 120,
    paddingBottom: Platform.OS === 'ios' ? 15 : 15,
    paddingTop: 8, 
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
    marginTop: 14,
    fontFamily: 'InstrumentSans-Regular'
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    marginTop: 6,
  },
  activeBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
    borderRadius: 24, 
  },
  iconElement: {
    zIndex: 1, 
  }
});