import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, Alert } from 'react-native'; // <--- Added Text
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import styles from '../styles/screenStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../styles/colors';

import { getStaffDetails } from '../api/auth'; 

export default function DashboardScreen({ navigation }) {
  // Added profilePic to state
  const [userData, setUserData] = useState({ name: '', branchName: '', email: '', profilePic: null });
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    fetchHeaderData();
  }, []);

  const fetchHeaderData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const userId = storedUserId || '10'; 
      const staffResponse = await getStaffDetails(userId);
      const staff = staffResponse.data.user; 

      if (staff) {
        setUserData({
          name: staff.name || 'Unknown User',
          // FIX: Read branch directly from the nested object
          branchName: staff.branch?.name || 'No Branch Assigned', 
          email: staff.email,
          profilePic: staff.profile_pic // Get the image URL
        });
      }

    } catch (error) {
      console.error('Error fetching header data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header 
        userName={userData.name}
        branchName={userData.branchName}
        profilePic={userData.profilePic} // Pass the image
        user={userData} 
        onLogout={handleLogout}
        onAccountPress={() => Alert.alert('Account', 'Go to profile')}
      />

      <View style={styles.statsContainer}>
        
        {/* Card 1: Total Cargos */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#ffe5e5' }]}>
            <MaterialCommunityIcons name="truck-delivery" size={28} color={colors.primary} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Total Cargos</Text>
            <Text style={styles.statCount}>124</Text> 
          </View>
        </View>

        {/* Card 2: Total Customers */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#e5e7ff' }]}>
            <MaterialCommunityIcons name="account-group" size={28} color={colors.secondary} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Total Customers</Text>
            <Text style={styles.statCount}>45</Text>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}