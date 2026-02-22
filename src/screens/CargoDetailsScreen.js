import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, 
  TouchableOpacity, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCargoDetails } from '../services/cargoService';
import { getPartyDetails } from '../services/partiesServices';
import colors from '../styles/colors';

export default function CargoDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;
  
  const [cargo, setCargo] = useState(null);
  const [senderFull, setSenderFull] = useState(null);
  const [receiverFull, setReceiverFull] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFullDetails();
  }, [id]);

  const fetchFullDetails = async () => {
    try {
      // 1. Fetch Cargo Details from your provided API response structure
      const cargoRes = await getCargoDetails(id);
      const cargoData = cargoRes.data.cargo || cargoRes.data.data || cargoRes.data;
      setCargo(cargoData);

      // 2. Fetch Full Party Details using the IDs from the response (sender_id: 20, receiver_id: 34)
      if (cargoData.sender_id || cargoData.receiver_id) {
          const [sRes, rRes] = await Promise.all([
              getPartyDetails(cargoData.sender_id),
              getPartyDetails(cargoData.receiver_id)
          ]);
          setSenderFull(sRes.data.data || sRes.data);
          setReceiverFull(rRes.data.data || rRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Could not load full cargo details.");
    } finally {
      setLoading(false);
    }
  };

  const DetailSection = ({ title, children, icon }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.secondary} style={{marginRight: 8}} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const PartyInfo = ({ title, party, fallbackName }) => {
    // Joining Address and City for "Full Details" view
    const address = [party?.address, party?.city].filter(Boolean).join(', ') || 'Address not available';
    return (
        <View style={styles.partyBox}>
            <Text style={styles.partyRole}>{title}</Text>
            <Text style={styles.partyName}>{party?.name || fallbackName}</Text>
            <Text style={styles.partySubText}>ID: {party?.id || 'N/A'}</Text>
            <View style={styles.detailRow}>
                <MaterialCommunityIcons name="phone" size={14} color="#64748B" />
                <Text style={styles.detailText}>{party?.contact_number || party?.phone || 'No phone'}</Text>
            </View>
            <View style={styles.detailRow}>
                <MaterialCommunityIcons name="map-marker" size={14} color="#64748B" />
                <Text style={styles.detailText}>{address}</Text>
            </View>
        </View>
    );
  };

  const AmountRow = ({ label, value, isTotal = false }) => (
    <View style={[styles.amountRow, isTotal && styles.netTotalContainer]}>
      <Text style={[styles.amountLabel, isTotal && styles.netTotalLabel]}>{label}</Text>
      <Text style={[styles.amountValue, isTotal && styles.netTotalValue]}>
        {parseFloat(value || 0).toFixed(2)} SAR
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking {cargo?.booking_no}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CargoEdit', { id })}>
          <MaterialCommunityIcons name="pencil" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. PARTIES DETAILS (Full Details) */}
        <DetailSection title="Parties Details" icon="account-group">
          <PartyInfo title="Sender" party={senderFull} fallbackName={cargo?.sender_name} />
          <View style={styles.divider} />
          <PartyInfo title="Receiver" party={receiverFull} fallbackName={cargo?.receiver_name} />
        </DetailSection>

        {/* 2. SHIPMENT INFO */}
        <DetailSection title="Shipment Details" icon="truck-delivery">
            <View style={styles.infoGrid}>
                <View style={styles.infoItem}><Text style={styles.infoLabel}>Method</Text><Text style={styles.infoVal}>{cargo?.shipping_method}</Text></View>
                <View style={styles.infoItem}><Text style={styles.infoLabel}>Type</Text><Text style={styles.infoVal}>{cargo?.delivery_type}</Text></View>
                <View style={styles.infoItem}><Text style={styles.infoLabel}>Weight</Text><Text style={styles.infoVal}>{cargo?.total_weight} kg</Text></View>
                <View style={styles.infoItem}><Text style={styles.infoLabel}>Status</Text><Text style={[styles.infoVal, {color: 'green'}]}>{cargo?.status}</Text></View>
            </View>
        </DetailSection>

        {/* 3. AMOUNT VIEW (Subtotal, Bill Total, Net Total Only) */}
        <DetailSection title="Amount View" icon="cash-multiple">
          <AmountRow label="Subtotal" value={cargo?.total_cost} />
          <AmountRow label="Bill Total" value={cargo?.bill_charges} />
          <AmountRow label="Net Total" value={cargo?.net_total} isTotal={true} />
        </DetailSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', fontFamily: 'InstrumentSans-Regular' },
  scrollContent: { padding: 16, backgroundColor: '#f8fafc' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.secondary, textTransform: 'uppercase', fontFamily: 'InstrumentSans-Regular' },
  partyBox: { paddingVertical: 5 },
  partyRole: { fontSize: 10, fontWeight: 'bold', color: colors.primary, textTransform: 'uppercase', marginBottom: 4, fontFamily: 'InstrumentSans-Regular' },
  partyName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', fontFamily: 'InstrumentSans-Regular' },
  partySubText: { fontSize: 12, color: '#94a3b8', marginBottom: 8, fontFamily: 'InstrumentSans-Regular' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  detailText: { fontSize: 13, color: '#475569', marginLeft: 8, flex: 1, fontFamily: 'InstrumentSans-Regular' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  infoItem: { width: '48%', marginBottom: 12 },
  infoLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'InstrumentSans-Regular' },
  infoVal: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginTop: 2, fontFamily: 'InstrumentSans-Regular' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  amountLabel: { fontSize: 14, color: '#64748b', fontWeight: '600', fontFamily: 'InstrumentSans-Regular' },
  amountValue: { fontSize: 15, color: '#1e293b', fontWeight: '700', fontFamily: 'InstrumentSans-Regular' },
  netTotalContainer: { marginTop: 10, paddingTop: 15, borderTopWidth: 2, borderTopColor: '#f1f5f9' },
  netTotalLabel: { fontSize: 16, color: '#1e293b', fontWeight: '800', fontFamily: 'InstrumentSans-Regular' },
  netTotalValue: { fontSize: 18, color: colors.primary, fontWeight: '900', fontFamily: 'InstrumentSans-Regular' }
});