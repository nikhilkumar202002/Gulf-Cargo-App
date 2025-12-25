import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
// Ensure you have icons installed: npm install @expo/vector-icons
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { login } from '../api/auth';
import styles from '../styles/screenStyles';

export default function LoginScreen({ navigation }) { // <--- 1. Receive navigation prop

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 2. State for eye toggle

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await login(email, password);
      console.log('API Response:', response.data);

      if (response.data.success) { 
        // 3. SUCCESS: Redirect to Dashboard
        navigation.replace('Dashboard'); 
      } else {
        const msg = response.data.message || 'Invalid credentials';
        Alert.alert('Login Failed', msg);
      }

    } catch (error) {
      console.log('Login Error:', error.response?.data);
      const errorMsg = error.response?.data?.message || 'Something went wrong';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
     <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      {/* Password Container */}
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.passwordInput}
          // 4. CRITICAL FIX: This must be a boolean { ... } not a string " ... "
          secureTextEntry={!showPassword}

        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <MaterialCommunityIcons 
            name={showPassword ? "eye" : "eye-off"} 
            size={24} 
            color="#aaa" 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>
          {loading ? 'Please wait...' : 'LOGIN'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}