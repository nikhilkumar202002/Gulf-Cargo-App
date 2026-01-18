import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  RefreshControl, StatusBar, ActivityIndicator, Alert 
} from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Make sure these paths match your project structure
import { getProfile } from '../api/auth'; 
import { getCargoList } from '../services/cargoService'; 
import { 
    getShipmentCounts, 
    getSenderCount, 
    getReceiverCount,
    getBranchCounts 
} from '../services/coreServices'; 
import { useUser } from '../context/UserContext'; 
import colors from '../styles/colors'; 

export default function DashboardScreen({ navigation }) {
  const { userData, setUserData } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentCargos, setRecentCargos] = useState([]); 

  // Stats State
  const [stats, setStats] = useState({
    shipments: 0,
    consignees: 0,
    receivers: 0,
    staff: 0,
    branches: 0,
    delivery: 0,
    cargos: 0,
    clearance: 0
  });

  const fetchDashboardData = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
            // Redirect to login if no token
            setLoading(false);
            return;
        }

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
                role_id: user.role_id || user.role?.id, 
                role: user.role?.name
            });
        }

        // 2. Fetch Counts (Parallel Requests)
        // If any of these fail, the catch block will trigger
        const [shipRes, senderRes, receiverRes, branchRes] = await Promise.all([
            getShipmentCounts(),
            getSenderCount(),
            getReceiverCount(),
            getBranchCounts()
        ]);

        setStats({
            shipments: shipRes.data?.total_count || 0,
            consignees: senderRes.data?.count || 0,
            receivers: receiverRes.data?.count || 0,
            staff: 17, // Static or fetch from API
            branches: branchRes.data?.active_count || 0,
            delivery: 40, // Static or fetch from API
            cargos: 1680, // Static or fetch from API
            clearance: 1  // Static or fetch from API
        });

        // 3. Fetch Latest Cargos
        const cargoRes = await getCargoList(1);
        const list = cargoRes.data.data || cargoRes.data || [];
        setRecentCargos(list.slice(0, 5));

    } catch (error) {
        console.log('Dashboard Fetch Error:', error);
        
        let errorMessage = "Unable to connect to the server.";
        
        // Handle specific Network Error
        if (error.message === "Network Error") {
             errorMessage = "Network Error: Cannot reach server.\n\n1. Check your internet.\n2. If using emulator, use '10.0.2.2' instead of 'localhost'.\n3. If using device, use your PC's IP address.";
        } else if (error.response) {
             // Server responded with a status code outside 2xx
             errorMessage = `Server Error: ${error.response.status} - ${error.response.data?.message || 'Unknown Error'}`;
        }

        Alert.alert("Connection Failed", errorMessage);
        
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

  // --- ROLE BASED LOGIC ---
  const userRoleId = userData?.user?.role_id || userData?.role_id || 0;
  const isSuperAdmin = userRoleId === 1;

  const allWidgets = [
    { id: 'shipments', label: 'Total Shipments', value: stats.shipments, icon: 'truck-check', color: '#dc2626' },
    { id: 'consignees', label: 'Total Consignees', value: stats.consignees, icon: 'email', color: '#dc2626' },
    { id: 'receivers', label: 'Total Receivers', value: stats.receivers, icon: 'account-check', color: '#dc2626' },
    { id: 'staff', label: 'Total Staff', value: stats.staff, icon: 'account-group', color: '#dc2626' },
    { id: 'branches', label: 'Total Branches', value: stats.branches, icon: 'office-building', color: '#dc2626' },
    { id: 'delivery', label: 'Out for Delivery', value: stats.delivery, icon: 'truck-fast', color: '#dc2626' },
    { id: 'cargos', label: 'Total Cargos', value: stats.cargos, icon: 'package-variant', color: '#dc2626' },
    { id: 'clearance', label: 'Waiting Clearance', value: stats.clearance, icon: 'clock-alert', color: '#dc2626' },
  ];

  const displayedWidgets = isSuperAdmin 
    ? allWidgets 
    : allWidgets.filter(widget => ['consignees', 'receivers', 'cargos'].includes(widget.id));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Render Grid */}
        <View style={styles.statsGrid}>
            {displayedWidgets.map((widget, index) => (
                <View 
                    key={widget.id} 
                    style={[
                        styles.statCard, 
                        // Fix layout for odd number of items
                        (!isSuperAdmin && index === displayedWidgets.length - 1 && displayedWidgets.length % 2 !== 0) 
                        ? { width: '100%' } 
                        : {} 
                    ]}
                >
                    <View style={[styles.iconBox, { backgroundColor: widget.color }]}>
                        <MaterialCommunityIcons name={widget.icon} size={22} color="#fff" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.statNumber}>
                            {loading ? '-' : widget.value}
                        </Text>
                        <Text style={styles.statLabel} numberOfLines={1}>
                            {widget.label}
                        </Text>
                    </View>
                </View>
            ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Cargo')}>
                    <MaterialCommunityIcons name="plus-box" size={24} color="#fff" />
                    <Text style={[styles.actionLabel, { color: '#fff', marginTop: 5 }]}>New Shipment</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#eef2ff' }]} onPress={() => navigation.navigate('History')}>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.secondary} />
                    <Text style={[styles.actionLabel, { color: colors.secondary, marginTop: 5 }]}>View History</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Recent Activity */}
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
                recentCargos.map((item, index) => (
                    <View key={item.id || index} style={styles.recentItem}>
                        <View style={[styles.statusIndicator, { backgroundColor: index % 2 === 0 ? '#10b981' : '#3b82f6' }]} />
                        <View style={{flex: 1, marginLeft: 12}}>
                            <Text style={styles.recentId}>
                                {item.booking_no ? item.booking_no : `#${item.id}`}
                            </Text>
                            <Text style={styles.partiesText} numberOfLines={1}>
                                {item.sender?.name || 'N/A'} <MaterialCommunityIcons name="arrow-right" size={12} color="#999" /> {item.receiver?.name || 'N/A'}
                            </Text>
                        </View>
                        <Text style={styles.recentAmount}>{item.net_total || '0.00'} SAR</Text>
                    </View>
                ))
            )}
            
            {/* Show error message if not loading but no data */}
            {!loading && recentCargos.length === 0 && (
                <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>
                    No recent shipments or server is unreachable.
                </Text>
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
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    width: '48%', 
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800', 
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500'
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
    width: '48%', 
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
    height: 35,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.secondary, 
  },
});