import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, TextInput, RefreshControl, Modal, TouchableWithoutFeedback, Alert, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../styles/colors';
import { getSenderParties, getReceiverParties, deleteParty } from '../services/partiesServices'; 
import { useNavigation, useIsFocused } from '@react-navigation/native';

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
      console.error("Error fetching sender parties:", error.message || error);
      if (error.response?.status) {
        console.error(`API Status: ${error.response.status}`, error.response.data);
      } else if (error.code === 'ENOTFOUND') {
        console.error("DNS Resolution Failed - Check your internet or backend server");
      }
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
      console.error("Error fetching receiver parties:", error.message || error);
      if (error.response?.status) {
        console.error(`API Status: ${error.response.status}`, error.response.data);
      } else if (error.code === 'ENOTFOUND') {
        console.error("DNS Resolution Failed - Check your internet or backend server");
      }
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
        navigation.navigate('EditParty', { id: selectedParty.id });
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

    return (
      <View style={styles.partyItem}>
        <View style={[styles.cardLeftBorder, { backgroundColor: activeTab === 'sender' ? '#ED2624' : '#262262' }]} />
        
        <View style={styles.itemMainContent}>
            <View style={styles.itemTopRow}>
                <Text style={styles.partyName} numberOfLines={1}>{item.name}</Text>
                <TouchableOpacity onPress={() => { setSelectedParty(item); setMenuVisible(true); }}>
                    <MaterialCommunityIcons name="dots-vertical" size={24} color="#64748B" />
                </TouchableOpacity>
            </View>

            <View style={styles.itemMetadataRow}>
                <View style={styles.metaPillLine}>
                    <MaterialCommunityIcons name="phone" size={16} color="#64748B" />
                    <Text style={styles.metaTextNumber}>{phone || 'N/A'}</Text>
                </View>
                <View style={styles.metaPillLine}>
                    <MaterialCommunityIcons name="message" size={16} color="#E53935" />
                    <Text style={styles.metaTextNumber}>{whatsapp || 'N/A'}</Text>
                </View>
            </View>

            <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#64748B" />
                <Text style={styles.locationText} numberOfLines={1}>{location || 'N/A'}</Text>
            </View>
        </View>
      </View>
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
        <View style={styles.centerLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
        </View>
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

      {/* 3. Redesigned Centered Context Modal */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.contextMenu}>
                <Text style={styles.menuTitle}>{selectedParty?.name}</Text>
                
                <TouchableOpacity style={styles.menuOption} onPress={() => handleMenuAction('view')}>
                    <MaterialCommunityIcons name="eye-outline" size={22} color="#0F172A" />
                    <Text style={styles.optionLabel}>View Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuOption} onPress={() => handleMenuAction('edit')}>
                    <MaterialCommunityIcons name="pencil-outline" size={22} color="#0F172A" />
                    <Text style={styles.optionLabel}>Edit Information</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity style={styles.menuOption} onPress={() => handleMenuAction('delete')}>
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
                    <Text style={[styles.optionLabel, {color: '#EF4444'}]}>Remove Customer</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9', paddingHorizontal: 0 },
  
  // Header Section
  topSection: { 
    paddingHorizontal: 20, 
    paddingTop: 15, 
    paddingBottom: 20, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    height: 48, 
    borderRadius: 12, 
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1E293B', fontWeight: '500', fontFamily: 'InstrumentSans-Regular' },

  // Tabs
  tabBar: { 
    flexDirection: 'row', 
    marginTop: 15, 
    gap: 10
  },
  tabButton: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    borderRadius: 10,
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
  tabLabel: { fontSize: 14, fontWeight: '700', color: '#64748B', fontFamily: 'InstrumentSans-Regular' },
  tabLabelSenderActive: { color: '#FFFFFF', fontFamily: 'InstrumentSans-Regular' },
  tabLabelReceiverActive: { color: '#FFFFFF', fontFamily: 'InstrumentSans-Regular' },

  // List Items
  listInside: { padding: 20, paddingTop: 15 },
  partyItem: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    marginBottom: 12, 
    borderRadius: 10,
    overflow: 'hidden'
  },
  cardLeftBorder: { width: 4, backgroundColor: '#E53935', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  itemMainContent: { flex: 1, padding: 16, justifyContent: 'center' },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  partyName: { fontSize: 22, fontWeight: '700', color: '#1e1e1e', flex: 1, marginRight: 10, fontFamily: 'InstrumentSans-Regular' },
  
  itemMetadataRow: { flexDirection: 'row', gap: 12, marginBottom: 8, alignItems: 'center' },
  metaPillLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTextNumber: { fontSize: 13, color: '#64748B', fontWeight: '500', fontFamily: 'InstrumentSans-Regular' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { fontSize: 13, color: '#64748B', fontWeight: '500', fontFamily: 'InstrumentSans-Regular', flex: 1 },

  centerLoading: { marginTop: 40, alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 16, fontFamily: 'InstrumentSans-Regular' },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4, textAlign: 'center', fontFamily: 'InstrumentSans-Regular' },

  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF'
  },
  errorTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#E53935', 
    marginTop: 16, 
    fontFamily: 'InstrumentSans-Regular' 
  },
  errorMessage: { 
    fontSize: 14, 
    color: '#64748B', 
    marginTop: 8, 
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'InstrumentSans-Regular' 
  },
  retryButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'InstrumentSans-Regular'
  },

  // Context Menu Modal
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  contextMenu: { 
    backgroundColor: '#FFFFFF', 
    width: '82%', 
    borderRadius: 20, 
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  menuTitle: { fontSize: 14, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 },
  menuOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  optionLabel: { fontSize: 16, color: '#0F172A', fontWeight: '600', marginLeft: 14 },
  menuDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 }
});