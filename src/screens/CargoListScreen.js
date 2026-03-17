import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
  TouchableOpacity, RefreshControl, TextInput, Platform, StatusBar,
  Modal, Pressable 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getCargoList, searchCargoByBookingNo } from '../services/cargoService';
import { generateInvoicePDF } from '../services/pdfGenerator';
import { useUser } from '../context/UserContext';
import colors from '../styles/colors';

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
  const [error, setError] = useState(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState(null);

  useEffect(() => { 
    fetchCargos(1); 
  }, []);

  const fetchCargos = async (pageNum) => {
    try {
      if (pageNum === 1) setLoading(true);
      setError(null);
      const response = await getCargoList(pageNum);
      
      // Handle different response formats
      let list = [];
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        list = response.data.data;
      } else if (Array.isArray(response.data)) {
        list = response.data;
      } else if (response.data) {
        list = [response.data];
      }
      
      const meta = response.data?.meta || {};

      if (pageNum === 1) setCargos(list);
      else setCargos(prev => [...prev, ...list]);

      setLastPage(meta.last_page || (list.length < 10 ? pageNum : pageNum + 1));
    } catch (e) { 
      setError(e.response?.data?.message || e.message || 'Failed to load cargo list');
      setCargos([]);
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
      setError(null);
      const response = await searchCargoByBookingNo(text);
      const results = response.data.data || response.data || [];
      setCargos(Array.isArray(results) ? results : [results]);
    } catch (e) { 
      setError(e.message || 'Search failed');
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

  const handleMenuAction = async (action) => {
    setMenuVisible(false);
    if (!selectedCargo) return;

    if (action === 'view') {
      navigation.navigate('CargoDetails', { id: selectedCargo.id });
    } else if (action === 'edit') {
      navigation.navigate('CargoEdit', { id: selectedCargo.id }); 
    } else if (action === 'bill') {
        try {
          console.log('[Cargo List] Calling generateInvoicePDF with:', { cargoId: selectedCargo.id, bookingNo: selectedCargo.booking_no });
          await generateInvoicePDF(selectedCargo, userData);
          console.log('[Cargo List] Invoice generation completed successfully');
        } catch (error) {
          console.error('[Cargo List] Error calling generateInvoicePDF:', error);
        }
    }
  };

  const renderCard = ({ item }) => {
    const bookingNo = item.booking_no || `#${item.id}`;
    // Format date as YYYY-MM-DD | HH:mm (mocking time if needed or parsing actual)
    const dateObj = new Date(item.created_at || item.date);
    const dateStr = dateObj.toISOString().split('T')[0];
    const timeStr = dateObj.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
    
    // Safety check for boxes/weight
    const boxCount = item.no_of_boxes || (Array.isArray(item.boxes) ? item.boxes.length : 0);
    const totalWeight = item.total_weight || (Array.isArray(item.boxes) ? item.boxes.reduce((sum, box) => sum + parseFloat(box.weight || 0), 0) : 0);
    const weight = parseFloat(totalWeight).toFixed(3);

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9}
        onPress={() => { setSelectedCargo(item); setMenuVisible(true); }}
      >
        {/* Top Row: Invoice Label & Badge */}
        <View style={styles.cardHeader}>
            <View>
                <Text style={styles.invoiceLabel}>Invoice Number</Text>
                <Text style={styles.branchLabel}>Gulf Cargo KSA Riyadh</Text>
            </View>
            <View style={styles.invoiceBadge}>
                <Text style={styles.invoiceBadgeText}>{bookingNo}</Text>
            </View>
        </View>

        {/* --- DIVIDER LINE ADDED HERE --- */}
        <View style={styles.cardDivider} />

        {/* Middle Row: Date | Boxes | Weight */}
        <View style={styles.metaRow}>
            <Text style={styles.metaText}>{dateStr} | {timeStr}</Text>
            <Text style={styles.metaText}>{boxCount} Boxes | {weight} kg</Text>
        </View>

        {/* Bottom Row: Parties */}
        <View style={styles.partiesRow}>
            {/* Shipper */}
            <View style={styles.partyColumn}>
                <Text style={styles.partyLabel}>Shipper</Text>
                <Text style={styles.partyName} numberOfLines={1}>
                    {item.sender?.name || item.sender_name || 'N/A'}
                </Text>
            </View>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
                <View style={styles.arrowLine} />
                <MaterialCommunityIcons name="arrow-right-thin" size={20} color="#ccc" />
            </View>

            {/* Consignee */}
            <View style={[styles.partyColumn, {alignItems: 'flex-end'}]}>
                <Text style={styles.partyLabel}>Consignee</Text>
                <Text style={styles.partyName} numberOfLines={1}>
                    {item.receiver?.name || item.receiver_name || 'N/A'}
                </Text>
            </View>
        </View>

        {/* Net Total Row */}
        <View style={styles.netTotalRow}>
            <Text style={styles.netTotalLabel}>Net Total</Text>
            <Text style={styles.netTotalValue}>SAR {parseFloat(item.net_total || 0).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Context Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
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
            
            <TouchableOpacity style={styles.menuOption} onPress={() => handleMenuAction('bill')}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color="#0F172A" />
              <Text style={styles.optionLabel}>Generate Bill</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
      
      {/* Search Header */}
      <View style={styles.headerContainer}>
        {/* Removed "All Cargo List" text if you want it cleaner like the search-only header in some UI, 
            but keeping per previous request. */}
        <Text style={styles.pageTitle}>All Cargo List</Text>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" style={{marginRight: 8}} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search Senders or Receivers....."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error Loading Cargo</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => { setError(null); fetchCargos(1); }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
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
              <Text style={styles.emptyTitle}>No shipments found</Text>
            </View>
          }
        />
      )}

    </SafeAreaView>
  </>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' }, // Light gray background
  
  // Header
  headerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 20,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    height: '100%',
  },

  // List
  listContent: { 
    padding: 16,
    paddingBottom: 100 
  },
  
  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  // Card Header (Invoice info)
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8, // Reduced slightly to hug the divider
  },
  invoiceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  branchLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  invoiceBadge: {
    backgroundColor: '#34339A', // Deep purple from screenshot
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  invoiceBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // NEW DIVIDER STYLE
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6', // Very light gray divider
    marginVertical: 10,
  },

  // Meta Row (Date | Boxes)
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Parties Row
  partiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partyColumn: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444', // Red
    marginBottom: 2,
  },
  partyName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Arrow Divider
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  arrowLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    flex: 1,
  },

  // Net Total Row
  netTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  netTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  netTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34339A',
  },

  // Misc
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16 },
  errorMessage: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 20 },
  retryButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Modal
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 20
  },
  contextMenu: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 20,
    maxWidth: '90%',
    minWidth: 280
  },
  menuTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 15, textTransform: 'uppercase' },
  menuOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  optionLabel: { fontSize: 15, color: '#111827', marginLeft: 12 },
});