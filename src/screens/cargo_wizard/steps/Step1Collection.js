import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getActiveCollectedBy, getAllCollectedBy } from '../../../services/coreServices'; 
import BottomSheetSelect from '../components/BottomSheetSelect'; 

export default function Step1Collection({ data, update }) {
  const [rolesList, setRolesList] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  useEffect(() => { if (data.branch_id) loadRoles(); }, [data.branch_id]);

  const loadRoles = async () => {
    // ... Keep existing load logic ...
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Collection Details</Text>
      
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                <MaterialCommunityIcons name="office-building" size={22} color="#4F46E5" />
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Branch</Text>
                <Text style={styles.infoValue}>{data.branch_name || 'Gulf Cargo KSA Riyadh'}</Text>
            </View>
        </View>
        
        <View style={styles.dividerWrapper}><View style={styles.divider} /></View>

        <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="calendar-blank" size={22} color="#EF4444" />
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>
                    {data.date instanceof Date ? data.date.toDateString() : new Date().toDateString()}
                </Text>
            </View>
        </View>
      </View>

      <Text style={styles.questionTitle}>Who Collected this Cargo?</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Collected by</Text>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setRoleModalVisible(true)} activeOpacity={0.8}>
            <View style={styles.dropdownContent}>
                <MaterialCommunityIcons name="account" size={24} color="#EF4444" style={styles.dropdownIcon} />
                <Text style={[styles.dropdownText, !data.collected_by && styles.placeholderText]}>
                    {data.collected_by ? data.collected_by.name : 'Select Collector'}
                </Text>
            </View>
            {loading ? <ActivityIndicator size="small" color="#34339A"/> : <MaterialCommunityIcons name="chevron-down" size={24} color="#111827" />}
        </TouchableOpacity>
      </View>

      <BottomSheetSelect visible={roleModalVisible} title="Select Collector" data={rolesList} onClose={() => setRoleModalVisible(false)} onSelect={(role) => { update('collected_by', role); update('collected_by_id', role.id); }} />
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 8 },
    sectionHeader: { fontSize: 16, color: '#111827', marginBottom: 16, fontWeight: '500', fontFamily: 'InstrumentSans-Regular' },
    questionTitle: { fontSize: 16, color: '#283891', marginBottom: 16, marginTop: 8, fontWeight: '500', fontFamily: 'InstrumentSans-Regular' },
    infoCard: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    infoTextContainer: { flex: 1, justifyContent: 'center' },
    infoLabel: { fontSize: 13, color: '#6B7280', marginBottom: 2, fontFamily: 'InstrumentSans-Regular' },
    infoValue: { fontSize: 16, color: '#111827', fontWeight: '500', fontFamily: 'InstrumentSans-Regular' },
    dividerWrapper: { paddingLeft: 60 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
    inputGroup: { marginBottom: 24 },
    inputLabel: { fontSize: 13, color: '#111827', marginBottom: 8, fontFamily: 'InstrumentSans-Regular' },
    dropdownBtn: { backgroundColor: '#fff', borderRadius: 12, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
    dropdownContent: { flexDirection: 'row', alignItems: 'center' },
    dropdownIcon: { marginRight: 12 },
    dropdownText: { fontSize: 15, color: '#111827', fontFamily: 'InstrumentSans-Regular' },
    placeholderText: { color: '#6B7280' },
});