import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { CardStyleInterpolators } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import { UserProvider } from './src/context/UserContext';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import MainLayout from './src/navigation/MainLayout';
import PartiesScreen from './src/screens/PartiesScreen';
import PartyDetailsScreen from './src/screens/PartyDetailsScreen';
import EditSenderScreen from './src/screens/EditSenderScreen';
import EditReceiverScreen from './src/screens/EditReceiverScreen';
import CargoDetailsScreen from './src/screens/CargoDetailsScreen';
import CargoEditScreen from './src/screens/CargoEditScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    'InstrumentSans-Regular': require('./assets/fonts/InstrumentSans-Regular.ttf'),
    'InstrumentSans-Medium': require('./assets/fonts/InstrumentSans-Medium.ttf'),
    'InstrumentSans-SemiBold': require('./assets/fonts/InstrumentSans-SemiBold.ttf'),
    'InstrumentSans-Bold': require('./assets/fonts/InstrumentSans-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return null; // or a loading screen
  }

  return (
    <UserProvider> 
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        >
          {/* Auth Screens */}
          <Stack.Screen 
            name="Splash" 
            component={SplashScreen}
            options={{ animationEnabled: false }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ animationEnabled: false }}
          />

          {/* Main Dashboard with Common Layout */}
          <Stack.Screen 
            name="Dashboard" 
            component={MainLayout}
            options={{
              headerShown: false,
              animationEnabled: true,
            }}
          />

          {/* Detail/Modal Screens (Overlays on main layout) */}
          <Stack.Group
            screenOptions={{
              presentation: 'modal',
              cardStyleInterpolator: CardStyleInterpolators.forBottomSheetAndroid,
            }}
          >
            <Stack.Screen 
              name="PartyDetails" 
              component={PartyDetailsScreen} 
              options={{ title: 'Party Details' }} 
            />
            <Stack.Screen 
              name="EditSender" 
              component={EditSenderScreen} 
              options={{ title: 'Edit Sender' }} 
            />
            <Stack.Screen 
              name="EditReceiver" 
              component={EditReceiverScreen} 
              options={{ title: 'Edit Receiver' }} 
            />
            <Stack.Screen 
              name="CargoDetails" 
              component={CargoDetailsScreen} 
              options={{ title: 'Cargo Details' }} 
            />
            <Stack.Screen 
              name="CargoEdit" 
              component={CargoEditScreen} 
              options={{ title: 'Edit Cargo' }} 
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
          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}