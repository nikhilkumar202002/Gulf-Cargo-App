import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Dimensions, StatusBar } from 'react-native';
import colors from '../styles/colors'; // Using your existing colors file

export default function SplashScreen({ navigation }) {
  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;  // Start invisible
  const scaleAnim = useRef(new Animated.Value(0.3)).current; // Start small

  useEffect(() => {
    // 1. Run Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000, // 1 second fade in
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,   // Bounciness (lower is more bouncy)
        tension: 10,   // Speed
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Navigate after delay
    const timer = setTimeout(() => {
      // Use 'replace' so the user can't press Back to return to the splash screen
      navigation.replace('Login'); 
    }, 2500); // Wait 2.5 seconds total

    return () => clearTimeout(timer); // Cleanup
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Animated Logo Container */}
      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            opacity: fadeAnim, 
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        {/* Adjust the filename if your logo is named differently (e.g., logo.jpg) */}
        <Image 
          source={require('../../assets/Logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </Animated.View>

      {/* Optional: Simple Loader at the bottom */}
      <View style={styles.bottomLoader}>
        <Animated.Text style={{ opacity: fadeAnim, color: colors.secondary, fontWeight: 'bold' }}>
          GULF CARGO INTERNATIONAL
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background (Change to colors.primary if you want red background)
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  bottomLoader: {
    position: 'absolute',
    bottom: 50,
  }
});