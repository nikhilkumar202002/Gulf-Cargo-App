import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native'; // Use View instead of SafeAreaView
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getStaffDetails } from '../api/auth'; 
import { useUser } from '../context/UserContext'; 
import styles from '../styles/screenStyles';
import colors from '../styles/colors';

export default function DashboardScreen() {
  const { setUserData } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const userId = storedUserId || '10'; 
      const staffResponse = await getStaffDetails(userId);
      const staff = staffResponse.data.user; 

      if (staff) {
        setUserData({
          name: staff.name || 'Unknown User',
          branchName: staff.branch?.name || 'No Branch Assigned', 
          email: staff.email,
          profilePic: staff.profile_pic 
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // FIX: Use View instead of SafeAreaView to remove top gap
    <View style={{ flex: 1}}>

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

        {/* Card 2: Total Customers (Fixed Label/Icon) */}
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
    </View>
  );
}