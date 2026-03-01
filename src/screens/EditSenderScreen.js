import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, 
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getPartyDetails, updateParty } from '../services/partiesServices';
import { 
  getAllPhoneCodes, getAllDocumentTypes 
} from '../services/coreServices'; 
import BottomSheetSelect from './cargo_wizard/components/BottomSheetSelect';
import colors from '../styles/colors'; 

export default function EditSenderScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;

  // --- MASTER DATA ---
  const [phoneCodes, setPhoneCodes] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  // --- LOADING STATES ---
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalType, setModalType] = useState(null);

  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));
  const isLandscape = windowDimensions.width > windowDimensions.height;

  const [form, setForm] = useState({
    name: '', email: '', contact_code: '+966', contact_number: '',
    whatsapp_code: '+966', whatsapp_number: '', use_same_number: false,
    customer_type_id: 1, city: '',
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
      const [pc, dt, partyRes] = await Promise.all([
          getAllPhoneCodes(), getAllDocumentTypes(), getPartyDetails(id)
      ]);

      setPhoneCodes(safeExtract(pc).map(i => ({ ...i, name: `${i.country_name || ''} (${i.code})` })));
      setDocTypes(safeExtract(dt).map(i => ({ ...i, name: i.document_name })));

      const party = partyRes.data.data || partyRes.data;
      
      setForm({
        name: party.name || '',
        email: party.email || '',
        contact_code: party.contact_code || '+966',
        contact_number: party.contact_number || '',
        whatsapp_code: party.whatsapp_code || '+966',
        whatsapp_number: party.whatsapp_number || '',
        use_same_number: false,
        customer_type_id: party.customer_type_id || 1,
        city: party.city || '',
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

  const handleSubmit = async () => {
     setSaving(true);
     try {
        const formData = new FormData();
        
        // Only append essential fields for sender update
        formData.append('name', form.name || '');
        formData.append('email', form.email || '');
        formData.append('contact_code', form.contact_code || '+966');
        formData.append('contact_number', form.contact_number || '');
        formData.append('whatsapp_code', form.whatsapp_code || '+966');
        formData.append('whatsapp_number', form.whatsapp_number || '');
        formData.append('customer_type_id', 1); // Sender
        formData.append('city', form.city || '');
        formData.append('document_type_id', form.document_type_id || '');
        formData.append('document_id', form.document_id || '');
        
        const response = await updateParty(id, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        
        if(response.data.success || response.status === 200) {
            Alert.alert("Success", "Sender updated successfully", [{ text: "OK", onPress: () => navigation.goBack() }]);
        } else {
            Alert.alert("Error", response.data.message || "Update failed");
        }

     } catch(e) {
        console.error(e);
        Alert.alert("Error", "Failed to update sender: " + (e.response?.data?.message || e.message));
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

  if(fetching) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary}/></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1, backgroundColor:'#f8f9ff'}}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Sender</Text>
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
                        <TextInput value={form.name} onChangeText={t => setForm({...form, name: t})} style={styles.input} placeholder="MOHD QAMARUDDIN"/>
                    </View>
                    
                    <View style={isLandscape ? styles.twoColumnLayout : {}}>
                        {/* CONTACT NUMBER */}
                        <View style={[isLandscape ? {flex: 1, marginRight: 8} : {marginBottom: 15}]}>
                            <Text style={styles.label}>Contact Number</Text>
                            <View style={{flexDirection: 'row', gap: 8}}>
                                <TextInput value={form.contact_code} onChangeText={t => setForm({...form, contact_code: t})} style={[styles.input, {flex: 0.3}]} placeholder="+966"/>
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
                                <TextInput value={form.whatsapp_code} onChangeText={t => setForm({...form, whatsapp_code: t})} style={[styles.input, {flex: 0.3}]} placeholder="+966"/>
                                <TextInput value={form.whatsapp_number} onChangeText={t => setForm({...form, whatsapp_number: t})} style={[styles.input, {flex: 0.7}]} placeholder="Number"/>
                            </View>
                        </View>
                    </View>

                    {/* CITY */}
                    <View style={{marginBottom: 15}}>
                        <Text style={styles.label}>City</Text>
                        <TextInput value={form.city} onChangeText={t => setForm({...form, city: t})} style={styles.input} placeholder="City"/>
                    </View>
                </View>
            </View>

            {/* SECTION 2: DOCUMENTS */}
            <View style={styles.card}>
                {renderSectionHeader(2, "Documents")}
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
                {saving ? <ActivityIndicator color="#fff"/> : <Text style={{color:'#fff', fontWeight:'bold', fontSize: 16}}>Update Sender</Text>}
            </TouchableOpacity>

            <View style={styles.footerInfo}>
                <Text style={styles.footerText}>Branch: GULF CARGO KSA RIYADH</Text>
            </View>
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
      marginTop: Platform.OS === 'ios' ? 40 : 10,
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
