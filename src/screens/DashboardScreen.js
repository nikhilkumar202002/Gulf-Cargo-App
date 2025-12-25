import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getProfile } from '../api/auth'; // Switch to getProfile
import { useUser } from '../context/UserContext'; 
import styles from '../styles/screenStyles';
import colors from '../styles/colors';

export default function DashboardScreen() {
  const { userData, setUserData } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initDashboard = async () => {
        // 1. Check if Context already has data
        if (userData && userData.name) {
            setLoading(false);
            return;
        }
        
        // 2. If not, try to fetch fresh profile
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return; // Stay on loading or redirect

            console.log('Dashboard: Fetching fresh profile...');
            const response = await getProfile(); //
            const user = response.data.user || response.data.data;

            if (user) {
                setUserData({
                    user: user, // Store full object
                    name: user.name,
                    branchName: user.branch?.name,
                    email: user.email,
                    profilePic: user.profile_pic,
                    role: user.role?.name
                });
            }
        } catch (error) {
            console.log('Dashboard Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    initDashboard();
  }, []);

  return (
    <View style={{ flex: 1}}>
      <View style={styles.statsContainer}>
        {/* Card 1 */}
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#ffe5e5' }]}>
            <MaterialCommunityIcons name="truck-delivery" size={28} color={colors.primary} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statLabel}>Total Cargos</Text>
            <Text style={styles.statCount}>124</Text> 
          </View>
        </View>

        {/* Card 2 */}
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