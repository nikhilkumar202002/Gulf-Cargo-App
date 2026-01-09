import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
  TouchableOpacity, RefreshControl, TextInput, Animated, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getCargoList, searchCargoByBookingNo } from '../services/cargoService';
import { generateInvoicePDF } from '../services/pdfGenerator'; // Import Generator
import { useUser } from '../context/UserContext'; // Import User Context
import colors from '../styles/colors';

// ... (Keep SkeletonCard Component as is) ...
const SkeletonCard = () => { /* ... same code ... */ return <View style={styles.card} /> };

export default function CargoListScreen() {
  const navigation = useNavigation();
  const { userData } = useUser(); // Get Logged In User Data
  
  // ... (Keep existing state: cargos, loading, search, etc.) ...
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // ... (Keep fetchCargos, handleSearch, handleLoadMore, handleRefresh) ...
  useEffect(() => { fetchCargos(1); }, []);

  const fetchCargos = async (pageNum) => {
      // ... same logic ...
      try {
        if (pageNum === 1) setLoading(true);
        const response = await getCargoList(pageNum);
        const list = response.data.data || response.data || [];
        const meta = response.data.meta || {}; 
        if (pageNum === 1) setCargos(list);
        else setCargos(prev => [...prev, ...list]);
        if (meta.last_page) setLastPage(meta.last_page);
        else list.length < 10 ? setLastPage(pageNum) : setLastPage(pageNum + 100);
      } catch (e) { console.error(e); } finally { setLoading(false); setLoadingMore(false); setRefreshing(false); }
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
     } catch (e) { setCargos([]); } finally { setLoading(false); }
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

  // --- NEW PDF HANDLER ---
  const handleViewInvoice = async (item) => {
    try {
        // Pass item data AND userData (for header info)
        await generateInvoicePDF(item, userData);
    } catch (error) {
        Alert.alert("Error", "Could not generate invoice PDF.");
    }
  };

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.idBadge}>
            <MaterialCommunityIcons name="file-document-outline" size={16} color="#fff" />
            <Text style={styles.idText}>
                {item.booking_no ? item.booking_no : `#${item.id}`}
            </Text>
        </View>
        <Text style={styles.dateText}>
            {new Date(item.created_at || item.date).toDateString()}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.partyBox}>
            <Text style={styles.label}>SENDER</Text>
            <Text style={styles.partyName} numberOfLines={1}>
                {item.sender?.name || item.sender_name || 'N/A'}
            </Text>
        </View>
        <MaterialCommunityIcons name="arrow-right" size={20} color="#ccc" style={{marginTop: 10}} />
        <View style={[styles.partyBox, { alignItems: 'flex-end' }]}>
            <Text style={styles.label}>RECEIVER</Text>
            <Text style={styles.partyName} numberOfLines={1}>
                {item.receiver?.name || item.receiver_name || 'N/A'}
            </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
         <View style={styles.infoPill}>
            <MaterialCommunityIcons name="weight-kilogram" size={16} color="#666" />
            <Text style={styles.infoText}>{item.total_weight || 0} kg</Text>
         </View>
         
         <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total:</Text>
            <Text style={styles.amountValue}>{item.net_total || item.total_amount || '0.00'} SAR</Text>
         </View>
      </View>

      {/* --- NEW BUTTON ROW --- */}
      <View style={{marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'flex-end'}}>
         <TouchableOpacity 
            style={styles.invoiceBtn}
            onPress={() => handleViewInvoice(item)}
         >
            <MaterialCommunityIcons name="file-eye-outline" size={18} color={colors.primary} />
            <Text style={styles.invoiceBtnText}>View Invoice</Text>
         </TouchableOpacity>
      </View>

    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
            <MaterialCommunityIcons name="magnify" size={20} color="#888" style={{marginRight: 8}} />
            <TextInput 
                style={styles.searchInput}
                placeholder="Search by Booking No..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                clearButtonMode="while-editing"
            />
        </View>
      </View>

      {loading ? (
         <View style={{padding: 16}}>
            {[1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
         </View>
      ) : (
        <FlatList
          data={cargos}
          renderItem={renderCard}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5} 
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={colors.primary} style={{margin: 20}} /> : null}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="package-variant" size={50} color="#ddd" />
                <Text style={styles.emptyText}>{isSearching ? 'No booking found.' : 'No shipments found.'}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (Keep existing styles) ...
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  searchContainer: { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f7fa', borderRadius: 8, paddingHorizontal: 12, height: 45, borderWidth: 1, borderColor: '#e0e0e0' },
  searchInput: { flex: 1, height: '100%', fontSize: 16, color: '#333' },
  
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, padding: 15, borderWidth: 1, borderColor: '#e0e0e0', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  idBadge: { flexDirection: 'row', backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignItems: 'center' },
  idText: { color: '#fff', fontWeight: 'bold', marginLeft: 5, fontSize: 12 },
  dateText: { color: '#888', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  partyBox: { flex: 1 },
  label: { fontSize: 10, color: '#aaa', fontWeight: 'bold', marginBottom: 2 },
  partyName: { fontSize: 14, fontWeight: '600', color: '#333' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoPill: { flexDirection: 'row', backgroundColor: '#f5f5f5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignItems: 'center' },
  infoText: { fontSize: 13, color: '#555', marginLeft: 5, fontWeight: '500' },
  amountBox: { flexDirection: 'row', alignItems: 'center' },
  amountLabel: { fontSize: 12, color: '#888', marginRight: 5 },
  amountValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', fontSize: 16, marginTop: 10 },
  skeletonBox: { backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 5 },

  // New Button Style
  invoiceBtn: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.primary },
  invoiceBtnText: { color: colors.primary, fontWeight: '600', fontSize: 12, marginLeft: 5 }
});