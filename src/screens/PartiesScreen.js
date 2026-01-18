import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, TextInput, RefreshControl 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../styles/colors';
import { getSenderParties, getReceiverParties } from '../services/partiesServices'; // Ensure path is correct

export default function PartiesScreen() {
  const [activeTab, setActiveTab] = useState('sender'); // 'sender' or 'receiver'
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch based on active tab
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

  // Handle Search
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
        <TouchableOpacity style={styles.actionBtn}>
           <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
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
  
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', marginTop: 10, fontSize: 16 }
});