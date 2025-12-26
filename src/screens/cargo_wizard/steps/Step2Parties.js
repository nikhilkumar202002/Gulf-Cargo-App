import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, 
  TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSenderParties, getReceiverParties, createParty } from '../../../services/partiesServices'; // Ensure this file exists
import BottomSheetSelect from '../components/BottomSheetSelect'; 
import colors from '../../../styles/colors';

export default function Step2Parties({ data, update }) {
  // --- STATE ---
  const [sendersList, setSendersList] = useState([]);
  const [receiversList, setReceiversList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selection Modals
  const [showSenderSelect, setShowSenderSelect] = useState(false);
  const [showReceiverSelect, setShowReceiverSelect] = useState(false);

  // Create New Party Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState(null); // 'sender' (1) or 'receiver' (2)
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyAddress, setNewPartyAddress] = useState('');
  const [creating, setCreating] = useState(false);

  // --- 1. LOAD DATA ON MOUNT ---
  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    setLoading(true);
    try {
      // Run both fetches in parallel
      const [sendersRes, receiversRes] = await Promise.all([
        getSenderParties(),
        getReceiverParties()
      ]);

      setSendersList(sendersRes.data.data || sendersRes.data || []);
      setReceiversList(receiversRes.data.data || receiversRes.data || []);
      
    } catch (error) {
      console.log("Error fetching parties:", error);
      Alert.alert("Error", "Could not load customers list.");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. CREATE NEW PARTY LOGIC ---
  const openCreateModal = (type) => {
    setCreateType(type); // 'sender' or 'receiver'
    setNewPartyName('');
    setNewPartyPhone('');
    setNewPartyAddress('');
    setShowCreateModal(true);
  };

  const handleCreateParty = async () => {
    if (!newPartyName || !newPartyPhone) {
      Alert.alert("Validation", "Name and Phone are required.");
      return;
    }

    setCreating(true);
    try {
      const typeId = createType === 'sender' ? 1 : 2;
      
      const payload = {
        name: newPartyName,
        phone: newPartyPhone,
        address: newPartyAddress,
        customer_type_id: typeId,
        status: 1 // Active
      };

      const response = await createParty(payload);
      
      if (response.data && response.data.success) {
        // Success!
        const newParty = response.data.data || response.data.party; // Adjust based on actual API return
        
        // 1. Add to local list so it appears in dropdown
        if (createType === 'sender') {
          setSendersList(prev => [...prev, newParty]);
          update('sender', newParty); // Auto-select it
        } else {
          setReceiversList(prev => [...prev, newParty]);
          update('receiver', newParty); // Auto-select it
        }

        setShowCreateModal(false);
        Alert.alert("Success", `${createType === 'sender' ? 'Sender' : 'Receiver'} created!`);
      } else {
        Alert.alert("Error", "Failed to create party. API returned failure.");
      }

    } catch (error) {
      console.error("Create Party Error:", error);
      Alert.alert("Error", "Failed to create party.");
    } finally {
      setCreating(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderPartyCard = (title, type, selectedParty, list, onSelectOpen, onCreateOpen) => (
    <View style={styles.sectionContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={onCreateOpen}>
            <Text style={styles.addText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      {selectedParty ? (
        <View style={styles.cardSelected}>
          <View style={styles.cardHeader}>
             <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>{selectedParty.name.charAt(0).toUpperCase()}</Text>
             </View>
             <View style={{flex: 1}}>
                <Text style={styles.partyName}>{selectedParty.name}</Text>
                <Text style={styles.partyPhone}>{selectedParty.phone || 'No Phone'}</Text>
             </View>
             <TouchableOpacity onPress={onSelectOpen} style={styles.changeBtn}>
                <Text style={styles.changeBtnText}>Change</Text>
             </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#888" />
            <Text style={styles.partyAddress} numberOfLines={2}>
                {selectedParty.address || 'No Address Provided'}
            </Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.cardEmpty} onPress={onSelectOpen}>
           <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="account-search" size={28} color="#999" />
           </View>
           <Text style={styles.emptyText}>Tap to select {type}</Text>
           <MaterialCommunityIcons name="chevron-down" size={24} color="#ccc" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* SENDER SECTION */}
      {renderPartyCard(
        "Sender Details", 
        "Sender", 
        data.sender, 
        sendersList, 
        () => setShowSenderSelect(true),
        () => openCreateModal('sender')
      )}

      {/* RECEIVER SECTION */}
      {renderPartyCard(
        "Receiver Details", 
        "Receiver", 
        data.receiver, 
        receiversList, 
        () => setShowReceiverSelect(true),
        () => openCreateModal('receiver')
      )}

      {/* LOADING INDICATOR (Initial Load) */}
      {loading && (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* --- MODALS --- */}

      {/* 1. SENDER SELECT */}
      <BottomSheetSelect
        visible={showSenderSelect}
        title="Select Sender"
        data={sendersList}
        onClose={() => setShowSenderSelect(false)}
        onSelect={(item) => update('sender', item)}
      />

      {/* 2. RECEIVER SELECT */}
      <BottomSheetSelect
        visible={showReceiverSelect}
        title="Select Receiver"
        data={receiversList}
        onClose={() => setShowReceiverSelect(false)}
        onSelect={(item) => update('receiver', item)}
      />

      {/* 3. CREATE PARTY MODAL */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add New {createType === 'sender' ? 'Sender' : 'Receiver'}
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter Name"
                value={newPartyName}
                onChangeText={setNewPartyName} 
              />

              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter Phone"
                keyboardType="phone-pad"
                value={newPartyPhone}
                onChangeText={setNewPartyPhone} 
              />

              <Text style={styles.inputLabel}>Address</Text>
              <TextInput 
                style={[styles.input, { height: 80 }]} 
                placeholder="Enter Address"
                multiline
                value={newPartyAddress}
                onChangeText={setNewPartyAddress} 
              />
            </ScrollView>

            <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleCreateParty}
                disabled={creating}
            >
                {creating ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.saveBtnText}>Save & Select</Text>
                )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionContainer: { marginBottom: 25 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.secondary },
  addText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  
  // Empty Card
  cardEmpty: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    borderStyle: 'dashed',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  emptyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  emptyText: { flex: 1, marginLeft: 15, color: '#888', fontSize: 16 },

  // Selected Card
  cardSelected: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.secondary },
  partyName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  partyPhone: { fontSize: 14, color: '#666', marginTop: 2 },
  changeBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#f0f0f0', borderRadius: 6 },
  changeBtnText: { fontSize: 12, color: '#666', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  partyAddress: { fontSize: 13, color: '#666', marginLeft: 8, flex: 1 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.secondary },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 5, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fafafa' },
  saveBtn: { backgroundColor: colors.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  loadingOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }
});