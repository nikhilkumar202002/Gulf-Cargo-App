import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, 
  TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSenderParties, getReceiverParties, createParty } from '../../../services/partiesServices'; 
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
  const [createType, setCreateType] = useState(null); 
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
      console.log("🟡 Starting Party Fetch...");

      // Run both fetches in parallel
      const [sendersRes, receiversRes] = await Promise.all([
        getSenderParties(),
        getReceiverParties()
      ]);

      // --- DEBUGGING SENDER DATA ---
      console.log("📦 Senders API Raw Response:", JSON.stringify(sendersRes.data, null, 2));
      const sList = sendersRes.data.data || sendersRes.data || [];
      console.log(`✅ Found ${sList.length} Senders`);
      if (sList.length > 0) {
        console.log("🔍 First Sender Object Keys:", Object.keys(sList[0]));
      }

      // --- DEBUGGING RECEIVER DATA ---
      console.log("📦 Receivers API Raw Response:", JSON.stringify(receiversRes.data, null, 2));
      const rList = receiversRes.data.data || receiversRes.data || [];
      console.log(`✅ Found ${rList.length} Receivers`);
      if (rList.length > 0) {
        console.log("🔍 First Receiver Object Keys:", Object.keys(rList[0]));
        console.log("🔍 First Receiver Data:", JSON.stringify(rList[0], null, 2));
      }

      setSendersList(sList);
      setReceiversList(rList);
      
    } catch (error) {
      console.error("🔴 Error fetching parties:", error);
      Alert.alert("Error", "Could not load customers list. Check console.");
    } finally {
      setLoading(false);
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
                <Text style={styles.avatarText}>{selectedParty.name ? selectedParty.name.charAt(0).toUpperCase() : '?'}</Text>
             </View>
             <View style={{flex: 1}}>
                <Text style={styles.partyName}>{selectedParty.name}</Text>
                
                {/* DYNAMIC PHONE DISPLAY: Check all possible keys */}
                <Text style={styles.partyPhone}>
                    📞 {selectedParty.phone || selectedParty.mobile || selectedParty.contact_number || 'No Phone'}
                </Text>
                
                {/* WHATSAPP DISPLAY: If available */}
                {(selectedParty.whatsapp_number || selectedParty.whatsapp) && (
                    <Text style={[styles.partyPhone, { color: 'green', marginTop: 2 }]}>
                        💬 {selectedParty.whatsapp_number || selectedParty.whatsapp}
                    </Text>
                )}
             </View>
             <TouchableOpacity onPress={onSelectOpen} style={styles.changeBtn}>
                <Text style={styles.changeBtnText}>Change</Text>
             </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#888" />
            <Text style={styles.partyAddress} numberOfLines={2}>
                {/* DYNAMIC ADDRESS DISPLAY */}
                {selectedParty.address || selectedParty.location || selectedParty.full_address || 'No Address Provided'}
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

  // ... (Keep handleCreateParty and the rest of your Render Logic the same) ...
  
  // For brevity, here is the modal rendering part again so you can paste the whole file
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
        status: 1 
      };

      console.log("Creating Party Payload:", payload); // DEBUG
      const response = await createParty(payload);
      console.log("Create Response:", response.data); // DEBUG
      
      if (response.data && response.data.success) {
        const newParty = response.data.data || response.data.party; 
        
        if (createType === 'sender') {
          setSendersList(prev => [...prev, newParty]);
          update('sender', newParty); 
        } else {
          setReceiversList(prev => [...prev, newParty]);
          update('receiver', newParty); 
        }

        setShowCreateModal(false);
        Alert.alert("Success", "Party Created!");
      } else {
        Alert.alert("Error", "Failed to create party.");
      }

    } catch (error) {
      console.error("Create Party Error:", error);
      Alert.alert("Error", "Failed to create party.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      {renderPartyCard(
        "Sender Details", "Sender", data.sender, sendersList, 
        () => setShowSenderSelect(true), () => openCreateModal('sender')
      )}

      {renderPartyCard(
        "Receiver Details", "Receiver", data.receiver, receiversList, 
        () => setShowReceiverSelect(true), () => openCreateModal('receiver')
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <BottomSheetSelect
        visible={showSenderSelect} title="Select Sender" data={sendersList}
        onClose={() => setShowSenderSelect(false)} onSelect={(item) => update('sender', item)}
      />

      <BottomSheetSelect
        visible={showReceiverSelect} title="Select Receiver" data={receiversList}
        onClose={() => setShowReceiverSelect(false)} onSelect={(item) => update('receiver', item)}
      />

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New {createType}</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput style={styles.input} value={newPartyName} onChangeText={setNewPartyName} />
              <Text style={styles.inputLabel}>Phone *</Text>
              <TextInput style={styles.input} keyboardType="phone-pad" value={newPartyPhone} onChangeText={setNewPartyPhone} />
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput style={[styles.input, { height: 80 }]} multiline value={newPartyAddress} onChangeText={setNewPartyAddress} />
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateParty} disabled={creating}>
                {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
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
  cardEmpty: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', borderStyle: 'dashed', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  emptyText: { flex: 1, marginLeft: 15, color: '#888', fontSize: 16 },
  cardSelected: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', padding: 16, elevation: 2 },
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