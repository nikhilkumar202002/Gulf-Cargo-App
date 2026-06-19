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
import SkeletonLoader from '../components/SkeletonLoader';

export default function EditReceiverScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;

  // --- MASTER DATA ---
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [phoneCodes, setPhoneCodes] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);

  // --- LOADING STATES ---
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalType, setModalType] = useState(null); 
  const [manualDistrict, setManualDistrict] = useState(false);

  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));
  const isLandscape = windowDimensions.width > windowDimensions.height;

  const [form, setForm] = useState({
    name: '', email: '', contact_code: '+966', contact_number: '',
    whatsapp_code: '+966', whatsapp_number: '',
    customer_type_id: 2, country_id: '', country_name: '',
    state_id: '', state_name: '', district_id: '', district_name: '',
    city: '', post: '', postal_code: '', address: '',
    document_type_id: '', document_type_name: '', document_id: ''
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
      const [co, partyRes, docRes, pcRes] = await Promise.all([
          getAllCountries(), getPartyDetails(id), getAllDocumentTypes(), getAllPhoneCodes()
      ]);

      const countriesData = safeExtract(co);
      setCountries(countriesData);

      const phoneCodesData = safeExtract(pcRes);
      const formattedPhoneCodes = phoneCodesData.map(item => ({
        ...item,
        name: `${item.country_name || 'Unknown'} (${item.code})`
      }));
      setPhoneCodes(formattedPhoneCodes);

      const documentTypesData = safeExtract(docRes);
      const formattedDocTypes = documentTypesData.map(item => ({
        ...item,
        name: item.document_name
      }));
      setDocumentTypes(formattedDocTypes);

      const party = partyRes.data.data || partyRes.data;
      
      let loadedStates = [];
      let loadedDistricts = [];
      let countryName = '';
      let stateName = '';
      let districtName = '';
      let documentTypeName = '';

      // Get document type name
      if(party.document_type_id) {
         const docType = documentTypesData.find(d => d.id == party.document_type_id);
         documentTypeName = docType?.name || party.document_type_name || '';
      }

      // Get country name from countries array
      if(party.country_id) {
         const country = countriesData.find(c => c.id == party.country_id);
         countryName = country?.name || '';
         
         const sRes = await getStatesByCountry(party.country_id);
         loadedStates = safeExtract(sRes).filter(s => s.country_id == party.country_id);
         setStates(loadedStates);
         
         // Get state name from loaded states
         if(party.state_id) {
            const state = loadedStates.find(s => s.id == party.state_id);
            stateName = state?.name || '';
         }
      }
      
      if(party.state_id) {
         const dRes = await getDistrictsByState(party.state_id);
         loadedDistricts = safeExtract(dRes).filter(d => d.state_id == party.state_id);
         setDistricts(loadedDistricts);
         
         // Get district name from loaded districts or from party data
         if(party.district_id) {
            const district = loadedDistricts.find(d => d.id == party.district_id);
            districtName = district?.name || party.district_name || '';
         }
         
            if(loadedDistricts.length === 0 && districtName) {
                // Fallback: show dropdown with the saved district so the dropdown remains visible
                const fallbackId = party.district_id || 'saved-district';
                const fallbackName = districtName;
                setDistricts([{ id: fallbackId, name: fallbackName }]);
                setManualDistrict(false);
            } else if(loadedDistricts.length === 0) {
                setManualDistrict(true);
            }
        } else if (party.district_name) {
            // No state lookup available but we still have a saved district name; keep dropdown visible with fallback option
            districtName = party.district_name;
            const fallbackId = party.district_id || 'saved-district';
            setDistricts([{ id: fallbackId, name: districtName }]);
            setManualDistrict(false);
      }

      setForm({
        name: party.name || '',
        email: party.email || '',
        contact_code: party.contact_code || '+966',
        contact_number: party.contact_number || '',
        whatsapp_code: party.whatsapp_code || '+966',
        whatsapp_number: party.whatsapp_number || '',
        customer_type_id: party.customer_type_id || 2,
        country_id: party.country_id || '',
        country_name: countryName,
        state_id: party.state_id || '',
        state_name: stateName,
        district_id: party.district_id || '',
        district_name: districtName,
        city: party.city || '',
        post: party.post || '',
        postal_code: party.postal_code || '',
        address: party.address || '',
        document_type_id: party.document_type_id || '',
        document_type_name: documentTypeName,
        document_id: party.document_id || ''
      });

    } catch(e) {
      Alert.alert("Error", "Failed to load receiver details");
      navigation.goBack();
    } finally {
      setFetching(false);
    }
  };

  const handleCountrySelect = async (item) => {
     setForm(p => ({...p, country_id: item.id, country_name: item.name, state_id:'', state_name: '', district_id:'', district_name: ''}));
     setDistricts([]);
     try {
       const res = await getStatesByCountry(item.id);
       setStates(safeExtract(res).filter(s => s.country_id == item.id));
     } catch(e){}
  };

  const handleStateSelect = async (item) => {
     setForm(p => ({...p, state_id: item.id, state_name: item.name, district_id:'', district_name: ''}));
     setManualDistrict(false);
     try {
       const res = await getDistrictsByState(item.id);
       const list = safeExtract(res).filter(d => d.state_id == item.id);
       setDistricts(list);
       if(list.length === 0) setManualDistrict(true);
     } catch(e){ setManualDistrict(true); }
  };

  const handleContactCodeSelect = (item) => {
     setForm(p => ({...p, contact_code: item.code}));
     setModalType(null);
  };

  const handleWhatsappCodeSelect = (item) => {
     setForm(p => ({...p, whatsapp_code: item.code}));
     setModalType(null);
  };

  const handleDocumentTypeSelect = (item) => {
     setForm(p => ({...p, document_type_id: item.id, document_type_name: item.name}));
     setModalType(null);
  };

  const handleSubmit = async () => {
     setSaving(true);
     try {
        const formData = new FormData();
        
        // Only append essential fields for receiver update
        formData.append('name', form.name || '');
        formData.append('email', form.email || '');
        formData.append('contact_code', form.contact_code || '+966');
        formData.append('contact_number', form.contact_number || '');
        formData.append('whatsapp_code', form.whatsapp_code || '+966');
        formData.append('whatsapp_number', form.whatsapp_number || '');
        formData.append('customer_type_id', 2); // Receiver
        formData.append('city', form.city || '');
        formData.append('post', form.post || '');
        formData.append('postal_code', form.postal_code || '');
        formData.append('address', form.address || '');
        formData.append('document_type_id', form.document_type_id || '');
        formData.append('document_id', form.document_id || '');
        
        // Handle District Logic
        if(!manualDistrict && form.district_id) formData.append('district_id', form.district_id);
        else if(manualDistrict && form.district_name) formData.append('district_name', form.district_name);
        
        const response = await updateParty(id, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        
        if(response.data.success || response.status === 200) {
            Alert.alert("Success", "Receiver updated successfully", [{ text: "OK", onPress: () => navigation.goBack() }]);
        } else {
            Alert.alert("Error", response.data.message || "Update failed");
        }

     } catch(e) {
        Alert.alert("Error", "Failed to update receiver: " + (e.response?.data?.message || e.message));
     } finally {
        setSaving(false);
     }
  };

  const renderInput = (label, val, setVal) => (
      <View style={{marginBottom: 15}}>
          <Text style={styles.label}>{label}</Text>
          <TextInput value={val ? String(val) : ''} onChangeText={setVal} style={styles.input} editable={setVal !== null} />
      </View>
  );

  const renderDropdown = (label, val, key) => (
    <View style={{marginBottom: 15}}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => key && setModalType(key)} disabled={!key}>
            <Text style={{color: val ? '#333' : '#999'}}>{val || 'Select'}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#666"/>
        </TouchableOpacity>
    </View>
  );

  const renderSectionHeader = (number, title) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionNumberContainer}>
            <Text style={styles.sectionNumber}>{number}</Text>
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  if(fetching) return <SkeletonLoader variant="form" count={3} />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1, backgroundColor:'#f8f9ff'}}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Receiver</Text>
          <View style={{width: 24}} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isLandscape && styles.scrollContentLandscape]}>
            {/* SECTION 1: PERSONAL DETAILS */}
            <View style={styles.card}>
                {renderSectionHeader(1, "Personal Details")}
                <View style={styles.cardContent}>
                    {/* FULL NAME */}
                    <View style={{marginBottom: 15}}>
                        <Text style={styles.label}>Full Name <Text style={{color:'red'}}>*</Text></Text>
                        <TextInput value={form.name} onChangeText={t => setForm({...form, name: t})} style={styles.input} placeholder="Receiver Name"/>
                    </View>
                    
                    <View style={isLandscape ? styles.twoColumnLayout : {}}>
                        {/* CONTACT NUMBER */}
                        <View style={[isLandscape ? {flex: 1, marginRight: 8} : {marginBottom: 15}]}>
                            <Text style={styles.label}>Contact Number</Text>
                            <View style={{flexDirection: 'row', gap: 8}}>
                                <TouchableOpacity style={[styles.dropdown, {flex: 0.3}]} onPress={() => setModalType('contact_code')}>
                                    <Text style={{color: form.contact_code ? '#333' : '#999'}}>{form.contact_code || '+966'}</Text>
                                    <MaterialCommunityIcons name="chevron-down" size={16} color="#666"/>
                                </TouchableOpacity>
                                <TextInput value={form.contact_number} onChangeText={t => setForm({...form, contact_number: t})} style={[styles.input, {flex: 0.7}]} placeholder="Number"/>
                            </View>
                        </View>

                        {/* WHATSAPP NUMBER */}
                        <View style={[isLandscape ? {flex: 1, marginLeft: 8} : {marginBottom: 15}]}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5}}>
                                <Text style={styles.label}>WhatsApp Number</Text>
                                <TouchableOpacity style={{flexDirection:'row', alignItems:'center', gap:5}} onPress={() => setForm({...form, whatsapp_number: form.contact_number, whatsapp_code: form.contact_code})}>
                                    <View style={{width: 14, height: 14, borderWidth: 1, borderColor: '#ccc', borderRadius: 2, backgroundColor: form.whatsapp_number === form.contact_number ? colors.primary : '#fff'}}/>
                                    <Text style={{fontSize: 10, color: '#666'}}>Same as Contact</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{flexDirection: 'row', gap: 8}}>
                                <TouchableOpacity style={[styles.dropdown, {flex: 0.3}]} onPress={() => setModalType('whatsapp_code')}>
                                    <Text style={{color: form.whatsapp_code ? '#333' : '#999'}}>{form.whatsapp_code || '+966'}</Text>
                                    <MaterialCommunityIcons name="chevron-down" size={16} color="#666"/>
                                </TouchableOpacity>
                                <TextInput value={form.whatsapp_number} onChangeText={t => setForm({...form, whatsapp_number: t})} style={[styles.input, {flex: 0.7}]} placeholder="Number"/>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* SECTION 2: ADDRESS DETAILS */}
            <View style={styles.card}>
                {renderSectionHeader(2, "Address Details")}
                <View style={styles.cardContent}>
                    <View style={isLandscape ? styles.twoColumnLayout : {}}>
                         <View style={isLandscape ? {flex: 1, marginRight: 8} : {}}>
                            {renderDropdown("Country", form.country_name, 'country')}
                         </View>
                         <View style={isLandscape ? {flex: 1, marginLeft: 8} : {}}>
                            {renderDropdown("State", form.state_name, 'state')}
                         </View>
                    </View>
                    
                    <View style={isLandscape ? styles.twoColumnLayout : {}}>
                        <View style={isLandscape ? {flex: 1, marginRight: 8} : {flex: 1}}>
                            {manualDistrict 
                               ? renderInput("District", form.district_name, t => setForm({...form, district_name: t}))
                               : renderDropdown("District", form.district_name, 'district')
                            }
                        </View>
                        <View style={isLandscape ? {flex: 1, marginLeft: 8} : {flex: 1}}>
                            {renderInput("City", form.city, t => setForm({...form, city: t}))}
                        </View>
                    </View>

                    <View style={isLandscape ? styles.twoColumnLayout : {}}>
                        <View style={isLandscape ? {flex: 1, marginRight: 8} : {flex: 1}}>
                            {renderInput("Post Office", form.post, t => setForm({...form, post: t}))}
                        </View>
                        <View style={isLandscape ? {flex: 1, marginLeft: 8} : {flex: 1}}>
                            {renderInput("Postal Code", form.postal_code, t => setForm({...form, postal_code: t}))}
                        </View>
                    </View>

                    {renderInput("Full Address", form.address, t => setForm({...form, address: t}))}
                </View>
            </View>

            {/* SECTION 3: DOCUMENTS */}
            <View style={styles.card}>
                {renderSectionHeader(3, "Documents")}
                <View style={styles.cardContent}>
                    <View style={isLandscape ? styles.twoColumnLayout : {}}>
                        <View style={isLandscape ? {flex: 1, marginRight: 8} : {flex: 1}}>
                            {renderDropdown("ID Type", form.document_type_name, 'doctype')}
                        </View>
                        <View style={isLandscape ? {flex: 1, marginLeft: 8} : {flex: 1}}>
                            {renderInput("ID Number", form.document_id, t => setForm({...form, document_id: t}))}
                        </View>
                    </View>
                    
                    <View style={{marginTop: 10}}>
                        <Text style={styles.label}>Upload File</Text>
                        <TouchableOpacity style={styles.uploadBtn}>
                            <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                                <View style={styles.chooseFileBtn}>
                                    <Text style={{color: colors.primary, fontSize: 12, fontWeight: '600'}}>Choose Files</Text>
                                </View>
                                <Text style={{color: '#999', fontSize: 12}}>No file chosen</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff"/> : <Text style={{color:'#fff', fontWeight:'bold', fontSize: 16}}>Update Receiver</Text>}
            </TouchableOpacity>

            <View style={styles.footerInfo}>
                <Text style={styles.footerText}>Branch: GULF CARGO KSA RIYADH</Text>
            </View>
        </ScrollView>

        <BottomSheetSelect visible={modalType === 'country'} title="Country" data={countries} onClose={()=>setModalType(null)} onSelect={handleCountrySelect}/>
        <BottomSheetSelect visible={modalType === 'state'} title="State" data={states} onClose={()=>setModalType(null)} onSelect={handleStateSelect}/>
        <BottomSheetSelect visible={modalType === 'district'} title="District" data={districts} onClose={()=>setModalType(null)} onSelect={i => setForm({...form, district_id:i.id, district_name:i.name})}/>
        <BottomSheetSelect visible={modalType === 'contact_code'} title="Contact Code" data={phoneCodes} onClose={()=>setModalType(null)} onSelect={handleContactCodeSelect}/>
        <BottomSheetSelect visible={modalType === 'whatsapp_code'} title="WhatsApp Code" data={phoneCodes} onClose={()=>setModalType(null)} onSelect={handleWhatsappCodeSelect}/>
        <BottomSheetSelect visible={modalType === 'doctype'} title="ID Type" data={documentTypes} onClose={()=>setModalType(null)} onSelect={handleDocumentTypeSelect}/>
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
      marginTop: Platform.OS === 'ios' ? 40 : 40,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#000',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    scrollContentLandscape: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eef0f7',
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 2 }
        })
    },
    cardContent: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    sectionNumberContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#eff2ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    sectionNumber: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#5c7cfa',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: '#444',
        marginBottom: 8,
    },
    input: { 
        borderWidth: 1, 
        borderColor: '#e0e0e0', 
        borderRadius: 8, 
        padding: 12, 
        backgroundColor: '#fff',
        fontSize: 14,
        color: '#333'
    },
    dropdown: { 
        borderWidth: 1, 
        borderColor: '#e0e0e0', 
        borderRadius: 8, 
        padding: 12, 
        backgroundColor: '#fff', 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    twoColumnLayout: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    saveBtn: { 
        backgroundColor: colors.primary, 
        padding: 16, 
        borderRadius: 12, 
        alignItems: 'center', 
        marginTop: 10,
        ...Platform.select({
            ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
            android: { elevation: 4 }
        })
    },
    uploadBtn: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 8,
        backgroundColor: '#fff',
        marginTop: 5,
    },
    chooseFileBtn: {
        backgroundColor: '#eff2ff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    footerInfo: {
        marginTop: 25,
        padding: 15,
        backgroundColor: '#eff2ff',
        borderRadius: 8,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#5c7cfa',
        fontWeight: '600',
    }
});
