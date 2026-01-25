import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, 
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { login, getProfile } from '../api/auth'; 
import { useUser } from '../context/UserContext'; 
import colors from '../styles/colors';

const APP_VERSION = "v1.0.2"; 
const { height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) { 
  const { setUserData } = useUser(); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

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
      <View style={styles.topSection}>
         <View style={styles.logoContainer}>
            <Image 
                source={require('../../assets/Logo.png')} 
                style={styles.logo} 
                resizeMode="contain" 
            />
         </View>
         <Text style={styles.brandTitle}>GULF CARGO</Text>
         <Text style={styles.brandTagline}>Logistics Management System</Text>
      </View>

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
                    <Text style={styles.inputLabel}>Email</Text>
                    {/* CHANGED div TO View HERE */}
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

                    <Text style={styles.inputLabel}>Password</Text>
                    {/* CHANGED div TO View HERE */}
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

                    <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                        <Text style={styles.loginBtnText}>{loading ? "Processing..." : "Secure Login"}</Text>
                    </TouchableOpacity>

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
  mainContainer: { flex: 1, backgroundColor: colors.secondary },
  topSection: { height: height * 0.35, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },
  logoContainer: { width: 80, height: 80, marginBottom: 15, backgroundColor: '#fff', borderRadius: 20, padding: 10, elevation: 5 },
  logo: { width: '100%', height: '100%' },
  brandTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  brandTagline: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 5 },
  bottomSection: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 40, paddingBottom: 20 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  instructionText: { fontSize: 14, color: '#6b7280', marginBottom: 30 },
  formArea: { width: '100%' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 15, height: 55, marginBottom: 20 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1f2937', height: '100%' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 25, marginTop: -5 },
  forgotText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  loginBtn: { backgroundColor: colors.primary, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  footerContainer: { marginTop: 40, alignItems: 'center' },
  versionText: { color: '#9ca3af', fontSize: 12 }
});