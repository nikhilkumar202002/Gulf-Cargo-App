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
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = activeTab === 'sender' 
        ? await getSenderParties() 
        : await getReceiverParties();
      
      const list = response.data.data || response.data || [];
      setData(list);
      setFilteredData(list);
    } catch (error) {
      console.error("Error fetching parties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);
  useEffect(() => { if(isFocused) fetchData(); }, [activeTab, isFocused]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const lower = text.toLowerCase();
      const filtered = data.filter(item => 
        (item.name && item.name.toLowerCase().includes(lower)) ||
        (item.phone && item.phone.toString().includes(lower)) ||
        (item.mobile && item.mobile.toString().includes(lower))
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
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
                      setLoading(true);
                      await deleteParty(selectedParty.id);
                      setData(prev => prev.filter(p => p.id !== selectedParty.id));
                      setFilteredData(prev => prev.filter(p => p.id !== selectedParty.id));
                  } catch(e) {
                      Alert.alert("Error", "Failed to delete party");
                  } finally {
                      setLoading(false);
                  }
              } 
            }
          ]
        );
        break;
    }
  };

  const renderItem = ({ item }) => {
    const contact = item.phone || item.mobile || item.contact_number;
    const location = item.address || item.city || item.location;

    return (
      <View style={styles.partyItem}>
        {/* Visual indicator bar */}
        <View style={[styles.roleIndicator, { backgroundColor: activeTab === 'sender' ? colors.primary : '#10B981' }]} />
        
        <View style={styles.itemMainContent}>
            <View style={styles.itemTopRow}>
                <Text style={styles.partyName} numberOfLines={1}>{item.name}</Text>
                <TouchableOpacity onPress={() => { setSelectedParty(item); setMenuVisible(true); }}>
                    <MaterialCommunityIcons name="dots-horizontal" size={24} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            <View style={styles.itemMetadataRow}>
                <View style={styles.metaPill}>
                    <MaterialCommunityIcons name="phone-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText}>{contact || 'No Contact'}</Text>
                </View>
                <View style={[styles.metaPill, { flex: 1 }]}>
                    <MaterialCommunityIcons name="map-marker-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText} numberOfLines={1}>{location || 'Global Address'}</Text>
                </View>
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
            style={[styles.tabButton, activeTab === 'sender' && styles.tabButtonActive]} 
            onPress={() => setActiveTab('sender')}
            >
            <Text style={[styles.tabLabel, activeTab === 'sender' && styles.tabLabelActive]}>SENDERS</Text>
            </TouchableOpacity>
            <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'receiver' && styles.tabButtonActive]} 
            onPress={() => setActiveTab('receiver')}
            >
            <Text style={[styles.tabLabel, activeTab === 'receiver' && styles.tabLabelActive]}>RECEIVERS</Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* 2. List Body */}
      {loading && !searchQuery ? (
        <View style={styles.centerLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listInside}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-off-outline" size={48} color="#E2E8F0" />
              <Text style={styles.emptyTitle}>No parties found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or category</Text>
            </View>
          }
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
  container: { flex: 1, backgroundColor: '#F9F9F9', paddingHorizontal: 20 },
  
  // Header Section
  topSection: { 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 15, 
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
    backgroundColor: '#F1F5F9', 
    borderRadius: 10, 
    padding: 4 
  },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabButtonActive: { 
    backgroundColor: '#FFFFFF', 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 5, 
    elevation: 2 
  },
  tabLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, fontFamily: 'InstrumentSans-Regular' },
  tabLabelActive: { color: colors.primary, fontFamily: 'InstrumentSans-Regular' },

  // List Items
  listInside: { padding: 20 },
  partyItem: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    marginBottom: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    height: 85
  },
  roleIndicator: { width: 5, height: '100%' },
  itemMainContent: { flex: 1, padding: 14, justifyContent: 'center' },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  partyName: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 10, fontFamily: 'InstrumentSans-Regular' },
  
  itemMetadataRow: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  metaPill: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  metaText: { fontSize: 12, color: '#64748B', fontWeight: '600', marginLeft: 4, fontFamily: 'InstrumentSans-Regular' },

  centerLoading: { marginTop: 40, alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 16, fontFamily: 'InstrumentSans-Regular' },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4, textAlign: 'center', fontFamily: 'InstrumentSans-Regular' },

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