import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal 
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
      // Silently handle fetch errors
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderCard = (type, selectedParty, onOpenSelect, onCreate) => {
    const isSender = type === 'sender';
    const accentColor = isSender ? '#C7245C' : colors.secondary;
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
                <View style={styles.headerLabelRow}>
                    <View style={[styles.headerDot, { backgroundColor: accentColor }]} />
                    <Text style={styles.headerLabel}>{isSender ? 'SENDER' : 'RECEIVER'}</Text>
                </View>
                <TouchableOpacity onPress={onCreate} style={[styles.newBtn, { borderColor: accentColor }]} activeOpacity={0.78}>
                    <MaterialCommunityIcons name="plus" size={14} color={accentColor} />
                    <Text style={[styles.newBtnText, { color: accentColor }]}>Add New</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.card, selectedParty && styles.selectedCard, loading && !selectedParty && styles.loadingCard]}
              onPress={onOpenSelect}
              activeOpacity={0.86}
              disabled={loading}
            >
                {loading && !selectedParty ? (
                    <View style={styles.selectSkeleton}>
                        <View style={styles.skeletonAvatar} />
                        <View style={styles.skeletonContent}>
                            <View style={styles.skeletonLineWide} />
                            <View style={styles.skeletonLineShort} />
                        </View>
                        <View style={styles.skeletonChevron} />
                    </View>
                ) : selectedParty ? (
                    <View style={styles.selectedContent}>
                        
                        {/* 1. Top Section: Avatar & Name */}
                        <View style={styles.topSection}>
                            <View style={[styles.avatar, { backgroundColor: isSender ? '#FDECEA' : '#EEF2FF' }]}>
                                <Text style={[styles.avatarText, { color: accentColor }]}>
                                    {selectedParty.name?.charAt(0).toUpperCase() || '?'}
                                </Text>
                            </View>
                            <View style={styles.nameContainer}>
                                <Text style={styles.name}>{selectedParty.name}</Text>
                                <Text style={styles.idText}>ID: {selectedParty.id}</Text>
                            </View>
                            <View style={styles.editIconBox}>
                                <MaterialCommunityIcons name="check" size={18} color="#fff" />
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
                            <MaterialCommunityIcons name={isSender ? 'account-arrow-right-outline' : 'account-arrow-left-outline'} size={24} color={accentColor} />
                        </View>
                        <Text style={styles.placeholder}>Select {type === 'sender' ? 'Sender' : 'Receiver'}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={24} color="#ccc" />
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
  };

  // --- MODE 2: LIST VIEW ---
  return (
    <View style={styles.container}>
      <View style={styles.content}>

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

        {/* CREATE PARTY MODAL */}
        <Modal
          visible={viewMode === 'create_sender' || viewMode === 'create_receiver'}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setViewMode('list')}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              <CreatePartyForm 
                type={viewMode === 'create_sender' ? 'sender' : 'receiver'}
                branchId={userData?.user?.branch_id || userData?.branch_id}
                onCancel={() => setViewMode('list')}
                onSuccess={(newParty) => {
                  if (viewMode === 'create_sender') {
                    setSendersList(prev => [newParty, ...prev]);
                    update('sender', newParty);
                  } else {
                    setReceiversList(prev => [newParty, ...prev]);
                    update('receiver', newParty);
                  }
                  setViewMode('list');
                }}
              />
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 4 }, 
  content: { flex: 1 },
  
  cardContainer: { marginBottom: 12 },
  
  headerRow: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
      marginBottom: 6, paddingHorizontal: 2
  },
  headerLabel: { 
      fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 
  },
  headerLabelRow: { flexDirection: 'row', alignItems: 'center' },
  headerDot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  
  newBtn: { 
      backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14,
      flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.secondary
  },
  newBtnText: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
  
  // Card Styles
  card: { 
      backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
      elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.05, shadowRadius: 3,
      overflow: 'hidden'
  },
  selectedCard: { borderColor: '#C7D2FE', backgroundColor: '#FBFCFF' },
  loadingCard: { borderColor: '#EEF2FF' },
  
  selectedContent: { padding: 0 },

  // 1. Top Section
  topSection: { 
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f9fafb' 
  },
  avatar: { 
      width: 38, height: 38, borderRadius: 19, backgroundColor: '#eef2ff', 
      justifyContent: 'center', alignItems: 'center', marginRight: 12,
      borderWidth: 1, borderColor: '#e0e7ff'
  },
  avatarText: { fontSize: 17, fontWeight: 'bold', color: colors.secondary },
  nameContainer: { flex: 1 },
  name: { fontSize: 15, fontWeight: 'bold', color: '#1f2937' },
  idText: { fontSize: 11, color: '#9ca3af' },
  editIconBox: { 
      padding: 5, backgroundColor: colors.secondary, borderRadius: 8, borderWidth: 1, borderColor: colors.secondary 
  },

  divider: { height: 1, backgroundColor: '#e5e7eb' },

  // 2. Details Section
  detailsContainer: { paddingHorizontal: 12, paddingVertical: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 20, paddingTop: 2 }, // Aligns icon with first line of text
  detailLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600', marginBottom: 1, textTransform: 'uppercase' },
  detailValue: { fontSize: 13, color: '#374151', fontWeight: '500' },

  // Empty State
  emptyState: { 
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, minHeight: 64 
  },
  emptyIconCircle: { 
      width: 34, height: 34, borderRadius: 17, backgroundColor: '#f3f4f6', 
      justifyContent: 'center', alignItems: 'center', marginRight: 12 
  },
  placeholder: { fontSize: 15, color: '#9ca3af', flex: 1, fontWeight: '500' },
  selectSkeleton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 64,
  },
  skeletonAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#EEF2F7',
      marginRight: 12,
  },
  skeletonContent: { flex: 1 },
  skeletonLineWide: {
      width: '64%',
      height: 13,
      borderRadius: 7,
      backgroundColor: '#EEF2F7',
      marginBottom: 8,
  },
  skeletonLineShort: {
      width: '38%',
      height: 10,
      borderRadius: 6,
      backgroundColor: '#F1F5F9',
  },
  skeletonChevron: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#F1F5F9',
  }
});
