import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, RefreshControl, Modal, Pressable, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../styles/colors';
import { getSenderParties, getReceiverParties, deleteParty } from '../services/partiesServices'; 
import { useNavigation, useIsFocused } from '@react-navigation/native';
import SkeletonLoader from '../components/SkeletonLoader';

export default function PartiesScreen() {
  const [activeTab, setActiveTab] = useState('sender'); 
  const [loadingSender, setLoadingSender] = useState(false);
  const [loadingReceiver, setLoadingReceiver] = useState(false);
  const [senderData, setSenderData] = useState([]);
  const [receiverData, setReceiverData] = useState([]);
  const [senderError, setSenderError] = useState(null);
  const [receiverError, setReceiverError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const fetchSenderParties = async () => {
    setLoadingSender(true);
    setSenderError(null);
    try {
      const response = await getSenderParties();
      const list = response?.data?.data || response?.data || [];
      setSenderData(list);
      setSenderError(null);
      if (activeTab === 'sender') {
        setFilteredData(list);
      }
    } catch (error) {
      setSenderError(error?.message || "Failed to load senders. Check your connection.");
      setSenderData([]);
    } finally {
      setLoadingSender(false);
    }
  };

  const fetchReceiverParties = async () => {
    setLoadingReceiver(true);
    setReceiverError(null);
    try {
      const response = await getReceiverParties();
      const list = response?.data?.data || response?.data || [];
      setReceiverData(list);
      setReceiverError(null);
      if (activeTab === 'receiver') {
        setFilteredData(list);
      }
    } catch (error) {
      setReceiverError(error?.message || "Failed to load receivers. Check your connection.");
      setReceiverData([]);
    } finally {
      setLoadingReceiver(false);
    }
  };

  const getCurrentData = () => activeTab === 'sender' ? senderData : receiverData;
  const isCurrentLoading = () => activeTab === 'sender' ? loadingSender : loadingReceiver;
  const getCurrentError = () => activeTab === 'sender' ? senderError : receiverError;

  useEffect(() => {
    if (activeTab === 'sender') {
      setFilteredData(senderData);
    } else {
      setFilteredData(receiverData);
    }
  }, [activeTab, senderData, receiverData]);

  useEffect(() => {
    if (isFocused) {
      fetchSenderParties();
      fetchReceiverParties();
    }
  }, [isFocused]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    const currentData = activeTab === 'sender' ? senderData : receiverData;
    
    if (text) {
      const lower = text.toLowerCase();
      const filtered = currentData.filter(item => 
        (item.name && item.name.toLowerCase().includes(lower)) ||
        (item.phone && item.phone.toString().includes(lower)) ||
        (item.mobile && item.mobile.toString().includes(lower))
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(currentData);
    }
  };

  const handleMenuAction = async (action) => {
    setMenuVisible(false);
    if (!selectedParty) return;

    switch (action) {
      case 'view':
        navigation.navigate('PartyDetails', { id: selectedParty.id });
        break;
      case 'edit':
        // Route based on party's customer_type_id (1=Sender, 2=Receiver)
        // Convert to number to handle both string and number formats from API
        const typeId = Number(selectedParty.customer_type_id);
        const editScreen = typeId === 1 ? 'EditSender' : 'EditReceiver';
        navigation.navigate(editScreen, { id: selectedParty.id });
        break;
      case 'delete':
        Alert.alert(
          "Delete Party", 
          `Confirm deletion of ${selectedParty.name}?`,
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Delete", 
              style: "destructive", 
              onPress: async () => {
                  try {
                      const isLoading = activeTab === 'sender' ? setLoadingSender : setLoadingReceiver;
                      isLoading(true);
                      await deleteParty(selectedParty.id);
                      
                      // Remove from both data sources
                      setSenderData(prev => prev.filter(p => p.id !== selectedParty.id));
                      setReceiverData(prev => prev.filter(p => p.id !== selectedParty.id));
                      
                      // Update filtered data
                      setFilteredData(prev => prev.filter(p => p.id !== selectedParty.id));
                  } catch(e) {
                      Alert.alert("Error", "Failed to delete party");
                  } finally {
                      const isLoading = activeTab === 'sender' ? setLoadingSender : setLoadingReceiver;
                      isLoading(false);
                  }
              } 
            }
          ]
        );
        break;
    }
  };

  const renderItem = ({ item }) => {
    // Handle field variations for both senders and receivers
    const phone = item.phone || item.mobile || item.contact_number || item.phone_number || item.contact_mobile || '';
    const whatsapp = item.whatsapp || item.whatsapp_number || item.whatsapp_mobile || item.mobile || item.phone || '';
    const location = item.address || item.city || item.location || item.country || '';

    const isSender = activeTab === 'sender';
    const accentColor = isSender ? '#C7245C' : '#262262';
    const avatarBg = isSender ? '#FDECEA' : '#ECEFFE';
    const initial = item.name?.charAt(0)?.toUpperCase() || '?';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('PartyDetails', { id: item.id })}
        style={styles.partyItem}
      >
        {/* Left Avatar */}
        <View style={[styles.cardAvatar, { backgroundColor: avatarBg }]}>
          <Text style={[styles.cardAvatarText, { color: accentColor }]}>{initial}</Text>
        </View>

        {/* Main Content */}
        <View style={styles.itemMainContent}>
          <View style={styles.itemTopRow}>
            <Text style={styles.partyName} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => { setSelectedParty(item); setMenuVisible(true); }}
              style={styles.menuButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="dots-vertical" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={styles.itemMetadataRow}>
            {phone ? (
              <View style={styles.infoPill}>
                <MaterialCommunityIcons name="phone-outline" size={13} color="#64748B" />
                <Text style={styles.infoPillText} numberOfLines={1}>{phone}</Text>
              </View>
            ) : null}
            {whatsapp && whatsapp !== phone ? (
              <View style={[styles.infoPill, { backgroundColor: '#F0FDF4' }]}>
                <MaterialCommunityIcons name="whatsapp" size={13} color="#22C55E" />
                <Text style={[styles.infoPillText, { color: '#15803D' }]} numberOfLines={1}>{whatsapp}</Text>
              </View>
            ) : null}
          </View>

          {location ? (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={13} color="#94A3B8" />
              <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
            </View>
          ) : null}
        </View>

        {/* Right accent bar */}
        <View style={[styles.cardRightBar, { backgroundColor: accentColor }]} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Integrated Header Section */}
      <View style={styles.topSection}>
        <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
            <TextInput 
            style={styles.searchInput}
            placeholder={`Search ${activeTab}s...`}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearch}
            />
        </View>

        <View style={styles.tabBar}>
            <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'sender' && styles.tabButtonSenderActive]} 
            onPress={() => setActiveTab('sender')}
            >
            <Text style={[styles.tabLabel, activeTab === 'sender' && styles.tabLabelSenderActive]}>Senders</Text>
            </TouchableOpacity>
            <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'receiver' && styles.tabButtonReceiverActive]} 
            onPress={() => setActiveTab('receiver')}
            >
            <Text style={[styles.tabLabel, activeTab === 'receiver' && styles.tabLabelReceiverActive]}>Receivers</Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* 2. List Body */}
      {isCurrentLoading() && !searchQuery ? (
        <SkeletonLoader variant="list" count={5} />
      ) : getCurrentError() ? (
        <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="wifi-off" size={48} color="#E53935" />
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorMessage}>{getCurrentError()}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => { 
                if (activeTab === 'sender') {
                  fetchSenderParties();
                } else {
                  fetchReceiverParties();
                }
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listInside}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isCurrentLoading()} onRefresh={() => { 
            if (activeTab === 'sender') {
              fetchSenderParties();
            } else {
              fetchReceiverParties();
            }
          }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-off-outline" size={48} color="#E2E8F0" />
              <Text style={styles.emptyTitle}>No parties found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or category</Text>
            </View>
          }
          scrollIndicatorInsets={{ right: 1 }}
        />
      )}

      {/* Action Sheet Modal */}
      <Modal visible={menuVisible} transparent animationType="slide" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.contextMenu}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Party Identity */}
            <View style={styles.menuPartyRow}>
              <View style={[styles.menuAvatar, { backgroundColor: activeTab === 'sender' ? '#FDECEA' : '#EEF0FD' }]}>
                <Text style={[styles.menuAvatarText, { color: activeTab === 'sender' ? '#C7245C' : '#5B6EF5' }]}>
                  {selectedParty?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.menuPartyInfo}>
                <Text style={styles.menuPartyName} numberOfLines={1}>{selectedParty?.name}</Text>
                <Text style={styles.menuPartyType}>{activeTab === 'sender' ? 'Sender' : 'Receiver'}</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            {/* Actions */}
            <TouchableOpacity style={styles.menuOption} onPress={() => handleMenuAction('view')}>
              <View style={[styles.menuOptionIcon, { backgroundColor: '#EFF6FF' }]}>
                <MaterialCommunityIcons name="eye-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.menuOptionText}>
                <Text style={styles.optionLabel}>View Profile</Text>
                <Text style={styles.optionSub}>See full details</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={() => handleMenuAction('edit')}>
              <View style={[styles.menuOptionIcon, { backgroundColor: '#F0FDF4' }]}>
                <MaterialCommunityIcons name="pencil-outline" size={20} color="#22C55E" />
              </View>
              <View style={styles.menuOptionText}>
                <Text style={styles.optionLabel}>Edit Information</Text>
                <Text style={styles.optionSub}>Update party details</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuOption, styles.menuOptionDanger]} onPress={() => handleMenuAction('delete')}>
              <View style={[styles.menuOptionIcon, { backgroundColor: '#FEF2F2' }]}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
              </View>
              <View style={styles.menuOptionText}>
                <Text style={[styles.optionLabel, { color: '#EF4444' }]}>Remove Customer</Text>
                <Text style={styles.optionSub}>This action cannot be undone</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#FCA5A5" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setMenuVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9', paddingHorizontal: 0 },
  
  // Header Section
  topSection: { 
    paddingHorizontal: 16, 
    paddingTop: 10, 
    paddingBottom: 14, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    height: 44, 
    borderRadius: 10, 
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1E293B', fontWeight: '500', fontFamily: 'InstrumentSans-Regular' },

  // Tabs
  tabBar: { 
    flexDirection: 'row', 
    marginTop: 10, 
    gap: 8
  },
  tabButton: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  tabButtonSenderActive: { 
    backgroundColor: '#C7245C',
    borderColor: '#C7245C'
  },
  tabButtonReceiverActive: { 
    backgroundColor: '#5B6EF5',
    borderColor: '#5B6EF5'
  },
  tabLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', fontFamily: 'InstrumentSans-Regular' },
  tabLabelSenderActive: { color: '#FFFFFF', fontFamily: 'InstrumentSans-Regular' },
  tabLabelReceiverActive: { color: '#FFFFFF', fontFamily: 'InstrumentSans-Regular' },

  // List Items
  listInside: { padding: 12, paddingTop: 10, paddingBottom: 90 },
  partyItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 0,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  cardAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'InstrumentSans-Regular',
  },
  cardRightBar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    marginLeft: 8,
  },
  itemMainContent: { flex: 1, justifyContent: 'center' },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  partyName: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 6, fontFamily: 'InstrumentSans-Regular' },
  menuButton: { padding: 3, marginRight: 6 },
  itemMetadataRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 4 },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoPillText: { fontSize: 11, color: '#475569', fontWeight: '500', fontFamily: 'InstrumentSans-Regular' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 11, color: '#94A3B8', fontWeight: '500', fontFamily: 'InstrumentSans-Regular', flex: 1 },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 14, fontFamily: 'InstrumentSans-Regular' },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'center', fontFamily: 'InstrumentSans-Regular' },

  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF'
  },
  errorTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#E53935', 
    marginTop: 16, 
    fontFamily: 'InstrumentSans-Regular' 
  },
  errorMessage: { 
    fontSize: 13, 
    color: '#64748B', 
    marginTop: 8, 
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'InstrumentSans-Regular' 
  },
  retryButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'InstrumentSans-Regular'
  },

  // Context Menu Modal
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.55)', 
    justifyContent: 'flex-end', 
    width: '100%',
    height: '100%',
  },
  contextMenu: { 
    backgroundColor: '#FFFFFF', 
    width: '100%',
    borderTopLeftRadius: 22, 
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  menuPartyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuAvatarText: {
    fontSize: 19,
    fontWeight: '800',
    fontFamily: 'InstrumentSans-Regular',
  },
  menuPartyInfo: { flex: 1 },
  menuPartyName: { fontSize: 15, fontWeight: '700', color: '#0F172A', fontFamily: 'InstrumentSans-Regular' },
  menuPartyType: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'InstrumentSans-Regular' },
  menuDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 6 },
  menuOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  menuOptionDanger: {},
  menuOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOptionText: { flex: 1 },
  optionLabel: { fontSize: 14, color: '#0F172A', fontWeight: '600', fontFamily: 'InstrumentSans-Regular' },
  optionSub: { fontSize: 11, color: '#94A3B8', marginTop: 1, fontFamily: 'InstrumentSans-Regular' },
  cancelButton: {
    marginTop: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: 'InstrumentSans-Regular',
  },
});
