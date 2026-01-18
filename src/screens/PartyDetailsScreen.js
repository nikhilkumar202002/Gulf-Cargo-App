import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, 
  Image, TouchableOpacity, Platform, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPartyDetails } from '../services/partiesServices';
import colors from '../styles/colors';

export default function PartyDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params; 
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      const response = await getPartyDetails(id);
      // Handle response.data.data (common Laravel pattern) or response.data
      setParty(response.data.data || response.data);
    } catch (error) {
      console.error("Error fetching details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const DetailRow = ({ icon, label, value }) => (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value && String(value).trim() !== '' ? String(value) : 'N/A'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        
        {/* --- CUSTOM HEADER --- */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Party Details</Text>
          <View style={{width: 28}} />
        </View>

        {/* --- CONTENT --- */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !party ? (
          <View style={styles.center}>
            <Text style={{color: '#666'}}>No details found.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* PROFILE CARD */}
            <View style={styles.headerCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {party.name ? party.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
              <Text style={styles.name}>{party.name}</Text>
              <Text style={[
                  styles.type, 
                  // Visual cue: Blue for Sender, Green for Receiver
                  { backgroundColor: party.customer_type_id == 1 ? '#e3f2fd' : '#e8f5e9',
                    color: party.customer_type_id == 1 ? '#1976d2' : '#2e7d32' }
              ]}>
                {/* FIX: Use loose equality (==) to handle string "1" vs number 1 */}
                {party.customer_type_id == 1 ? 'Sender' : 'Receiver'}
              </Text>
            </View>

            {/* CONTACT INFO */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Info</Text>
              <DetailRow icon="email" label="Email" value={party.email} />
              <DetailRow icon="whatsapp" label="WhatsApp" value={party.whatsapp_number} />
              <DetailRow icon="phone" label="Contact Number" value={party.contact_number} />
            </View>

            {/* ADDRESS DETAILS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address Details</Text>
              
              <DetailRow 
                icon="flag" 
                label="Country" 
                // Fix: Check object first, then flat field
                value={party.country?.name || party.country_name} 
              />
              
              <DetailRow 
                icon="city" 
                label="State / City" 
                value={`${party.state?.name || party.state_name || ''} / ${party.city || ''}`} 
              />
              
              <DetailRow 
                icon="map-marker" 
                label="District" 
                // Fix: Check object first, then flat field
                value={party.district?.name || party.district_name} 
              />
              
              <DetailRow icon="home" label="Full Address" value={party.address} />
              <DetailRow icon="mailbox" label="Postal Code" value={party.postal_code} />
            </View>

            {/* IDENTIFICATION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Identification</Text>
              
              <DetailRow 
                icon="card-account-details" 
                label="ID Type" 
                // Fix: Your API likely uses 'document_name', not 'name' for doc types
                value={
                    party.document_type?.document_name || 
                    party.document_type?.name || 
                    party.document_type_name
                } 
              />
              
              <DetailRow 
                icon="numeric" 
                label="ID Number" 
                value={party.document_id} 
              />
              
              {party.document_url ? (
                  <View style={styles.docContainer}>
                      <Text style={styles.label}>Uploaded Document:</Text>
                      <Image source={{uri: party.document_url}} style={styles.docImage} resizeMode="cover" />
                  </View>
              ) : null}
            </View>
            
            <View style={{height: 30}} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Navigation Header
  navHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },

  scrollContent: { paddingTop: 10 },
  
  // Header Card
  headerCard: { 
    backgroundColor: '#fff', alignItems: 'center', padding: 20, marginBottom: 15,
    borderBottomWidth: 1, borderColor: '#eee'
  },
  avatar: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#eef2ff', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 10 
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: colors.secondary },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  type: { 
    fontSize: 14, marginTop: 4, paddingHorizontal: 12, paddingVertical: 4, 
    borderRadius: 12, overflow: 'hidden', fontWeight: '600'
  },
  
  // Section Styles
  section: { 
    backgroundColor: '#fff', padding: 16, marginBottom: 15, marginHorizontal: 16, 
    borderRadius: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: {width:0, height:1}
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
  
  // Row Styles
  row: { flexDirection: 'row', marginBottom: 16 },
  iconBox: { width: 40, alignItems: 'center', paddingTop: 2 },
  detailContent: { flex: 1 },
  label: { fontSize: 12, color: '#888', marginBottom: 2 },
  value: { fontSize: 15, color: '#333', fontWeight: '500' },
  
  // Doc Image
  docContainer: { marginTop: 10 },
  docImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 8, backgroundColor: '#eee' }
});