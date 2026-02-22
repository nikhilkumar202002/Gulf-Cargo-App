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
  getAllDocumentTypes 
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

  // --- LOADING STATES ---
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalType, setModalType] = useState(null); 
  const [manualDistrict, setManualDistrict] = useState(false);

  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));
  const isLandscape = windowDimensions.width > windowDimensions.height;

  const [form, setForm] = useState({
    name: '', email: '', whatsapp_code: '+966', whatsapp_number: '',
    customer_type_id: 1, country_id: '', country_name: '',
    state_id: '', state_name: '', district_id: '', district_name: '',
    city: '', address: ''
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
      const [co, partyRes] = await Promise.all([
          getAllCountries(), getPartyDetails(id)
      ]);

      setCountries(safeExtract(co));

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
        whatsapp_code: party.whatsapp_code || '+966',
        whatsapp_number: party.whatsapp_number || '',
        customer_type_id: party.customer_type_id || 1,
        country_id: party.country_id,
        country_name: party.country?.name || party.country_name,
        state_id: party.state_id,
        state_name: party.state?.name || party.state_name,
        district_id: party.district_id,
        district_name: party.district?.name || party.district_name,
        city: party.city || '',
        address: party.address || ''
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
          <Text style={styles.headerTitle}>Edit Sender</Text>
          <View style={{width: 24}} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isLandscape && styles.scrollContentLandscape]}>
            {/* BASIC INFO */}
            <View style={isLandscape ? styles.twoColumnLayout : {}}>
              <View style={isLandscape ? {flex: 1, marginRight: 8} : {}}>
                {renderInput("Name", form.name, t => setForm({...form, name: t}))}
              </View>
              <View style={isLandscape ? {flex: 1, marginLeft: 8} : {}}>
                {renderInput("Email", form.email, t => setForm({...form, email: t}))}
              </View>
            </View>
            
            {/* WHATSAPP */}
            <View style={{marginBottom: 15}}>
                <Text style={{fontSize: 12, color:'#666', marginBottom: 5}}>WhatsApp Number</Text>
                <View style={isLandscape ? styles.twoColumnLayout : {flexDirection: 'row', gap: 8}}>
                    <TextInput value={form.whatsapp_code} onChangeText={t => setForm({...form, whatsapp_code: t})} style={[styles.input, isLandscape ? {flex: 0.4} : {flex: 0.3}]} placeholder="+966"/>
                    <TextInput value={form.whatsapp_number} onChangeText={t => setForm({...form, whatsapp_number: t})} style={[styles.input, isLandscape ? {flex: 0.6} : {flex: 0.7}]} placeholder="Number"/>
                </View>
            </View>

            {/* LOCATION */}
            <View style={isLandscape ? styles.twoColumnLayout : {}}>
              <View style={isLandscape ? {flex: 1, marginRight: 8} : {}}>
                {renderDropdown("Country", form.country_name, 'country')}
              </View>
              <View style={isLandscape ? {flex: 1, marginLeft: 8} : {}}>
                {renderDropdown("State", form.state_name, 'state')}
              </View>
            </View>
            
            {manualDistrict 
               ? renderInput("District", form.district_name, t => setForm({...form, district_name: t}))
               : renderDropdown("District", form.district_name, 'district')
            }
            
            <View style={isLandscape ? styles.twoColumnLayout : {}}>
              <View style={isLandscape ? {flex: 1, marginRight: 8} : {}}>
                {renderInput("City", form.city, t => setForm({...form, city: t}))}
              </View>
              <View style={isLandscape ? {flex: 1, marginLeft: 8} : {}}></View>
            </View>

            {renderInput("Address", form.address, t => setForm({...form, address: t}))}
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff"/> : <Text style={{color:'#fff', fontWeight:'bold'}}>Update Sender</Text>}
            </TouchableOpacity>
        </ScrollView>

        <BottomSheetSelect visible={modalType === 'country'} title="Country" data={countries} onClose={()=>setModalType(null)} onSelect={handleCountrySelect}/>
        <BottomSheetSelect visible={modalType === 'state'} title="State" data={states} onClose={()=>setModalType(null)} onSelect={handleStateSelect}/>
        <BottomSheetSelect visible={modalType === 'district'} title="District" data={districts} onClose={()=>setModalType(null)} onSelect={i => setForm({...form, district_id:i.id, district_name:i.name})}/>
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
    saveBtn: { backgroundColor: colors.primary, padding: 15, borderRadius: 10, alignItems:'center', marginTop: 20, marginBottom: 20, height: 48, justifyContent: 'center'}
});
