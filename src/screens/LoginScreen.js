import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, 
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions, 
  StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { login, getProfile } from '../api/auth'; 
import { useUser } from '../context/UserContext'; 
import { LinearGradient } from 'expo-linear-gradient'; 

const { width, height } = Dimensions.get('window');
const APP_VERSION = "v1.0.2"; 

export default function LoginScreen({ navigation }) { 
  const { setUserData } = useUser(); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const [isFocused, setIsFocused] = useState(null);

  useEffect(() => {
    const checkExistingSession = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const lastActivity = await AsyncStorage.getItem('last_activity');
      const now = Date.now();
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

      if (token && lastActivity && (now - parseInt(lastActivity) < ONE_WEEK)) {
        navigation.replace('Dashboard');
      }
    };
    checkExistingSession();
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const loginResponse = await login(email, password);
      if (loginResponse.data.success) { 
        const token = loginResponse.data.token;
        const nowTimestamp = Date.now().toString();
        await AsyncStorage.setItem('userToken', token); 
        await AsyncStorage.setItem('session_start', nowTimestamp); 
        await AsyncStorage.setItem('last_activity', nowTimestamp);

        const profileResponse = await getProfile();
        const user = profileResponse.data.user || profileResponse.data.data;

        if (user && user.id) {
            setUserData({
                id: user.id,
                branch_id: user.branch?.id,
                branchName: user.branch?.name || 'No Branch',
                name: user.name,
                email: user.email,
                profilePic: user.profile_pic,
                role: user.role
            });
            navigation.replace('Dashboard'); 
        }
      } else {
        Alert.alert('Login Failed', loginResponse.data.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9F9" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <View style={styles.headerSection}>
            <Image 
              source={require('../../assets/Logo.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
          </View>

          {/* Titles */}
          <View style={styles.textHeader}>
            <Text style={styles.welcomeText}>Sign In</Text>
            <Text style={styles.instructionText}>Sign in to your account</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <View style={[
                styles.inputField, 
                isFocused === 'email' && styles.inputFieldActive
              ]}>
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setIsFocused('email')}
                  onBlur={() => setIsFocused(null)}
                  style={styles.textInput}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={[
                styles.inputField, 
                isFocused === 'password' && styles.inputFieldActive
              ]}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused(null)}
                  style={styles.textInput}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIconContainer}
                >
                  <MaterialCommunityIcons 
                    name={showPassword ? "eye" : "eye-outline"} 
                    size={22} 
                    color="#433CA7" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => Alert.alert("Reset", "Contact Admin")}
            >
              <Text style={styles.forgotLink}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity 
              onPress={handleLogin} 
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.actionButtonTouchable, loading && styles.actionButtonDisabledTouchable]}
            >
              <LinearGradient colors={['#262262', '#4E45C8']} style={styles.actionButtonGradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
                <Text style={styles.actionButtonText}>
                  {loading ? "Authenticating..." : "Sign In"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footerInfo}>
        <Text style={styles.versionLabel}>BUILD v{APP_VERSION}</Text>
        <View style={styles.dotSeparator} />
        <Text style={styles.versionLabel}>SECURE ACCESS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { 
    flex: 1, 
    backgroundColor: '#F9F9F9' 
  },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: 20, 
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 100 // Extra padding for footer
  },
  headerSection: { 
    alignItems: 'center', 
    marginBottom: 40 
  },
  logo: { 
    width: 180, 
    height: 80 
  },
  textHeader: {
    alignItems: 'center',
    marginBottom: 40
  },
  welcomeText: { 
    fontSize: 28, 
    fontWeight: '600', 
    color: '#111827', 
    marginBottom: 8,
    fontFamily: 'InstrumentSans-Regular'
  },
  instructionText: { 
    fontSize: 15, 
    color: '#6B7280',
    fontFamily: 'InstrumentSans-Regular'
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: { 
    marginBottom: 16 
  },
  inputField: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 8, 
    paddingHorizontal: 16, 
    height: 54,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  inputFieldActive: {
    borderColor: '#433CA7', // Dark purple highlight on focus
  },
  textInput: { 
    flex: 1, 
    fontSize: 15, 
    color: '#111827', 
    height: '100%',
    fontFamily: 'InstrumentSans-Regular'
  },
  eyeIconContainer: {
    paddingLeft: 10,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotLink: { 
    color: '#E83D48', // Red color matching the design
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'InstrumentSans-Regular'
  },
  actionButtonTouchable: { 
    height: 54, 
    borderRadius: 8, 
  },
  actionButtonDisabledTouchable: {
    opacity: 0.5,
  },
  actionButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  actionButtonText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: '500',
    fontFamily: 'InstrumentSans-Regular'
  },
  footerInfo: {
    position: 'absolute', 
    bottom: 40,           
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionLabel: { 
    color: '#6B7280', 
    fontSize: 11,
    fontFamily: 'InstrumentSans-Regular'
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#6B7280',
    marginHorizontal: 10
  }
});