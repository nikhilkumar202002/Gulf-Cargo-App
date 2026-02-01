import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
  TouchableOpacity, RefreshControl, TextInput, Alert, Platform, StatusBar,
  Modal, TouchableWithoutFeedback 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getCargoList, searchCargoByBookingNo } from '../services/cargoService';
import { generateInvoicePDF } from '../services/pdfGenerator';
import { useUser } from '../context/UserContext';
import colors from '../styles/colors';

// FIX: Do NOT import CargoDetailsScreen or define Stack here. 
// Navigation happens by route name registered in your main App navigator.

export default function CargoListScreen() {
  const navigation = useNavigation();
  const { userData } = useUser();
  
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState(null);

  useEffect(() => { fetchCargos(1); }, []);

  const fetchCargos = async (pageNum) => {
    try {
      if (pageNum === 1) setLoading(true);
      const response = await getCargoList(pageNum);
      const list = response.data.data || response.data || [];
      const meta = response.data.meta || {}; 

      if (pageNum === 1) setCargos(list);
      else setCargos(prev => [...prev, ...list]);

      setLastPage(meta.last_page || (list.length < 10 ? pageNum : pageNum + 1));
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
      setLoadingMore(false); 
      setRefreshing(false); 
    }
  };

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.length === 0) { setIsSearching(false); setPage(1); fetchCargos(1); return; }
    if (text.length < 3) return;
    try {
      setLoading(true); setIsSearching(true);
      const response = await searchCargoByBookingNo(text);
      const results = response.data.data || response.data || [];
      setCargos(Array.isArray(results) ? results : [results]);
    } catch (e) { 
      setCargos([]); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleLoadMore = () => {
    if (!isSearching && !loadingMore && page < lastPage && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCargos(nextPage);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (isSearching) { handleSearch(searchQuery); setRefreshing(false); }
    else { setPage(1); fetchCargos(1); }
  };

  const handleViewBill = async (item) => {
    try {
      await generateInvoicePDF(item, userData);
    } catch (error) {
      Alert.alert("Error", "Could not generate invoice PDF.");
    }
  };

  // CORRECTED NAVIGATION CALL
  const handleViewSingle = (item) => {
    navigation.navigate('CargoDetails', { id: item.id }); 
  };

  const handleMenuAction = (action) => {
    setMenuVisible(false);
    if (!selectedCargo) return;

    if (action === 'view') {
      navigation.navigate('CargoDetails', { id: selectedCargo.id });
    } else if (action === 'edit') {
      navigation.navigate('Cargo', { editId: selectedCargo.id }); // Use existing Cargo tab for edit
    }
  };

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.statusRow}>
          <Text style={styles.bookingNo}>{item.booking_no || `#${item.id}`}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => { setSelectedCargo(item); setMenuVisible(true); }}
          style={{ padding: 4 }}
        >
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <View style={styles.partyContainer}>
        <View style={styles.partyItem}>
          <Text style={styles.partyLabel}>FROM</Text>
          <Text style={styles.partyName} numberOfLines={1}>{item.sender?.name || item.sender_name || 'N/A'}</Text>
        </View>
        <MaterialCommunityIcons name="arrow-right-thin" size={24} color="#CBD5E1" style={{ marginHorizontal: 12, marginTop: 10 }} />
        <View style={styles.partyItem}>
          <Text style={styles.partyLabel}>TO</Text>
          <Text style={styles.partyName} numberOfLines={1}>{item.receiver?.name || item.receiver_name || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.cardMiddle}>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="weight" size={14} color="#64748B" />
          <Text style={styles.metricText}>{item.total_weight || 0}kg</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.currencyText}>SAR</Text>
          <Text style={styles.priceText}>{item.net_total || item.total_amount || '0.00'}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
            style={[styles.actionBtn, styles.btnSingle]} 
            onPress={() => handleViewSingle(item)}
        >
            <MaterialCommunityIcons name="information-outline" size={18} color="#0F172A" />
            <Text style={styles.btnTextSingle}>Details</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.actionBtn, styles.btnBill]} 
            onPress={() => handleViewBill(item)}
        >
            <MaterialCommunityIcons name="file-document-outline" size={18} color="#FFF" />
            <Text style={styles.btnTextBill}>Bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Cargo List</Text>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search booking number"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={cargos}
          renderItem={renderCard}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4} 
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} /> : null}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="package-variant" size={48} color="#E2E8F0" />
              <Text style={styles.emptyTitle}>No results</Text>
              <Text style={styles.emptySub}>Try searching for another booking number</Text>
            </View>
          }
        />
      )}

      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.contextMenu}>
              <Text style={styles.menuTitle}>Actions: {selectedCargo?.booking_no}</Text>
              
              <TouchableOpacity style={styles.menuOption} onPress={() => handleMenuAction('view')}>
                <MaterialCommunityIcons name="eye-outline" size={22} color="#0F172A" />
                <Text style={styles.optionLabel}>View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuOption} onPress={() => handleMenuAction('edit')}>
                <MaterialCommunityIcons name="pencil-outline" size={22} color="#0F172A" />
                <Text style={styles.optionLabel}>Edit Cargo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 15, letterSpacing: -0.5 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#1E293B' },
  listContent: { 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: Platform.OS === 'ios' ? 120 : 100 
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  bookingNo: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  statusPill: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 10 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#16A34A', textTransform: 'uppercase' },
  partyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 12 },
  partyItem: { flex: 1 },
  partyLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 },
  partyName: { fontSize: 14, fontWeight: '700', color: '#334155' },
  cardMiddle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  metric: { flexDirection: 'row', alignItems: 'center' },
  metricText: { fontSize: 14, fontWeight: '600', color: '#64748B', marginLeft: 4 },
  priceContainer: { flexDirection: 'row', alignItems: 'center' },
  currencyText: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginRight: 4, marginTop: 2 },
  priceText: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  cardActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9', 
    paddingTop: 12,
    gap: 10
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  btnSingle: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  btnBill: { backgroundColor: colors.secondary },
  btnTextSingle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  btnTextBill: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center' },
  contextMenu: { backgroundColor: '#FFF', width: '80%', borderRadius: 20, padding: 20, elevation: 10 },
  menuTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 15 },
  menuOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  optionLabel: { fontSize: 16, color: '#0F172A', fontWeight: '600', marginLeft: 12 },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
});