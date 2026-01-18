import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../styles/colors';
import Header from '../components/Header'; 

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import CargoScreen from '../screens/CargoScreen';
import SettingScreen from '../screens/SettingScreen';
import CargoListScreen from '../screens/CargoListScreen';
import PartiesScreen from '../screens/PartiesScreen'; // <--- IMPORT NEW SCREEN

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true, 
        header: () => <Header />, 
        
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { height: 75, paddingBottom: 10, paddingTop: 10 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Cargo') {
            iconName = focused ? 'truck-delivery' : 'truck-delivery-outline';
          } else if (route.name === 'Customers') {
            // <--- ICON LOGIC FOR CUSTOMERS
            iconName = focused ? 'account-group' : 'account-group-outline';
          } else if (route.name === 'History') {
            iconName = 'history';
          } else if (route.name === 'Setting') {
            iconName = focused ? 'cog' : 'cog-outline';
          }
          
          return <MaterialCommunityIcons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      
      {/* NEW CUSTOMERS SCREEN */}
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