import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  RefreshControl, StatusBar, Alert, Platform, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
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
import SkeletonLoader from '../components/SkeletonLoader';

export default function DashboardScreen({ navigation }) {
  const { userData, setUserData } = useUser();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentCargos, setRecentCargos] = useState([]);

  const numColumns = width > 600 ? 3 : 2;

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

        // Get branch ID for filtering cargo counts (use the fresh user data)
        const branchId = user?.branch_id || user?.branch?.id;
        const isSuperAdmin = (user?.role_id || user?.role?.id) === 1;

        // 2. Fetch stats using allSettled to prevent total failure
        const results = await Promise.allSettled([
            getShipmentCounts(), 
            getSenderCount(),    
            getReceiverCount(),  
            getBranchCounts(),   
            getCargoList(1, isSuperAdmin ? null : branchId),     
        ]);

        const extract = (index) => results[index].status === 'fulfilled' ? results[index].value.data : null;

        const shipData = extract(0);
        const senderData = extract(1);
        const receiverData = extract(2);
        const branchData = extract(3);
        const cargoListData = extract(4);

        setStats({
            shipments: shipData?.total_count || shipData?.data?.total_count || 0,
            consignees: senderData?.count || senderData?.data?.count || 0,
            receivers: receiverData?.count || receiverData?.data?.count || 0,
            staff: 17, 
            branches: branchData?.active_count || branchData?.data?.active_count || 0,
            delivery: 40,
            // Use total from cargo list API instead of separate cargo-counts endpoint
            cargos: cargoListData?.total_cargos || cargoListData?.pagination?.total_items || cargoListData?.data?.length || 0,
            clearance: 1
        });

        const list = cargoListData?.data || cargoListData || [];
        setRecentCargos(Array.isArray(list) ? list.slice(0, 5) : []);

    } catch (error) {
        // Use mock data for development when API is unavailable
        setStats({
            shipments: 25,
            consignees: 12,
            receivers: 8,
            staff: 17,
            branches: 3,
            delivery: 40,
            cargos: 15,
            clearance: 1
        });
        setRecentCargos([
            { id: 1, booking_no: 'RUH:811096', sender_name: 'Nikhil Kumar S', receiver_name: 'Vyga Suresh', net_total: '44.00' },
            { id: 2, booking_no: 'RUH:811095', sender_name: 'Alice', receiver_name: 'Bob', net_total: '144.00' },
            { id: 3, booking_no: 'RUH:811094', sender_name: 'John Smith', receiver_name: 'Sarah Wilson', net_total: '220.50' },
            { id: 4, booking_no: 'RUH:811093', sender_name: 'Ahmed Hassan', receiver_name: 'Fatima Khan', net_total: '180.75' },
            { id: 5, booking_no: 'RUH:811092', sender_name: 'Michael Brown', receiver_name: 'Emma Davis', net_total: '320.25' },
        ]);
        Alert.alert("Using Demo Data", "API unavailable, showing sample data.");
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  // Full-screen Loader for initial load (Optimized for iOS)
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <SkeletonLoader variant="dashboard" />
      </SafeAreaView>
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
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9F9" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchDashboardData();}} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.pageEyebrow}>Dashboard</Text>
            <Text style={styles.pageHeader}>Overview</Text>
          </View>
          <View style={styles.branchBadge}>
            <MaterialCommunityIcons name="office-building-marker-outline" size={16} color={colors.secondary} />
            <Text style={styles.branchBadgeText} numberOfLines={1}>
              {userData?.branchName || userData?.branch?.name || userData?.user?.branch?.name || 'Gulf Cargo'}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
            {displayedWidgets.map((widget) => (
                <View key={widget.id} style={[styles.statCard, { width: `${100 / numColumns - 2}%` }]}>
                    <View style={styles.cardTop}>
                        <View style={[styles.iconWrapper, { backgroundColor: widget.color + '10' }]}>
                            <MaterialCommunityIcons name={widget.icon} size={18} color={widget.color} />
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
                    style={[styles.actionBtn]} 
                    onPress={() => navigation.navigate('Create Cargo')}
                >
                    <LinearGradient
                        colors={['#262262', '#443DAF']}
                        style={styles.actionBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <MaterialCommunityIcons name="plus" size={19} color="#FFF" />
                        <Text style={styles.actionBtnText}>Create Cargo</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }]} 
                    onPress={() => navigation.navigate('History')}
                >
                    <MaterialCommunityIcons name="history" size={18} color="#0F172A" />
                    <Text style={[styles.actionBtnText, { color: '#0F172A' }]}>Cargo History</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Recent Cargos */}
        <View style={styles.section}>
            <View style={styles.activityHeader}>
                <Text style={styles.recentTitle}>Recent Cargos</Text>
                <TouchableOpacity onPress={() => navigation.navigate('History')}>
                    <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
            </View>

            {recentCargos.map((item, index) => (
                <View key={item.id || index} style={styles.cargoCard}>
                    <View style={styles.cardLeftBorder} />
                    <View style={styles.cardInner}>
                        <View style={styles.cardTopRow}>
                            <View style={styles.bookingPill}>
                              <MaterialCommunityIcons name="file-document-outline" size={13} color={colors.secondary} />
                              <Text style={styles.cardBookingNo}>{item.booking_no || `#${item.id}`}</Text>
                            </View>
                            <Text style={styles.cardPrice}>{item.net_total || '0.00'} <Text style={styles.cardCurrency}>SAR</Text></Text>
                        </View>
                        <View style={styles.cardBottomRow}>
                            <Text style={styles.cardParties} numberOfLines={1}>
                                {item.sender?.name || item.sender_name} ⟶ {item.receiver?.name || item.receiver_name}
                            </Text>
                        </View>
                    </View>
                </View>
            ))}
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 110 : 96 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pageEyebrow: { fontSize: 11, color: colors.primary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'InstrumentSans-Regular' },
  pageHeader: { fontSize: 19, fontWeight: '700', color: '#111827', marginTop: 1, fontFamily: 'InstrumentSans-Semibold' },
  branchBadge: { maxWidth: '52%', height: 34, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 9, borderWidth: 1, borderColor: '#E0E7FF' },
  branchBadgeText: { marginLeft: 5, fontSize: 11, color: colors.secondary, fontWeight: '700', fontFamily: 'InstrumentSans-Regular' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    marginHorizontal: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconWrapper: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827', fontFamily: 'InstrumentSans-Regular' },
  statLabel: { fontSize: 11, color: '#475569', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.2, fontFamily: 'InstrumentSans-Semibold' },
  section: { marginTop: 14, marginBottom: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 8, textTransform: 'capitalize', fontFamily: 'InstrumentSans-Regular' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  actionBtn: { 
    flex: 1, height: 46, borderRadius: 10, flexDirection: 'row', 
    alignItems: 'center', justifyContent: 'center'
  },
  actionBtnGradient: {
    flex: 1, height: 46, borderRadius: 10, flexDirection: 'row', 
    alignItems: 'center', justifyContent: 'center'
  },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 7, fontFamily: 'InstrumentSans-Regular' },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  recentTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#111827', 
    fontFamily: 'InstrumentSans-Regular' 
  },
  viewAllText: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#3F39A3', 
    fontFamily: 'InstrumentSans-Regular' 
  },
  cargoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardLeftBorder: {
    width: 3,
    backgroundColor: '#E53935',
  },
  cardInner: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookingPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, maxWidth: '58%' },
  cardBookingNo: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: colors.secondary, 
    marginLeft: 4,
    fontFamily: 'InstrumentSans-Regular' 
  },
  cardPrice: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#E53935', 
    fontFamily: 'InstrumentSans-Regular' 
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardParties: { 
    fontSize: 12, 
    color: '#9CA3AF', 
    fontFamily: 'InstrumentSans-Regular',
    flex: 1,
    paddingRight: 10,
  },
  cardCurrency: { 
    fontSize: 10, 
    color: '#9CA3AF', 
    fontFamily: 'InstrumentSans-Regular' 
  },
});
