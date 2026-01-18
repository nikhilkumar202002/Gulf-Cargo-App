import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { UserProvider } from './src/context/UserContext'; // <--- Import this
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import PartiesScreen from './src/screens/PartiesScreen';
import PartyDetailsScreen from './src/screens/PartyDetailsScreen';
import EditPartyScreen from './src/screens/EditPartyScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <UserProvider> 
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Dashboard" 
            component={MainTabNavigator} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />

{/* Add these new screens */}
<Stack.Screen 
  name="PartyDetails" 
  component={PartyDetailsScreen} 
  options={{ title: 'Party Details' }} 
/>
<Stack.Screen 
  name="EditParty" 
  component={EditPartyScreen} 
  options={{ title: 'Edit Party' }} 
/>
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}