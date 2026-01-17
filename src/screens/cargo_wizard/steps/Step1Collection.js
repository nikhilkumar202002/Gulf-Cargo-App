import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getActiveCollectedBy, getAllCollectedBy } from '../../../services/coreServices'; 
import BottomSheetSelect from '../components/BottomSheetSelect'; 
import colors from '../../../styles/colors';
import { useUser } from '../../../context/UserContext'; 

export default function Step1Collection({ data, update }) {
  const { userData } = useUser(); 

  // Data State
  const [rolesList, setRolesList] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  // 1. Load Roles on Mount
  useEffect(() => {
    if (data.branch_id) {
        loadRoles();
    }
  }, [data.branch_id]);

  const loadRoles = async () => {
    setLoading(true);
    try {
        // 1. Try fetching Active Collected By for this Branch
        let response = await getActiveCollectedBy(data.branch_id);
        let list = response.data.data || response.data || [];
        
        // 2. Fallback: If empty, try getting ALL (helps if API logic varies)
        if (!Array.isArray(list) || list.length === 0) {
            console.log("⚠️ Active list empty, trying ALL...");
            response = await getAllCollectedBy();
            list = response.data.data || response.data || [];
        }

        if (Array.isArray(list)) {
            setRolesList(list); 
        } 
    } catch (e) {
        console.log("Error loading roles", e);
    } finally {
        setLoading(false);
    }
  };

  const handleRoleSelect = (role) => {
    update('collected_by', role);
  };

  return (
    <View style={styles.container}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
          <Text style={styles.mainTitle}>Collection Details</Text>
          <TouchableOpacity onPress={loadRoles} style={{padding:5}}>
            <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
      </View>
      
      {/* 1. Context Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
            <View style={styles.iconBox}>
                <MaterialCommunityIcons name="office-building" size={20} color={colors.secondary} />
            </View>
            <View>
                <Text style={styles.infoLabel}>Branch</Text>
                <Text style={styles.infoValue}>{data.branch_name || 'Loading...'}</Text>
            </View>
        </View>
        
        <View style={styles.divider} />

        <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: '#fff0f0' }]}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.primary} />
            </View>
            <View>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>
                    {data.date instanceof Date ? data.date.toDateString() : new Date().toDateString()}
                </Text>
            </View>
        </View>
      </View>

      {/* 2. Collection Form */}
      <Text style={styles.sectionTitle}>Who collected this cargo?</Text>

      {/* Role Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Collected By</Text>
        <TouchableOpacity 
            style={styles.dropdownBtn} 
            onPress={() => setRoleModalVisible(true)}
            activeOpacity={0.7}
        >
            <View style={styles.dropdownContent}>
                <MaterialCommunityIcons name="account-tie" size={22} color={colors.secondary} style={styles.dropdownIcon} />
                <Text style={[styles.dropdownText, !data.collected_by && styles.placeholderText]}>
                    {data.collected_by ? data.collected_by.name : 'Select Collector'}
                </Text>
            </View>
            {loading ? <ActivityIndicator size="small" color={colors.primary}/> : <MaterialCommunityIcons name="chevron-down" size={24} color="#aaa" />}
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <BottomSheetSelect 
        visible={roleModalVisible} 
        title="Select Collector" 
        data={rolesList} 
        onClose={() => setRoleModalVisible(false)} 
        onSelect={handleRoleSelect} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    mainTitle: { fontSize: 22, fontWeight: 'bold', color: colors.secondary, marginBottom: 20 },
    infoCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 30,
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5,
        borderWidth: 1, borderColor: '#f0f0f0',
    },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#eef2ff',
        justifyContent: 'center', alignItems: 'center', marginRight: 15,
    },
    infoLabel: { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 2, textTransform: 'uppercase' },
    infoValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 15 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 15 },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, marginLeft: 4 },
    dropdownBtn: {
        backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', height: 55,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15,
        elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
    },
    dropdownContent: { flexDirection: 'row', alignItems: 'center' },
    dropdownIcon: { marginRight: 10 },
    dropdownText: { fontSize: 15, color: '#333', fontWeight: '500' },
    placeholderText: { color: '#999', fontWeight: 'normal' },
});