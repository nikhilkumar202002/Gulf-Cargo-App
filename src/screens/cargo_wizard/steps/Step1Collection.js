import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getActiveCollectedBy } from '../../../services/coreServices'; 
import BottomSheetSelect from '../components/BottomSheetSelect'; 
import colors from '../../../styles/colors';
import { useUser } from '../../../context/UserContext'; 

export default function Step1Collection({ data, update }) {
  const { userData } = useUser(); 

  // Data State
  const [rolesList, setRolesList] = useState([]); 
  const [peopleList, setPeopleList] = useState([]);
  
  // Selection State
  const [selectedRole, setSelectedRole] = useState(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [personModalVisible, setPersonModalVisible] = useState(false);

  // 1. Load Roles on Mount
  useEffect(() => {
    if (data.branch_id) {
        loadRoles();
    }
  }, [data.branch_id]);

  const loadRoles = async () => {
    setLoading(true);
    try {
        const response = await getActiveCollectedBy(data.branch_id);
        const list = response.data.data || response.data;
        
        if (Array.isArray(list)) {
            setRolesList(list); 
        } 
    } catch (e) {
        console.log("Error loading roles", e);
    } finally {
        setLoading(false);
    }
  };

  // 2. Handle Role Selection
  const handleRoleSelect = (role) => {
    setSelectedRole(role);

    // --- FIX IS HERE ---
    if (role.name && role.name.toLowerCase() === 'office') {
        
        // We must use role.id (e.g. 1), NOT userData.id
        // We create a "hybrid" object that has the valid ID but shows the User's name
        const officeCollector = {
            id: role.id, // <--- CRITICAL: Use the ID from the API list (Valid Collector ID)
            name: `${role.name} (${userData.name})`, // Visual Name
            type: 'office'
        };

        console.log("Auto-selecting Office:", officeCollector);

        update('collected_by', officeCollector);
        setPeopleList([officeCollector]); // Show in the second dropdown for clarity
        
    } else {
        // For Drivers/Others, reset and force them to pick a person
        update('collected_by', null);
        setPeopleList([]); 
        // TODO: If you have an API to fetch drivers for a role, call it here.
    }
  };

  return (
    <View>
      <Text style={styles.stepTitle}>Collection Details</Text>
      
      {/* Branch & Date Info */}
      <View style={styles.card}>
        <Text style={styles.label}>Branch</Text>
        <Text style={styles.value}>{data.branch_name || 'Loading...'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>
            {data.date instanceof Date ? data.date.toDateString() : new Date().toDateString()}
        </Text>
      </View>

      <Text style={styles.sectionHeader}>Who collected the cargo?</Text>

      {/* 1. SELECT ROLE */}
      <Text style={styles.label}>1. Select Role</Text>
      <TouchableOpacity 
        style={[styles.selectButton, { marginBottom: 15 }]} 
        onPress={() => setRoleModalVisible(true)}
      >
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialCommunityIcons name="briefcase-account" size={24} color={colors.secondary} style={{marginRight: 10}} />
            <Text style={styles.selectText}>
                {selectedRole ? selectedRole.name : 'Select Role (e.g. Office)'}
            </Text>
         </View>
         {loading ? <ActivityIndicator size="small" color={colors.primary}/> : <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />}
      </TouchableOpacity>

      {/* 2. SELECT PERSON */}
      <Text style={styles.label}>2. Select Person</Text>
      <TouchableOpacity 
        style={[
            styles.selectButton, 
            (!selectedRole) && { backgroundColor: '#f9f9f9', opacity: 0.6 }
        ]} 
        onPress={() => {
            if (selectedRole) setPersonModalVisible(true);
            else Alert.alert("Select Role", "Please select a role first.");
        }}
        disabled={!selectedRole}
      >
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialCommunityIcons name="account" size={24} color={data.collected_by ? colors.secondary : '#ccc'} style={{marginRight: 10}} />
            <Text style={[styles.selectText, !data.collected_by && { color: '#999' }]}>
                {data.collected_by ? data.collected_by.name : 'Select Person'}
            </Text>
         </View>
         <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
      </TouchableOpacity>

      {/* Modals */}
      <BottomSheetSelect 
        visible={roleModalVisible} 
        title="Select Role" 
        data={rolesList} 
        onClose={() => setRoleModalVisible(false)} 
        onSelect={handleRoleSelect} 
      />
      
      <BottomSheetSelect 
        visible={personModalVisible} 
        title="Select Person" 
        data={peopleList} 
        onClose={() => setPersonModalVisible(false)} 
        onSelect={(item) => update('collected_by', item)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
    stepTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: colors.secondary },
    card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
    label: { fontSize: 10, color: '#888', marginBottom: 4, fontWeight: 'bold', textTransform: 'uppercase' },
    value: { fontSize: 16, fontWeight: '600', color: '#333' },
    sectionHeader: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
    selectButton: { backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selectText: { fontSize: 16, color: '#333' }
});