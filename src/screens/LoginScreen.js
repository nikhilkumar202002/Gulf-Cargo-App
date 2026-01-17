import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, 
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, SafeAreaView, Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { login, getProfile } from '../api/auth'; 
import { useUser } from '../context/UserContext'; 
import colors from '../styles/colors'; //

// App Version
const APP_VERSION = "v1.0.2"; 
const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) { 
  const { setUserData } = useUser(); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

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
        await AsyncStorage.setItem('userToken', token); 

        const profileResponse = await getProfile();
        const user = profileResponse.data.user || profileResponse.data.data;

        if (user && user.id) {
           await AsyncStorage.setItem('userId', String(user.id));
           await AsyncStorage.setItem('userData', JSON.stringify(user));

            setUserData({
                id: user.id,
                branch_id: user.branch?.id,
                branch: user.branch,
                branchName: user.branch?.name || 'No Branch',
                name: user.name,
                email: user.email,
                profilePic: user.profile_pic,
                role: user.role
            });

            navigation.replace('Dashboard'); 
        } else {
           throw new Error('User data missing.');
        }

      } else {
        Alert.alert('Login Failed', loginResponse.data.message || 'Invalid credentials');
      }

    } catch (error) {
      console.log('Login Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      
      {/* 1. Top Brand Section */}
      <View style={styles.topSection}>
         <View style={styles.logoContainer}>
            {/* Make sure logo.png exists in assets */}
            <Image 
                source={require('../../assets/Logo.png')} 
                style={styles.logo} 
                resizeMode="contain" 
            />
         </View>
         <Text style={styles.brandTitle}>GULF CARGO</Text>
         <Text style={styles.brandTagline}>Logistics Management System</Text>
      </View>

      {/* 2. Bottom White Panel (Form) */}
      <View style={styles.bottomSection}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.instructionText}>Please sign in to continue</Text>

                <View style={styles.formArea}>
                    
                    {/* Email Input */}
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="email" size={20} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            placeholder="name@gulfcargo.com"
                            placeholderTextColor="#d1d5db"
                            value={email}
                            onChangeText={setEmail}
                            style={styles.input}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    {/* Password Input */}
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="lock" size={20} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            placeholder="••••••••"
                            placeholderTextColor="#d1d5db"
                            value={password}
                            onChangeText={setPassword}
                            style={styles.input}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <MaterialCommunityIcons 
                                name={showPassword ? "eye" : "eye-off"} 
                                size={20} 
                                color="#9ca3af" 
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={styles.forgotBtn} 
                        onPress={() => Alert.alert("Reset Password", "Please contact Admin.")}
                    >
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                        {loading ? (
                            <Text style={styles.loginBtnText}>Processing...</Text>
                        ) : (
                            <Text style={styles.loginBtnText}>Secure Login</Text>
                        )}
                    </TouchableOpacity>

                    {/* Version Footer inside ScrollView */}
                    <View style={styles.footerContainer}>
                         <Text style={styles.versionText}>Version {APP_VERSION}</Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.secondary, // Professional Blue Background for top
  },

  // --- TOP SECTION ---
  topSection: {
    height: height * 0.35, // Takes top 35% of screen
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },

  // --- BOTTOM SECTION ---
  bottomSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden', // Ensures content respects the curved corners
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 30,
  },

  // --- FORM STYLES ---
  formArea: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6', // Very light gray for modern feel
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    height: '100%',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 25,
    marginTop: -5,
  },
  forgotText: {
    color: colors.primary, // Brand Red
    fontWeight: '600',
    fontSize: 13,
  },
  loginBtn: {
    backgroundColor: colors.primary, // Brand Red Button
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // --- FOOTER ---
  footerContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  versionText: {
    color: '#9ca3af',
    fontSize: 12,
  }
});