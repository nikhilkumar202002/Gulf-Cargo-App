import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getActiveCollectedBy } from '../../../services/coreServices'; 
import BottomSheetSelect from '../components/BottomSheetSelect'; 
import colors from '../../../styles/colors';
import { useUser } from '../../../context/UserContext'; //

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
        console.log("🟢 1. useEffect Triggered. Branch ID:", data.branch_id);
        loadRoles();
    } else {
        console.log("🔴 1. useEffect Triggered but Branch ID is MISSING:", data);
    }
  }, [data.branch_id]);

  const loadRoles = async () => {
    setLoading(true);
    try {
        console.log("🟡 2. Calling API: getActiveCollectedBy...");
        
        const response = await getActiveCollectedBy(data.branch_id);
        
        // DEBUG: Print the EXACT response from the server
        console.log("🔵 3. API Response Data:", JSON.stringify(response.data, null, 2));

        // Handle both structures: { data: [...] } OR [...]
        const list = response.data.data || response.data;
        
        if (Array.isArray(list)) {
            console.log(`🟢 4. Found ${list.length} roles. Updating State.`);
            setRolesList(list); 
        } else {
            console.error("🔴 4. Error: Expected array but got:", typeof list);
        }

    } catch (e) {
        console.error("🔴 API ERROR:", e);
        Alert.alert("API Error", "Could not fetch roles. Check console.");
    } finally {
        setLoading(false);
    }
  };

  // 2. Handle Role Selection
  const handleRoleSelect = (role) => {
    console.log("Selected Role:", role);
    setSelectedRole(role);

    // --- LOGIC: AUTO-FILL IF OFFICE ---
    // Check 'name' case-insensitively just in case
    if (role.name && role.name.toLowerCase() === 'office') {
        
        const currentUserPerson = {
            id: userData.id || userData.name_id,
            name: userData.name || 'Current User'
        };

        console.log("Auto-selecting Office User:", currentUserPerson);

        update('collected_by', currentUserPerson);
        setPeopleList([currentUserPerson]);
        
    } else {
        // --- LOGIC: RESET FOR OTHER ROLES ---
        update('collected_by', null);
        setPeopleList([]); 
        // Alert.alert("Note", `Please select a person for ${role.name}`);
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
        onPress={() => {
            console.log("Opening Role Modal. Current List:", rolesList);
            setRoleModalVisible(true);
        }}
      >
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialCommunityIcons name="briefcase-account" size={24} color={colors.secondary} style={{marginRight: 10}} />
            <Text style={styles.selectText}>
                {selectedRole ? selectedRole.name : 'Select Role'}
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