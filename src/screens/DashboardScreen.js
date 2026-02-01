import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  RefreshControl, StatusBar, ActivityIndicator, Alert, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

  const [stats, setStats] = useState({
    shipments: 0, consignees: 0, receivers: 0, staff: 17,
    branches: 0, delivery: 40, cargos: 0, clearance: 1
  });

  const fetchDashboardData = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        // 1. Fetch Profile first to determine permissions
        const profileRes = await getProfile();
        const user = profileRes.data.user || profileRes.data.data;
        if (user) {
            setUserData({ ...user, role_id: user.role_id || user.role?.id });
        }

        // 2. Fetch stats using allSettled to prevent total failure
        const results = await Promise.allSettled([
            getShipmentCounts(), 
            getSenderCount(),    
            getReceiverCount(),  
            getBranchCounts(),   
            getCargoList(1),     
        ]);

        const extract = (index) => results[index].status === 'fulfilled' ? results[index].value.data : null;

        const shipData = extract(0);
        const senderData = extract(1);
        const receiverData = extract(2);
        const branchData = extract(3);
        const cargoData = extract(4);

        setStats({
            shipments: shipData?.total_count || shipData?.data?.total_count || 0,
            consignees: senderData?.count || senderData?.data?.count || 0,
            receivers: receiverData?.count || receiverData?.data?.count || 0,
            staff: 17, 
            branches: branchData?.active_count || branchData?.data?.active_count || 0,
            delivery: 40,
            cargos: cargoData?.meta?.total || cargoData?.total || 0,
            clearance: 1
        });

        const list = cargoData?.data || cargoData || [];
        setRecentCargos(Array.isArray(list) ? list.slice(0, 5) : []);

    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        Alert.alert("Sync Error", "Some dashboard data could not be refreshed.");
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  // Full-screen Loader for initial load (Optimized for iOS)
  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Synchronizing Data...</Text>
      </View>
    );
  }

  const isSuperAdmin = (userData?.user?.role_id || userData?.role_id) === 1;

  const allWidgets = [
    { id: 'shipments', label: 'SHIPMENTS', value: stats.shipments, icon: 'truck-delivery', color: '#4F46E5' },
    { id: 'consignees', label: 'CONSIGNEES', value: stats.consignees, icon: 'account-arrow-right', color: '#10B981' },
    { id: 'receivers', label: 'RECEIVERS', value: stats.receivers, icon: 'account-arrow-left', color: '#F59E0B' },
    { id: 'staff', label: 'TOTAL STAFF', value: stats.staff, icon: 'account-group', color: '#6366F1' },
    { id: 'branches', label: 'BRANCHES', value: stats.branches, icon: 'office-building', color: '#8B5CF6' },
    { id: 'delivery', label: 'IN TRANSIT', value: stats.delivery, icon: 'truck-fast', color: '#EC4899' },
    { id: 'cargos', label: 'TOTAL CARGOS', value: stats.cargos, icon: 'package-variant-closed', color: '#F43F5E' },
    { id: 'clearance', label: 'CLEARANCE', value: stats.clearance, icon: 'clock-check', color: '#06B6D4' },
  ];

  const displayedWidgets = isSuperAdmin 
    ? allWidgets 
    : allWidgets.filter(widget => ['consignees', 'receivers', 'cargos'].includes(widget.id));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchDashboardData();}} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageHeader}>Overview</Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
            {displayedWidgets.map((widget) => (
                <View key={widget.id} style={styles.statCard}>
                    <View style={styles.cardTop}>
                        <View style={[styles.iconWrapper, { backgroundColor: widget.color + '10' }]}>
                            <MaterialCommunityIcons name={widget.icon} size={20} color={widget.color} />
                        </View>
                        <Text style={styles.statValue}>{widget.value}</Text>
                    </View>
                    <Text style={styles.statLabel}>{widget.label}</Text>
                </View>
            ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionRow}>
                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#0F172A' }]} 
                    onPress={() => navigation.navigate('Cargo')}
                >
                    <MaterialCommunityIcons name="plus" size={22} color="#FFF" />
                    <Text style={styles.actionBtnText}>CREATE CARGO</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }]} 
                    onPress={() => navigation.navigate('History')}
                >
                    <MaterialCommunityIcons name="history" size={20} color="#0F172A" />
                    <Text style={[styles.actionBtnText, { color: '#0F172A' }]}>HISTORY</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
            <View style={styles.activityHeader}>
                <Text style={styles.sectionTitle}>Recent Shipments</Text>
                <TouchableOpacity onPress={() => navigation.navigate('History')}>
                    <Text style={styles.seeAllText}>View All</Text>
                </TouchableOpacity>
            </View>

            {recentCargos.map((item, index) => (
                <View key={item.id || index} style={styles.activityRow}>
                    <View style={styles.activityIndicator} />
                    <View style={styles.activityContent}>
                        <Text style={styles.bookingNo}>{item.booking_no || `#${item.id}`}</Text>
                        <Text style={styles.bookingParties} numberOfLines={1}>
                            {item.sender?.name || item.sender_name} → {item.receiver?.name || item.receiver_name}
                        </Text>
                    </View>
                    <View style={styles.activityPrice}>
                        <Text style={styles.priceText}>{item.net_total || '0.00'}</Text>
                        <Text style={styles.currencyText}>SAR</Text>
                    </View>
                </View>
            ))}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  // Loader Styles
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  pageHeader: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 15, letterSpacing: -0.5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconWrapper: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  section: { marginTop: 10, marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 16, textTransform: 'uppercase' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { 
    flex: 1, height: 54, borderRadius: 12, flexDirection: 'row', 
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 4
  },
  actionBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12, marginLeft: 8, letterSpacing: 0.5 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAllText: { fontSize: 12, fontWeight: '800', color: '#4F46E5' },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
  },
  activityIndicator: { width: 4, height: 24, backgroundColor: '#E2E8F0', borderRadius: 2, marginRight: 12 },
  activityContent: { flex: 1 },
  bookingNo: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  bookingParties: { fontSize: 13, color: '#64748B', marginTop: 2 },
  activityPrice: { alignItems: 'flex-end' },
  priceText: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  currencyText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' }
});