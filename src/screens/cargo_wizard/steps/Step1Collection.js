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
    setLoading(true);
    try {
      const response = await getActiveCollectedBy();
      const list = response?.data?.data || response?.data || [];
      setRolesList(list);
    } catch (error) {
      // Silently handle fetch errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionEyebrow}>Cargo Intake</Text>
          <Text style={styles.sectionHeader}>Collection Details</Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="truck-fast-outline" size={22} color="#fff" />
        </View>
      </View>
      
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
            <View style={[styles.iconBox, styles.branchIcon]}>
                <MaterialCommunityIcons name="office-building-marker-outline" size={21} color="#34339A" />
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Branch</Text>
                <Text style={styles.infoValue}>{data.branch_name || 'Gulf Cargo KSA Riyadh'}</Text>
            </View>
        </View>
        
        <View style={styles.dividerWrapper}><View style={styles.divider} /></View>

        <View style={styles.infoRow}>
            <View style={[styles.iconBox, styles.dateIcon]}>
                <MaterialCommunityIcons name="calendar-clock-outline" size={21} color="#EF4444" />
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>
                    {data.date instanceof Date ? data.date.toDateString() : new Date().toDateString()}
                </Text>
            </View>
        </View>
      </View>

      <View style={styles.questionHeader}>
        <View style={styles.questionIcon}>
          <MaterialCommunityIcons name="account-check-outline" size={18} color="#EF4444" />
        </View>
        <Text style={styles.questionTitle}>Who collected this cargo?</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Collected by</Text>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setRoleModalVisible(true)} activeOpacity={0.8}>
            <View style={styles.dropdownContent}>
                <View style={styles.dropdownIconBox}>
                  <MaterialCommunityIcons name="account-tie-outline" size={21} color="#34339A" />
                </View>
                <View style={styles.dropdownTextBlock}>
                  <Text style={[styles.dropdownText, !data.collected_by && styles.placeholderText]} numberOfLines={1}>
                      {data.collected_by ? data.collected_by.name : 'Select Collector'}
                  </Text>
                  <Text style={styles.dropdownHint}>Assigned collection staff</Text>
                </View>
            </View>
            {loading ? <ActivityIndicator size="small" color="#34339A"/> : <MaterialCommunityIcons name="chevron-down" size={24} color="#111827" />}
        </TouchableOpacity>
      </View>

      <BottomSheetSelect visible={roleModalVisible} title="Select Collector" data={rolesList} onClose={() => setRoleModalVisible(false)} onSelect={(role) => { update('collected_by', role); update('collected_by_id', role.id); }} />
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 4 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionEyebrow: { fontSize: 11, color: '#EF4444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2, fontFamily: 'InstrumentSans-Regular' },
    sectionHeader: { fontSize: 18, color: '#111827', fontWeight: 'bold', fontFamily: 'InstrumentSans-Bold' },
    headerIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#34339A', alignItems: 'center', justifyContent: 'center' },
    questionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    questionIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    questionTitle: { fontSize: 15, color: '#283891', fontWeight: 'bold', fontFamily: 'InstrumentSans-Bold' },
    infoCard: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 18, borderWidth: 1, borderColor: '#EEF2FF', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 38, height: 38, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    branchIcon: { backgroundColor: '#E0E7FF' },
    dateIcon: { backgroundColor: '#FEE2E2' },
    infoTextContainer: { flex: 1, justifyContent: 'center' },
    infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 1, fontFamily: 'InstrumentSans-Regular' },
    infoValue: { fontSize: 14, color: '#111827', fontWeight: '500', fontFamily: 'InstrumentSans-Regular' },
    dividerWrapper: { paddingLeft: 50 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 12, color: '#111827', marginBottom: 6, fontFamily: 'InstrumentSans-Regular' },
    dropdownBtn: { backgroundColor: '#fff', borderRadius: 12, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
    dropdownContent: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 8 },
    dropdownIconBox: { width: 36, height: 36, borderRadius: 9, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    dropdownTextBlock: { flex: 1 },
    dropdownText: { fontSize: 14, color: '#111827', fontWeight: '600', fontFamily: 'InstrumentSans-Regular' },
    dropdownHint: { fontSize: 11, color: '#9CA3AF', marginTop: 1, fontFamily: 'InstrumentSans-Regular' },
    placeholderText: { color: '#6B7280' },
});
