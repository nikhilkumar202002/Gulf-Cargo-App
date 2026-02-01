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
import colors from '../styles/colors';

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
      <StatusBar barStyle="dark-content" />
      
      {/* Background Pattern Layer */}
      <View style={styles.patternOverlay}>
        <View style={styles.dotGrid} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Minimal Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/Logo.png')} 
                style={styles.logo} 
                resizeMode="contain" 
              />
            </View>
            <Text style={styles.brandTitle}>GULF CARGO</Text>
            <View style={styles.titleUnderline} />
          </View>

          {/* Minimal Form Container */}
          <View style={styles.formContainer}>
            <View style={styles.textHeader}>
              <Text style={styles.welcomeText}>Sign In</Text>
              <Text style={styles.instructionText}>Enter your credentials to continue</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <View style={[
                styles.inputField, 
                isFocused === 'email' && styles.inputFieldActive
              ]}>
                <TextInput
                  placeholder="admin@gulfcargo.com"
                  placeholderTextColor="#94A3B8"
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

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TouchableOpacity onPress={() => Alert.alert("Reset", "Contact Admin")}>
                  <Text style={styles.forgotLink}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={[
                styles.inputField, 
                isFocused === 'password' && styles.inputFieldActive
              ]}>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused(null)}
                  style={styles.textInput}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons 
                    name={showPassword ? "eye" : "eye-off"} 
                    size={20} 
                    color="#64748B" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.actionButton, loading && styles.actionButtonDisabled]} 
              onPress={handleLogin} 
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>
                {loading ? "AUTHENTICATING..." : "LOGIN"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Repositioned Footer Information */}
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
    backgroundColor: '#FFFFFF' 
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
    zIndex: -1,
  },
  dotGrid: {
    width: width,
    height: height,
    opacity: 0.15,
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: '#64748B',
    borderRadius: 1,
  },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: 32, 
    justifyContent: 'center',
    paddingVertical: 40 
  },
  headerSection: { 
    alignItems: 'center', 
    marginBottom: 48 
  },
  logoContainer: {
    width: 64,
    height: 64,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: { width: '100%', height: '100%' },
  brandTitle: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#0F172A', 
    letterSpacing: 4 
  },
  titleUnderline: {
    width: 24,
    height: 3,
    backgroundColor: colors.primary,
    marginTop: 8
  },
  formContainer: {
    width: '100%'
  },
  textHeader: {
    marginBottom: 32
  },
  welcomeText: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#0F172A', 
    letterSpacing: -1
  },
  instructionText: { 
    fontSize: 15, 
    color: '#64748B', 
    marginTop: 4 
  },
  inputGroup: { 
    marginBottom: 24 
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  fieldLabel: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#94A3B8', 
    marginBottom: 8, 
    letterSpacing: 1.5
  },
  inputField: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 4, 
    paddingHorizontal: 16, 
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  inputFieldActive: {
    borderColor: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  textInput: { 
    flex: 1, 
    fontSize: 15, 
    color: '#0F172A', 
    fontWeight: '500'
  },
  forgotLink: { 
    color: colors.primary, 
    fontWeight: '800', 
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 8
  },
  actionButton: { 
    backgroundColor: '#0F172A', 
    height: 56, 
    borderRadius: 4, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 16,
  },
  actionButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  actionButtonText: { 
    color: '#FFFFFF', 
    fontSize: 13, 
    fontWeight: '900', 
    letterSpacing: 2
  },
  footerInfo: {
    position: 'absolute', // Fixed at bottom
    bottom: 50,           // 50px from bottom
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionLabel: { 
    color: '#94A3B8', 
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 10
  }
});