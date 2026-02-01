import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import colors from '../styles/colors'; // Brand colors: primary (#ed2624) and secondary (#283891)
import Header from '../components/Header'; 

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import CargoScreen from '../screens/CargoScreen';
import SettingScreen from '../screens/SettingScreen';
import CargoListScreen from '../screens/CargoListScreen';
import PartiesScreen from '../screens/PartiesScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true, 
        header: () => <Header />, 
        
        tabBarActiveTintColor: colors.primary, // Using brand primary color for active state
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Customers') {
            iconName = focused ? 'account-group' : 'account-group-outline';
          } else if (route.name === 'Cargo') {
            iconName = focused ? 'truck-delivery' : 'truck-delivery-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'history' : 'history';
          } else if (route.name === 'Setting') {
            iconName = focused ? 'cog' : 'cog-outline';
          }
          
          return (
            <View style={styles.iconContainer}>
              {/* Top indicator line shown only when focused, matching reference image */}
              {focused && <View style={styles.topIndicator} />}
              <MaterialCommunityIcons name={iconName} size={24} color={color} />
            </View>
          );
        },
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
      
      <Tab.Screen name="Setting" component={SettingScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0, // Removing standard border for a cleaner look
    height: Platform.OS === 'ios' ? 110 : 90,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 10, // Set to 0 because indicator handles top spacing
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    position: 'absolute', // Allows content to flow behind if desired
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -5, // Closer to icon
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  topIndicator: {
    position: 'absolute',
    top: -10,
    width: 40, // Length of the indicator line
    height: 3,
    backgroundColor: colors.primary, // Using brand primary color
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  }
});