import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, 
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getPartyDetails, updateParty } from '../services/partiesServices';
import { 
  getAllCountries, getStatesByCountry, getDistrictsByState, 
  getAllPhoneCodes, getAllDocumentTypes 
} from '../services/coreServices'; 
import BottomSheetSelect from './cargo_wizard/components/BottomSheetSelect'; // Reuse your existing component
import colors from '../styles/colors'; 

export default function EditPartyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;

  // --- MASTER DATA ---
  const [phoneCodes, setPhoneCodes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [docTypes, setDocTypes] = useState([]);

  // --- LOADING STATES ---
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalType, setModalType] = useState(null); 
  const [manualDistrict, setManualDistrict] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', whatsapp_code: '+966', whatsapp_number: '',
    contact_code: '+966', contact_number: '', use_same_number: false,
    customer_type_id: '', country_id: '', country_name: '',
    state_id: '', state_name: '', district_id: '', district_name: '',
    city: '', post: '', postal_code: '', address: '',
    document_type_id: '', document_type_name: '',
    document_id: '', document_file: null
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const safeExtract = (res) => {
    if(res?.data?.data) return res.data.data;
    if(res?.data) return res.data;
    return [];
  };

  const loadInitialData = async () => {
    try {
      // 1. Fetch Master Data
      const [pc, co, dt, partyRes] = await Promise.all([
          getAllPhoneCodes(), getAllCountries(), getAllDocumentTypes(), getPartyDetails(id)
      ]);

      setPhoneCodes(safeExtract(pc).map(i => ({ ...i, name: `${i.country_name || ''} (${i.code})` })));
      setCountries(safeExtract(co));
      setDocTypes(safeExtract(dt).map(i => ({ ...i, name: i.document_name })));

      // 2. Populate Form
      const party = partyRes.data.data || partyRes.data;
      
      // Load States/Districts for the existing location
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
        whatsapp_code: party.whatsapp_code || '+966', // Assuming API returns codes separately or handle split
        whatsapp_number: party.whatsapp_number || '',
        contact_code: party.contact_code || '+966',
        contact_number: party.contact_number || '',
        use_same_number: false,
        customer_type_id: party.customer_type_id,
        country_id: party.country_id,
        country_name: party.country?.name || party.country_name,
        state_id: party.state_id,
        state_name: party.state?.name || party.state_name,
        district_id: party.district_id,
        district_name: party.district?.name || party.district_name,
        city: party.city || '',
        post: party.post || '',
        postal_code: party.postal_code || '',
        address: party.address || '',
        document_type_id: party.document_type_id,
        document_type_name: party.document_type?.name,
        document_id: party.document_id || '',
        document_file: null // Files usually need re-uploading
      });

    } catch(e) {
      console.error(e);
      Alert.alert("Error", "Failed to load details");
      navigation.goBack();
    } finally {
      setFetching(false);
    }
  };

  // --- HANDLERS (Simpler versions of CreatePartyForm) ---
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
            if(form[key] !== null && key !== 'document_file') formData.append(key, form[key]);
        });
        
        // Handle District Logic
        if(!manualDistrict && form.district_id) formData.append('district_id', form.district_id);
        else if(manualDistrict && form.district_name) formData.append('district_name', form.district_name);

        if (form.document_file) {
            formData.append('documents[]', {
                uri: form.document_file.uri,
                name: form.document_file.name,
                type: form.document_file.mimeType || 'image/jpeg'
            });
        }
        
        // Call Update API
        const response = await updateParty(id, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        
        if(response.data.success || response.status === 200) {
            Alert.alert("Success", "Party updated successfully", [{ text: "OK", onPress: () => navigation.goBack() }]);
        } else {
            Alert.alert("Error", response.data.message || "Update failed");
        }

     } catch(e) {
        console.error(e);
        Alert.alert("Error", "Failed to update party");
     } finally {
        setSaving(false);
     }
  };

  // --- RENDER HELPERS ---
  const renderInput = (label, val, setVal) => (
      <View style={{marginBottom: 15}}>
          <Text style={{fontSize: 12, color:'#666', marginBottom: 5}}>{label}</Text>
          <TextInput value={val} onChangeText={setVal} style={styles.input} />
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
        <ScrollView contentContainerStyle={{padding: 20}}>
            <Text style={{fontSize: 20, fontWeight:'bold', marginBottom: 20}}>Edit Party</Text>
            
            {renderInput("Name", form.name, t => setForm({...form, name: t}))}
            {renderInput("WhatsApp", form.whatsapp_number, t => setForm({...form, whatsapp_number: t}))}
            
            {renderDropdown("Country", form.country_name, 'country')}
            {renderDropdown("State", form.state_name, 'state')}
            
            {manualDistrict 
               ? renderInput("District", form.district_name, t => setForm({...form, district_name: t}))
               : renderDropdown("District", form.district_name, 'district')
            }
            
            {renderInput("Address", form.address, t => setForm({...form, address: t}))}
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff"/> : <Text style={{color:'#fff', fontWeight:'bold'}}>Update Party</Text>}
            </TouchableOpacity>
        </ScrollView>

        {/* Modals reused */}
        <BottomSheetSelect visible={modalType === 'country'} title="Country" data={countries} onClose={()=>setModalType(null)} onSelect={handleCountrySelect}/>
        <BottomSheetSelect visible={modalType === 'state'} title="State" data={states} onClose={()=>setModalType(null)} onSelect={handleStateSelect}/>
        <BottomSheetSelect visible={modalType === 'district'} title="District" data={districts} onClose={()=>setModalType(null)} onSelect={i => setForm({...form, district_id:i.id, district_name:i.name})}/>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    center: {flex:1, justifyContent:'center', alignItems:'center'},
    input: { borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:12, backgroundColor:'#f9f9f9'},
    dropdown: { borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:12, backgroundColor:'#f9f9f9', flexDirection:'row', justifyContent:'space-between'},
    saveBtn: { backgroundColor: colors.primary, padding: 15, borderRadius: 10, alignItems:'center', marginTop: 20}
});