import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSenderParties, getReceiverParties } from '../../../services/partiesServices'; 
import BottomSheetSelect from '../components/BottomSheetSelect'; 
import colors from '../../../styles/colors'; 
import { useUser } from '../../../context/UserContext';
import CreatePartyForm from '../forms/CreatePartyForm'; 

export default function Step2Parties({ data, update }) {
  const { userData } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Lists
  const [sendersList, setSendersList] = useState([]);
  const [receiversList, setReceiversList] = useState([]);
  
  // UI State
  const [viewMode, setViewMode] = useState('list'); 
  const [showSenderSelect, setShowSenderSelect] = useState(false);
  const [showReceiverSelect, setShowReceiverSelect] = useState(false);

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([getSenderParties(), getReceiverParties()]);
      setSendersList(sRes.data.data || sRes.data || []);
      setReceiversList(rRes.data.data || rRes.data || []);
    } catch (e) {
      console.error("Error fetching parties", e);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderCard = (type, selectedParty, onOpenSelect, onCreate) => {
    // Helper to get display values safely
    const contactNum = selectedParty?.contact_number || selectedParty?.phone || selectedParty?.mobile;
    const whatsAppNum = selectedParty?.whatsapp_number || selectedParty?.whatsapp;
    
    // Construct address string
    const addressParts = [
        selectedParty?.address, 
        selectedParty?.city, 
        selectedParty?.post, 
        selectedParty?.pin
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null;

    return (
        <View style={styles.cardContainer}>
            {/* Header Row: Label + Add New Button */}
            <View style={styles.headerRow}>
                <Text style={styles.headerLabel}>{type === 'sender' ? 'SENDER' : 'RECEIVER'}</Text>
                <TouchableOpacity onPress={onCreate} style={styles.newBtn}>
                    <MaterialCommunityIcons name="plus" size={14} color={colors.secondary} />
                    <Text style={styles.newBtnText}>Add New</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.card} onPress={onOpenSelect} activeOpacity={0.9}>
                {selectedParty ? (
                    <View style={styles.selectedContent}>
                        
                        {/* 1. Top Section: Avatar & Name */}
                        <View style={styles.topSection}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {selectedParty.name?.charAt(0).toUpperCase() || '?'}
                                </Text>
                            </View>
                            <View style={styles.nameContainer}>
                                <Text style={styles.name}>{selectedParty.name}</Text>
                                <Text style={styles.idText}>ID: {selectedParty.id}</Text>
                            </View>
                            <View style={styles.editIconBox}>
                                <MaterialCommunityIcons name="pencil-outline" size={18} color="#666" />
                            </View>
                        </View>
                        
                        <View style={styles.divider} />

                        {/* 2. Details Section (Vertical List for better spacing) */}
                        <View style={styles.detailsContainer}>
                            
                            {/* Contact Number */}
                            {contactNum ? (
                                <View style={styles.detailRow}>
                                    <View style={styles.iconBox}>
                                        <MaterialCommunityIcons name="phone" size={14} color="#666" />
                                    </View>
                                    <View>
                                        <Text style={styles.detailLabel}>Contact</Text>
                                        <Text style={styles.detailValue}>{contactNum}</Text>
                                    </View>
                                </View>
                            ) : null}

                            {/* WhatsApp Number */}
                            {whatsAppNum ? (
                                <View style={[styles.detailRow, {marginTop: 8}]}>
                                    <View style={styles.iconBox}>
                                        <MaterialCommunityIcons name="whatsapp" size={14} color="green" />
                                    </View>
                                    <View>
                                        <Text style={styles.detailLabel}>WhatsApp</Text>
                                        <Text style={styles.detailValue}>{whatsAppNum}</Text>
                                    </View>
                                </View>
                            ) : null}

                            {/* Address */}
                            {fullAddress ? (
                                <View style={[styles.detailRow, {marginTop: 8}]}>
                                    <View style={styles.iconBox}>
                                        <MaterialCommunityIcons name="map-marker-outline" size={14} color="#666" />
                                    </View>
                                    <View style={{flex: 1}}>
                                        <Text style={styles.detailLabel}>Address</Text>
                                        <Text style={styles.detailValue} numberOfLines={2}>
                                            {fullAddress}
                                        </Text>
                                    </View>
                                </View>
                            ) : null}

                        </View>
                    </View>
                ) : (
                    // EMPTY STATE
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="account-search-outline" size={24} color="#aaa" />
                        </View>
                        <Text style={styles.placeholder}>Select {type === 'sender' ? 'Sender' : 'Receiver'}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={24} color="#ccc" />
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
  };

  // --- MODE 1: CREATE FORM ---
  if (viewMode === 'create_sender' || viewMode === 'create_receiver') {
      const isSender = viewMode === 'create_sender';
      return (
          <CreatePartyForm 
              type={isSender ? 'sender' : 'receiver'}
              branchId={userData?.user?.branch_id || userData?.branch_id}
              onCancel={() => setViewMode('list')}
              onSuccess={(newParty) => {
                  if (isSender) {
                      setSendersList(prev => [newParty, ...prev]);
                      update('sender', newParty);
                  } else {
                      setReceiversList(prev => [newParty, ...prev]);
                      update('receiver', newParty);
                  }
                  setViewMode('list');
              }}
          />
      );
  }

  // --- MODE 2: LIST VIEW ---
  return (
    <View style={styles.container}>
      <View style={{height: 10}} />

      {renderCard(
          'sender', 
          data.sender, 
          () => setShowSenderSelect(true), 
          () => setViewMode('create_sender')
      )}

      {renderCard(
          'receiver', 
          data.receiver, 
          () => setShowReceiverSelect(true), 
          () => setViewMode('create_receiver')
      )}

      {loading && <ActivityIndicator style={{marginTop: 10}} color={colors.primary} />}

      {/* SELECTION MODALS */}
      <BottomSheetSelect 
        visible={showSenderSelect} 
        title="Select Sender" 
        data={sendersList} 
        onClose={() => setShowSenderSelect(false)} 
        onSelect={(i) => update('sender', i)} 
      />
      
      <BottomSheetSelect 
        visible={showReceiverSelect} 
        title="Select Receiver" 
        data={receiversList} 
        onClose={() => setShowReceiverSelect(false)} 
        onSelect={(i) => update('receiver', i)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, 
  
  cardContainer: { marginBottom: 15 },
  
  headerRow: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
      marginBottom: 8, paddingHorizontal: 4 
  },
  headerLabel: { 
      fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 
  },
  
  newBtn: { 
      backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15,
      flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.secondary
  },
  newBtnText: { color: colors.secondary, fontSize: 11, fontWeight: '700', marginLeft: 4 },
  
  // Card Styles
  card: { 
      backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
      elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.05, shadowRadius: 3,
      overflow: 'hidden'
  },
  
  selectedContent: { padding: 0 },

  // 1. Top Section
  topSection: { 
      flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f9fafb' 
  },
  avatar: { 
      width: 40, height: 40, borderRadius: 20, backgroundColor: '#eef2ff', 
      justifyContent: 'center', alignItems: 'center', marginRight: 12,
      borderWidth: 1, borderColor: '#e0e7ff'
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.secondary },
  nameContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  idText: { fontSize: 11, color: '#9ca3af' },
  editIconBox: { 
      padding: 6, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' 
  },

  divider: { height: 1, backgroundColor: '#e5e7eb' },

  // 2. Details Section
  detailsContainer: { padding: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 20, paddingTop: 2 }, // Aligns icon with first line of text
  detailLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600', marginBottom: 1, textTransform: 'uppercase' },
  detailValue: { fontSize: 13, color: '#374151', fontWeight: '500' },

  // Empty State
  emptyState: { 
      flexDirection: 'row', alignItems: 'center', padding: 16, height: 70 
  },
  emptyIconCircle: { 
      width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', 
      justifyContent: 'center', alignItems: 'center', marginRight: 12 
  },
  placeholder: { fontSize: 15, color: '#9ca3af', flex: 1, fontWeight: '500' }
});