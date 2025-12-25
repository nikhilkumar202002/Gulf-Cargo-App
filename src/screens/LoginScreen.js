import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <--- Import this
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

     if (response.data.success) { 
        const token = response.data.token;
        await AsyncStorage.setItem('userToken', token);
        if (response.data.user && response.data.user.id) {
           await AsyncStorage.setItem('userId', String(response.data.user.id));
        }
        console.log('Token & UserID Saved');
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
      {/* ... inputs and buttons ... */}
       <Text style={styles.title}>Welcome Back!</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.passwordInput}
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
          {loading ? 'Logging in...' : 'LOGIN'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}