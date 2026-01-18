import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPartyDetails } from '../services/partiesServices';
import colors from '../styles/colors';

export default function PartyDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params; // Get ID passed from navigation
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      const response = await getPartyDetails(id);
      setParty(response.data.data || response.data);
    } catch (error) {
      console.error("Error fetching details", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!party) return <View style={styles.center}><Text>No details found.</Text></View>;

  const DetailRow = ({ icon, label, value }) => (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{flex:1}}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{party.name ? party.name.charAt(0).toUpperCase() : '?'}</Text>
        </View>
        <Text style={styles.name}>{party.name}</Text>
        <Text style={styles.type}>{party.customer_type_id === 1 ? 'Sender' : 'Receiver'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Info</Text>
        <DetailRow icon="email" label="Email" value={party.email} />
        <DetailRow icon="whatsapp" label="WhatsApp" value={party.whatsapp_number} />
        <DetailRow icon="phone" label="Contact Number" value={party.contact_number} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address Details</Text>
        <DetailRow icon="flag" label="Country" value={party.country?.name || party.country_name} />
        <DetailRow icon="city" label="State/City" value={`${party.state?.name || party.state_name || ''} / ${party.city}`} />
        <DetailRow icon="map-marker" label="District" value={party.district?.name || party.district_name} />
        <DetailRow icon="home" label="Full Address" value={party.address} />
        <DetailRow icon="mailbox" label="Postal Code" value={party.postal_code} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identification</Text>
        <DetailRow icon="card-account-details" label="ID Type" value={party.document_type?.name || party.document_type_name} />
        <DetailRow icon="numeric" label="ID Number" value={party.document_id} />
        
        {/* If there is a document image */}
        {party.document_url && (
            <View style={{marginTop: 10}}>
                <Text style={styles.label}>Uploaded Document:</Text>
                <Image source={{uri: party.document_url}} style={styles.docImage} resizeMode="cover" />
            </View>
        )}
      </View>
      <View style={{height: 30}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: { backgroundColor: '#fff', alignItems: 'center', padding: 20, marginBottom: 15 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: colors.secondary },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  type: { fontSize: 14, color: '#666', marginTop: 4, backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8 },
  
  section: { backgroundColor: '#fff', padding: 16, marginBottom: 15, marginHorizontal: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
  
  row: { flexDirection: 'row', marginBottom: 16 },
  iconBox: { width: 40, alignItems: 'center', paddingTop: 2 },
  label: { fontSize: 12, color: '#888', marginBottom: 2 },
  value: { fontSize: 15, color: '#333', fontWeight: '500' },
  docImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 8, backgroundColor: '#eee' }
});