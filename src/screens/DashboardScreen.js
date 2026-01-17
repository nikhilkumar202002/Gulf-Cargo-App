import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  RefreshControl, StatusBar, ActivityIndicator 
} from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getProfile } from '../api/auth'; 
import { getCargoList } from '../services/cargoService'; //
import { useUser } from '../context/UserContext'; 
import colors from '../styles/colors'; 

export default function DashboardScreen({ navigation }) {
  const { userData, setUserData } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentCargos, setRecentCargos] = useState([]); // State for list

  // Stats Data (Static for now, can be connected to API meta later)
  const stats = {
    cargos: 124,
    customers: 45,
  };

  const fetchDashboardData = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        // 1. Fetch Profile
        const profileRes = await getProfile();
        const user = profileRes.data.user || profileRes.data.data;

        if (user) {
            setUserData({
                user: user,
                name: user.name,
                branchName: user.branch?.name,
                email: user.email,
                profilePic: user.profile_pic,
                role: user.role?.name
            });
        }

        // 2. Fetch Latest Cargos (Page 1)
        const cargoRes = await getCargoList(1);
        const list = cargoRes.data.data || cargoRes.data || [];
        
        // Slice top 5
        setRecentCargos(list.slice(0, 5));

    } catch (error) {
        console.log('Dashboard Fetch Error:', error);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // --- COMPONENT: Action Button ---
  const ActionButton = ({ icon, label, color, bg, onPress }) => (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: bg }]} onPress={onPress}>
        <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>
            <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.actionLabel, { color: color }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        
        {/* 1. Stats Grid */}
        <View style={styles.statsContainer}>
            <View style={styles.statCard}>
                <View style={[styles.iconBox, { backgroundColor: '#e5e7ff' }]}>
                    <MaterialCommunityIcons name="truck-delivery" size={24} color={colors.secondary} />
                </View>
                <View>
                    <Text style={styles.statNumber}>{stats.cargos}</Text>
                    <Text style={styles.statLabel}>Total Cargos</Text>
                </View>
            </View>

            <View style={styles.statCard}>
                <View style={[styles.iconBox, { backgroundColor: '#ffe5e5' }]}>
                    <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
                </View>
                <View>
                    <Text style={styles.statNumber}>{stats.customers}</Text>
                    <Text style={styles.statLabel}>Customers</Text>
                </View>
            </View>
        </View>

        {/* 2. Quick Actions (Track Widget Removed) */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
                {/* 48% Width to fill space evenly since we removed the 3rd button */}
                <View style={{ width: '48%' }}>
                    <ActionButton 
                        icon="plus-box" 
                        label="New Shipment" 
                        color="#fff" 
                        bg={colors.primary} 
                        onPress={() => navigation.navigate('Cargo')} 
                    />
                </View>
                <View style={{ width: '48%' }}>
                    <ActionButton 
                        icon="file-document-outline" 
                        label="View History" 
                        color={colors.secondary} 
                        bg="#eef2ff" 
                        onPress={() => navigation.navigate('History')} 
                    />
                </View>
            </View>
        </View>

        {/* 3. Recent Activity (Latest 5 Cargos) */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Shipments</Text>
                <TouchableOpacity onPress={() => navigation.navigate('History')}>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>

            {loading && recentCargos.length === 0 ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                recentCargos.map((item, index) => {
                    const senderName = item.sender?.name || item.sender_name || 'N/A';
                    const receiverName = item.receiver?.name || item.receiver_name || 'N/A';
                    const amount = item.net_total || item.total_amount || '0.00';

                    return (
                        <View key={item.id || index} style={styles.recentItem}>
                            {/* Color Bar based on index just for visual variety */}
                            <View style={[styles.statusIndicator, { backgroundColor: index % 2 === 0 ? '#10b981' : '#3b82f6' }]} />
                            
                            <View style={{flex: 1, marginLeft: 12}}>
                                <Text style={styles.recentId}>
                                    {item.booking_no ? item.booking_no : `#${item.id}`}
                                </Text>
                                {/* Displaying Parties Name */}
                                <Text style={styles.partiesText} numberOfLines={1}>
                                    {senderName} <MaterialCommunityIcons name="arrow-right" size={12} color="#999" /> {receiverName}
                                </Text>
                            </View>
                            
                            <Text style={styles.recentAmount}>{amount} SAR</Text>
                        </View>
                    );
                })
            )}

            {!loading && recentCargos.length === 0 && (
                <Text style={{color: '#999', textAlign: 'center', marginTop: 10}}>No recent shipments found.</Text>
            )}

        </View>

        <View style={{height: 30}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: '#fff',
    width: '48%',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  seeAllText: {
    color: colors.primary, 
    fontWeight: '600',
    fontSize: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: '100%', // Changed to fill the 48% container
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  recentItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  recentId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  partiesText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  recentAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.secondary, 
  },
});