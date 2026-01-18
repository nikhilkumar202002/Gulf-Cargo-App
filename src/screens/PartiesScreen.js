import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, TextInput, RefreshControl, Modal, TouchableWithoutFeedback, Alert 
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

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if(isFocused) fetchData();
  }, [activeTab, isFocused]);

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

  // --- ACTION HANDLERS ---
  const openMenu = (item) => {
    setSelectedParty(item);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedParty(null);
  };

 const handleMenuAction = async (action) => {
    closeMenu();
    if (!selectedParty) return;

    switch (action) {
      case 'view':
        // Navigate to Details
        navigation.navigate('PartyDetails', { id: selectedParty.id });
        break;
      case 'edit':
        // Navigate to Edit
        navigation.navigate('EditParty', { id: selectedParty.id });
        break;
      case 'delete':
        Alert.alert(
          "Delete Party", 
          `Are you sure you want to delete ${selectedParty.name}?`,
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Delete", 
              style: "destructive", 
              onPress: async () => {
                  try {
                      setLoading(true);
                      await deleteParty(selectedParty.id);
                      // Remove from local list immediately
                      setData(prev => prev.filter(p => p.id !== selectedParty.id));
                      setFilteredData(prev => prev.filter(p => p.id !== selectedParty.id));
                      Alert.alert("Success", "Party deleted successfully");
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
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.name ? item.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.name}>{item.name}</Text>
          
          <View style={styles.row}>
            <MaterialCommunityIcons name="phone" size={14} color="#666" />
            <Text style={styles.detailText}>{contact || 'No Contact'}</Text>
          </View>

          <View style={styles.row}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>
              {location || 'No Address'}
            </Text>
          </View>
        </View>
        
        {/* 3 DOT MENU ICON */}
        <TouchableOpacity style={styles.actionBtn} onPress={() => openMenu(item)}>
           <MaterialCommunityIcons name="dots-vertical" size={24} color="#999" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* Segment Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'sender' && styles.activeTab]} 
          onPress={() => setActiveTab('sender')}
        >
          <Text style={[styles.tabText, activeTab === 'sender' && styles.activeTabText]}>Senders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'receiver' && styles.activeTab]} 
          onPress={() => setActiveTab('receiver')}
        >
          <Text style={[styles.tabText, activeTab === 'receiver' && styles.activeTabText]}>Receivers</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#888" style={{marginRight: 8}} />
        <TextInput 
          style={styles.input}
          placeholder={`Search ${activeTab === 'sender' ? 'Senders' : 'Receivers'}...`}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 20}} />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-off-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No parties found</Text>
            </View>
          }
        />
      )}

      {/* OPTIONS ACTION SHEET (MODAL) */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={closeMenu}>
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.actionSheet}>
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Actions for {selectedParty?.name}</Text>
                </View>

                <TouchableOpacity style={styles.actionItem} onPress={() => handleMenuAction('view')}>
                    <View style={[styles.iconCircle, {backgroundColor: '#e3f2fd'}]}>
                        <MaterialCommunityIcons name="eye-outline" size={22} color="#2196f3" />
                    </View>
                    <Text style={styles.actionText}>View Details</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => handleMenuAction('edit')}>
                    <View style={[styles.iconCircle, {backgroundColor: '#fff3e0'}]}>
                        <MaterialCommunityIcons name="pencil-outline" size={22} color="#ff9800" />
                    </View>
                    <Text style={styles.actionText}>Edit Party</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.actionItem} onPress={() => handleMenuAction('delete')}>
                    <View style={[styles.iconCircle, {backgroundColor: '#ffebee'}]}>
                        <MaterialCommunityIcons name="trash-can-outline" size={22} color="#f44336" />
                    </View>
                    <Text style={[styles.actionText, {color: '#f44336'}]}>Delete Party</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={closeMenu}>
                    <Text style={styles.cancelText}>Cancel</Text>
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
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  
  // Tabs
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', padding: 4, margin: 16, borderRadius: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: colors.primary },
  tabText: { fontWeight: '600', color: '#666' },
  activeTabText: { color: '#fff' },

  // Search
  searchContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 12, height: 45, 
    borderRadius: 10, borderWidth: 1, borderColor: '#eee' 
  },
  input: { flex: 1, fontSize: 15 },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  
  // Card
  card: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    marginBottom: 12, padding: 12, borderRadius: 12, 
    elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.05, shadowRadius: 2 
  },
  avatarContainer: { 
    width: 45, height: 45, borderRadius: 23, backgroundColor: '#eef2ff', 
    justifyContent: 'center', alignItems: 'center', marginRight: 12 
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.secondary },
  cardContent: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  detailText: { fontSize: 13, color: '#666', marginLeft: 6 },
  actionBtn: { padding: 8 },
  
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', marginTop: 10, fontSize: 16 },

  // Modal Styles
  modalOverlay: { 
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' 
  },
  actionSheet: { 
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 
  },
  sheetHeader: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15 },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  
  actionItem: { 
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12 
  },
  iconCircle: { 
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  actionText: { fontSize: 16, fontWeight: '500', color: '#333' },
  
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },
  
  cancelBtn: { marginTop: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10 },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#666' }
});