import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        
        {/* Login Screen (Hide the header bar) */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* Dashboard Screen (Show header, disable back button) */}
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
          options={{ 
            title: 'My Dashboard',
            headerLeft: null // Prevents Android back button from returning to login
          }} 
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}