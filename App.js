import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { UserProvider } from './src/context/UserContext'; // <--- Import this
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import PartiesScreen from './src/screens/PartiesScreen';
import PartyDetailsScreen from './src/screens/PartyDetailsScreen';
import EditPartyScreen from './src/screens/EditPartyScreen';

import CargoDetailsScreen from './src/screens/CargoDetailsScreen'; // Ensure this file exists
import EditProfileScreen from './src/screens/EditProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
  });

  if (!fontsLoaded) {
    return null; // or a loading screen
  }

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

<Stack.Screen 
  name="EditProfile" 
  component={EditProfileScreen} 
  options={{ title: 'Edit Profile' }} 
/>

<Stack.Screen 
  name="ChangePassword" 
  component={ChangePasswordScreen} 
  options={{ title: 'Change Password' }} 
/>

<Stack.Screen 
          name="CargoDetails" 
          component={CargoDetailsScreen} 
          options={{ title: 'Cargo Details' }} 
        />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}