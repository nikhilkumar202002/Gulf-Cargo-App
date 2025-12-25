import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { login, getProfile } from '../api/auth'; // Added getProfile
import styles from '../styles/screenStyles';
import { useUser } from '../context/UserContext'; 

export default function LoginScreen({ navigation }) { 
  const { setUserData } = useUser(); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      // 1. LOGIN REQUEST
      const loginResponse = await login(email, password); //
      console.log('1. Login Response:', loginResponse.data);

      if (loginResponse.data.success) { 
        const token = loginResponse.data.token;
        
        // CRITICAL: Save token BEFORE making the next request
        // The axios interceptor needs this token in AsyncStorage to attach it to the header
        await AsyncStorage.setItem('userToken', token); 

        // 2. FETCH PROFILE REQUEST
        // Now that we have the token, we fetch the full user details
        console.log('Fetching Profile...');
        const profileResponse = await getProfile(); //
        console.log('2. Profile Response:', profileResponse.data);

        // Access the user object (structure based on your earlier JSON)
        const user = profileResponse.data.user || profileResponse.data.data;

        if (user && user.id) {
           await AsyncStorage.setItem('userId', String(user.id));
           await AsyncStorage.setItem('userData', JSON.stringify(user));
           console.log('✅ User Data Saved:', user.id);

            setUserData({
                id: user.id,                 // Save User ID
                branch_id: user.branch?.id,  // <--- CRITICAL: Save Branch ID flat
                branch: user.branch,         // Save full Branch object
                branchName: user.branch?.name || 'No Branch',
                name: user.name,
                email: user.email,
                profilePic: user.profile_pic,
                role: user.role
            });

            navigation.replace('Dashboard'); //
        } else {
           throw new Error('Profile fetched but user data is missing.');
        }

      } else {
        const msg = loginResponse.data.message || 'Invalid credentials';
        Alert.alert('Login Failed', msg);
      }

    } catch (error) {
      console.log('Login Process Error:', error);
      const errorMsg = error.response?.data?.message || 'Login failed or Profile load failed';
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