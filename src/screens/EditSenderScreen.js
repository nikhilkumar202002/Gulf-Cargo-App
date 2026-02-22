import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, 
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getPartyDetails, updateParty } from '../services/partiesServices';
import { 
  getAllCountries, getStatesByCountry, getDistrictsByState, 
  getAllDocumentTypes, getAllPhoneCodes 
} from '../services/coreServices'; 
import BottomSheetSelect from './cargo_wizard/components/BottomSheetSelect';
import colors from '../styles/colors'; 

export default function EditSenderScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;

  // --- MASTER DATA ---
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [phoneCodes, setPhoneCodes] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  // --- LOADING STATES ---
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalType, setModalType] = useState(null); 
  const [manualDistrict, setManualDistrict] = useState(false);

  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));
  const isLandscape = windowDimensions.width > windowDimensions.height;

  const [form, setForm] = useState({
    name: '', email: '', contact_code: '+966', contact_number: '',
    whatsapp_code: '+966', whatsapp_number: '', use_same_number: false,
    customer_type_id: 1, country_id: '', country_name: '',
    state_id: '', state_name: '', district_id: '', district_name: '',
    city: '', address: '',
    document_type_id: '', document_type_name: '',
    document_id: '', document_file: null
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  const safeExtract = (res) => {
    if(res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
    if(res?.data && Array.isArray(res.data)) return res.data;
    if(Array.isArray(res)) return res;
    return [];
  };

  const loadInitialData = async () => {
    try {
      const [co, pc, dt, partyRes] = await Promise.all([
          getAllCountries(), getAllPhoneCodes(), getAllDocumentTypes(), getPartyDetails(id)
      ]);

      setCountries(safeExtract(co));
      setPhoneCodes(safeExtract(pc).map(i => ({ ...i, name: `${i.country_name || ''} (${i.code})` })));
      setDocTypes(safeExtract(dt).map(i => ({ ...i, name: i.document_name })));

      const party = partyRes.data.data || partyRes.data;
      
      let loadedStates = [];
      let loadedDistricts = [];

      if(party.country_id) {
         const sRes = await getStatesByCountry(party.country_id);
         loadedStates = safeExtract(sRes).filter(s => s.country_id == party.country_id);
         setStates(loadedStates);
      }
      if(party.state_id) {
         const dRes = await getDistrictsByState(party.state_id);
         loadedDistricts = safeExtract(dRes).filter(d => d.state_id == party.state_id);
         setDistricts(loadedDistricts);
         if(loadedDistricts.length === 0) setManualDistrict(true);
      }

      setForm({
        name: party.name || '',
        email: party.email || '',
        contact_code: party.contact_code || '+966',
        contact_number: party.contact_number || '',
        whatsapp_code: party.whatsapp_code || '+966',
        whatsapp_number: party.whatsapp_number || '',
        use_same_number: false,
        customer_type_id: party.customer_type_id || 1,
        country_id: party.country_id,
        country_name: party.country?.name || party.country_name,
        state_id: party.state_id,
        state_name: party.state?.name || party.state_name,
        district_id: party.district_id,
        district_name: party.district?.name || party.district_name,
        city: party.city || '',
        address: party.address || '',
        document_type_id: party.document_type_id,
        document_type_name: party.document_type?.name,
        document_id: party.document_id || '',
        document_file: null
      });

    } catch(e) {
      console.error(e);
      Alert.alert("Error", "Failed to load sender details");
      navigation.goBack();
    } finally {
      setFetching(false);
    }
  };

  const handleCountrySelect = async (item) => {
     setForm(p => ({...p, country_id: item.id, country_name: item.name, state_id:'', district_id:''}));
     try {
       const res = await getStatesByCountry(item.id);
       setStates(safeExtract(res).filter(s => s.country_id == item.id));
     } catch(e){}
  };

  const handleStateSelect = async (item) => {
     setForm(p => ({...p, state_id: item.id, state_name: item.name, district_id:''}));
     setManualDistrict(false);
     try {
       const res = await getDistrictsByState(item.id);
       const list = safeExtract(res).filter(d => d.state_id == item.id);
       setDistricts(list);
       if(list.length === 0) setManualDistrict(true);
     } catch(e){ setManualDistrict(true); }
  };

  const handleSubmit = async () => {
     setSaving(true);
     try {
        const formData = new FormData();
        Object.keys(form).forEach(key => {
            if(form[key] !== null) formData.append(key, form[key]);
        });
        
        if(!manualDistrict && form.district_id) formData.append('district_id', form.district_id);
        else if(manualDistrict && form.district_name) formData.append('district_name', form.district_name);
        
        const response = await updateParty(id, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        
        if(response.data.success || response.status === 200) {
            Alert.alert("Success", "Sender updated successfully", [{ text: "OK", onPress: () => navigation.goBack() }]);
        } else {
            Alert.alert("Error", response.data.message || "Update failed");
        }

     } catch(e) {
        console.error(e);
        Alert.alert("Error", "Failed to update sender");
     } finally {
        setSaving(false);
     }
  };

  const renderInput = (label, val, setVal) => (
      <View style={{marginBottom: 15}}>
          <Text style={{fontSize: 12, color:'#666', marginBottom: 5}}>{label}</Text>
          <TextInput value={String(val)} onChangeText={setVal} style={styles.input} />
      </View>
  );

  const renderDropdown = (label, val, key) => (
    <View style={{marginBottom: 15}}>
        <Text style={{fontSize: 12, color:'#666', marginBottom: 5}}>{label}</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setModalType(key)}>
            <Text>{val || 'Select'}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#666"/>
        </TouchableOpacity>
    </View>
  );

  if(fetching) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary}/></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1, backgroundColor:'#fff'}}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Sender: {form.name}</Text>
          <View style={{width: 24}} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isLandscape && styles.scrollContentLandscape]}>
            {/* SECTION 1: PERSONAL & CONTACT INFO */}
            <Text style={styles.sectionTitle}>1. Personal & Contact Info</Text>
            
            {/* FULL NAME */}
            {renderInput("Full Name", form.name, t => setForm({...form, name: t}))}
            
            {/* CONTACT NUMBER */}
            <View style={{marginBottom: 15}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5}}>
                    <Text style={{fontSize: 12, color:'#666'}}>Contact Number</Text>
                    <TouchableOpacity onPress={() => setForm({...form, contact_number: form.whatsapp_number, contact_code: form.whatsapp_code})}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                            <View style={{width: 16, height: 16, borderWidth: 2, borderColor: '#4CAF50', borderRadius: 4, backgroundColor: form.contact_number === form.whatsapp_number ? '#4CAF50' : '#fff'}}/>
                            <Text style={{fontSize: 12, color: '#666'}}>Same as Contact</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={{flexDirection: 'row', gap: 8}}>
                    <TextInput value={form.contact_code} onChangeText={t => setForm({...form, contact_code: t})} style={[styles.input, {flex: 0.3}]} placeholder="+966"/>
                    <TextInput value={form.contact_number} onChangeText={t => setForm({...form, contact_number: t})} style={[styles.input, {flex: 0.7}]} placeholder="Number"/>
                </View>
            </View>

            {/* WHATSAPP NUMBER */}
            <View style={{marginBottom: 15}}>
                <Text style={{fontSize: 12, color:'#666', marginBottom: 5}}>WhatsApp Number</Text>
                <View style={{flexDirection: 'row', gap: 8}}>
                    <TextInput value={form.whatsapp_code} onChangeText={t => setForm({...form, whatsapp_code: t})} style={[styles.input, {flex: 0.3}]} placeholder="+966"/>
                    <TextInput value={form.whatsapp_number} onChangeText={t => setForm({...form, whatsapp_number: t})} style={[styles.input, {flex: 0.7}]} placeholder="Number"/>
                </View>
            </View>

            {/* SECTION 2: DOCUMENTS */}
            <Text style={styles.sectionTitle}>2. Documents</Text>
            
            {/* ID TYPE */}
            {renderDropdown("ID Type", form.document_type_name, 'doctype')}
            
            {/* DOCUMENT ID */}
            {renderInput("Document ID", form.document_id, t => setForm({...form, document_id: t}))}
            
            {/* SECTION 3: ADDRESS (READ-ONLY) */}
            <Text style={styles.sectionTitle}>3. Address</Text>
            <View style={{marginBottom: 15}}>
                <Text style={{fontSize: 12, color:'#666', marginBottom: 5}}>Address</Text>
                <View style={[styles.input, {backgroundColor: '#f0f0f0', borderColor: '#ccc'}]}>
                    <Text style={{color: '#666', fontSize: 14}}>{form.address || 'No address provided'}</Text>
                </View>
            </View>
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff"/> : <Text style={{color:'#fff', fontWeight:'bold'}}>Update Sender</Text>}
            </TouchableOpacity>
        </ScrollView>

        <BottomSheetSelect visible={modalType === 'doctype'} title="ID Type" data={docTypes} onClose={()=>setModalType(null)} onSelect={i => setForm({...form, document_type_id:i.id, document_type_name:i.name})}/>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    center: {flex:1, justifyContent:'center', alignItems:'center'},
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: 12,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#000',
    },
    scrollContent: {
      padding: 16,
      paddingTop: 20,
      paddingBottom: 30,
    },
    scrollContentLandscape: {
      paddingTop: 12,
      paddingBottom: 12,
    },
    twoColumnLayout: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    input: { borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:12, backgroundColor:'#f9f9f9', marginBottom: 15},
    dropdown: { borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:12, backgroundColor:'#f9f9f9', flexDirection:'row', justifyContent:'space-between'},
    saveBtn: { backgroundColor: colors.primary, padding: 15, borderRadius: 10, alignItems:'center', marginTop: 20, marginBottom: 20, height: 48, justifyContent: 'center'},
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e1e1e', marginBottom: 15, marginTop: 15 }
});
