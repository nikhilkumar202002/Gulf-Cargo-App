import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/screenStyles'; // Reuse your existing styles

export default function DashboardScreen({ navigation }) {

  const handleLogout = () => {
    // Navigate back to Login and clear history so they can't go "back" to dashboard
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subheadline}>Welcome to the App!</Text>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>You are now logged in.</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>LOGOUT</Text>
      </TouchableOpacity>
    </View>
  );
}