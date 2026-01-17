import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, 
  TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView, Image 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker'; // npx expo install expo-document-picker

import { getSenderParties, getReceiverParties, createParty } from '../../../services/partiesServices'; 
import { 
  getAllCountries, getStatesByCountry, getDistrictsByState, 
  getAllPhoneCodes, getAllDocumentTypes 
} from '../../../services/coreServices';

import BottomSheetSelect from '../components/BottomSheetSelect'; 
import colors from '../../../styles/colors';
import { useUser } from '../../../context/UserContext'; 

export default function Step2Parties({ data, update }) {
  const { userData } = useUser();

  // --- LISTS STATE ---
  const [sendersList, setSendersList] = useState([]);
  const [receiversList, setReceiversList] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- MASTER DATA STATE ---
  const [phoneCodes, setPhoneCodes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [docTypes, setDocTypes] = useState([]);

  // --- MODAL VISIBILITY ---
  const [showSenderSelect, setShowSenderSelect] = useState(false);
  const [showReceiverSelect, setShowReceiverSelect] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // --- CREATE FORM STATE ---
  const [createType, setCreateType] = useState(null); // 'sender' | 'receiver'
  const [creating, setCreating] = useState(false);
  const [modalType, setModalType] = useState(null); // Controls which dropdown is open inside modal

  const initialForm = {
    name: '',
    email: '',
    whatsapp_code: '+966', whatsapp_number: '',
    contact_code: '+966', contact_number: '',
    use_same_number: false,
    country_id: '', country_name: '',
    state_id: '', state_name: '',
    district_id: '', district_name: '',
    city: '', post: '', postal_code: '', address: '',
    document_type_id: '', document_type_name: '',
    document_id: '', document_file: null
  };
  const [form, setForm] = useState(initialForm);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    fetchParties();
    loadMasterData();
  }, []);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([getSenderParties(), getReceiverParties()]);
      setSendersList(sRes.data.data || []);
      setReceiversList(rRes.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadMasterData = async () => {
    try {
      const [pc, co, dt] = await Promise.all([getAllPhoneCodes(), getAllCountries(), getAllDocumentTypes()]);
      setPhoneCodes(pc.data.data || []);
      setCountries(co.data.data || []);
      setDocTypes(dt.data.data || []);
    } catch(e) {}
  };

  // --- 2. DYNAMIC LOCATION ---
  const handleCountrySelect = async (item) => {
    setForm(p => ({ ...p, country_id: item.id, country_name: item.name, state_id: '', district_id: '' }));
    try {
        const res = await getStatesByCountry(item.id);
        setStates(res.data.data || []);
    } catch(e) {}
  };

  const handleStateSelect = async (item) => {
    setForm(p => ({ ...p, state_id: item.id, state_name: item.name, district_id: '' }));
    try {
        const res = await getDistrictsByState(item.id);
        setDistricts(res.data.data || []);
    } catch(e) {}
  };

  // --- 3. ACTIONS ---
  const openCreateModal = (type) => {
    setCreateType(type);
    setForm({ 
        ...initialForm, 
        // Auto-fill City for Sender based on Branch
        city: type === 'sender' ? (userData?.branch?.city || 'Riyadh') : '',
        // Default Receiver Country to India (Example ID: 101) or Empty
        country_id: type === 'receiver' ? '' : 1,
        country_name: type === 'receiver' ? '' : 'Saudi Arabia'
    });
    // Trigger state load for default country if Sender
    if(type === 'sender') handleCountrySelect({id: 1, name: 'Saudi Arabia'});
    setShowCreateModal(true);
  };

  const pickDocument = async () => {
    try {
        const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
        if (!res.canceled && res.assets && res.assets.length > 0) {
            setForm(p => ({ ...p, document_file: res.assets[0] }));
        }
    } catch(e) {}
  };

  const toggleSameNumber = (val) => {
      setForm(p => ({
          ...p, use_same_number: val,
          contact_number: val ? p.whatsapp_number : p.contact_number,
          contact_code: val ? p.whatsapp_code : p.contact_code
      }));
  };

  const handleSubmit = async () => {
      if(!form.name) return Alert.alert("Required", "Name is required");
      if(!form.whatsapp_number) return Alert.alert("Required", "WhatsApp is required");
      
      setCreating(true);
      try {
          const typeId = createType === 'sender' ? 1 : 2;
          const formData = new FormData();
          
          formData.append('name', form.name);
          formData.append('email', form.email || `user${Date.now()}@gulfcargo.com`);
          formData.append('branch_id', userData.branch_id);
          formData.append('customer_type_id', typeId);
          formData.append('whatsapp_number', form.whatsapp_number); // Code usually merged or separate based on backend
          formData.append('contact_number', form.use_same_number ? form.whatsapp_number : form.contact_number);
          
          formData.append('address', form.address);
          formData.append('city', form.city);
          formData.append('post', form.post);
          formData.append('postal_code', form.postal_code);
          if(form.country_id) formData.append('country_id', form.country_id);
          if(form.state_id) formData.append('state_id', form.state_id);
          if(form.district_id) formData.append('district_id', form.district_id);
          
          if(form.document_type_id) formData.append('document_type_id', form.document_type_id);
          if(form.document_id) formData.append('document_id', form.document_id);
          
          if (form.document_file) {
              formData.append('documents[]', {
                  uri: form.document_file.uri,
                  name: form.document_file.name,
                  type: form.document_file.mimeType || 'image/jpeg'
              });
          }
          
          formData.append('status', 1);

          const response = await createParty(formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          
          if (response.data?.success) {
              const newParty = response.data.data;
              if (createType === 'sender') {
                  setSendersList(p => [...p, newParty]);
                  update('sender', newParty);
              } else {
                  setReceiversList(p => [...p, newParty]);
                  update('receiver', newParty);
              }
              setShowCreateModal(false);
          } else {
              Alert.alert("Error", response.data.message || "Failed");
          }
      } catch(e) {
          Alert.alert("Error", "Check connection or fields.");
      } finally {
          setCreating(false);
      }
  };

  // --- RENDERERS ---
  const renderDropdown = (label, value, placeholder, type) => (
      <View style={{flex: 1}}>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setModalType(type)}>
              <Text style={[styles.ddText, !value && {color: '#999'}]}>{value || placeholder}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
      </View>
  );

  const renderPhoneInput = (label, codeField, numField, isContact) => (
      <View style={{flex: 1}}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.phoneRow}>
              <TouchableOpacity style={styles.codeBtn} onPress={() => setModalType(isContact ? 'c_code' : 'w_code')}>
                  <Text>{form[codeField]}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color="#666"/>
              </TouchableOpacity>
              <TextInput 
                  style={[styles.phoneInput, isContact && form.use_same_number && styles.disabledInput]}
                  value={form[numField]}
                  onChangeText={t => {
                      if(isContact) setForm(p=>({...p, [numField]: t}));
                      else setForm(p=>({...p, [numField]: t, contact_number: p.use_same_number ? t : p.contact_number}));
                  }}
                  keyboardType="phone-pad"
                  editable={!(isContact && form.use_same_number)}
              />
          </View>
      </View>
  );

  const renderCreateForm = () => (
      <ScrollView contentContainerStyle={{paddingBottom: 20}}>
          
          {/* 1. ADDRESS SECTION (RECEIVER ONLY) */}
          {createType === 'receiver' && (
              <View style={styles.sectionCard}>
                  <View style={styles.sectionTitleRow}><View style={styles.badge}><Text style={styles.badgeText}>1</Text></View><Text style={styles.sectionTitleText}>Address</Text></View>
                  
                  <View style={[styles.row, {zIndex: 10}]}>
                      {renderDropdown("Country", form.country_name, "Select Country", 'country')}
                      <View style={{width: 10}}/>
                      {renderDropdown("State", form.state_name, "Select State", 'state')}
                  </View>
                  
                  <View style={[styles.row, {marginTop: 15}]}>
                      {renderDropdown("District", form.district_name, "Select District", 'district')}
                      <View style={{width: 10}}/>
                      <View style={{flex: 1}}>
                          <Text style={styles.label}>City</Text>
                          <TextInput style={styles.input} value={form.city} onChangeText={t => setForm(p => ({...p, city: t}))} placeholder="Enter city" />
                      </View>
                  </View>

                  <View style={[styles.row, {marginTop: 15}]}>
                      <View style={{flex: 1}}>
                          <Text style={styles.label}>Post</Text>
                          <TextInput style={styles.input} value={form.post} onChangeText={t => setForm(p => ({...p, post: t}))} placeholder="Post office" />
                      </View>
                      <View style={{width: 10}}/>
                      <View style={{flex: 1}}>
                          <Text style={styles.label}>Postal Code</Text>
                          <TextInput style={styles.input} value={form.postal_code} onChangeText={t => setForm(p => ({...p, postal_code: t}))} placeholder="PIN / ZIP" />
                      </View>
                  </View>

                  <View style={{marginTop: 15}}>
                      <Text style={styles.label}>Address</Text>
                      <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top'}]} multiline value={form.address} onChangeText={t => setForm(p => ({...p, address: t}))} placeholder="House / Building, Street" />
                  </View>
              </View>
          )}

          {/* 2. IDENTITY SECTION */}
          <View style={[styles.sectionCard, {marginTop: 15}]}>
               {createType === 'receiver' && (
                  <View style={styles.sectionTitleRow}><View style={styles.badge}><Text style={styles.badgeText}>2</Text></View><Text style={styles.sectionTitleText}>Receiver Identity</Text></View>
               )}
               
               <View style={styles.row}>
                   <View style={{flex: 1.5}}>
                       <Text style={styles.label}>Name *</Text>
                       <TextInput style={styles.input} value={form.name} onChangeText={t => setForm(p => ({...p, name: t}))} placeholder="Full name" />
                   </View>
                   {createType === 'sender' && (
                       <View style={{flex: 1, marginLeft: 10}}>
                           <Text style={styles.label}>City</Text>
                           <TextInput style={styles.input} value={form.city} onChangeText={t => setForm(p => ({...p, city: t}))} />
                       </View>
                   )}
               </View>

               <View style={[styles.row, {marginTop: 15}]}>
                   {renderPhoneInput("WhatsApp Number", "whatsapp_code", "whatsapp_number")}
                   <View style={{width: 10}}/>
                   {renderPhoneInput("Contact Number", "contact_code", "contact_number", true)}
               </View>

               <TouchableOpacity style={{flexDirection:'row', alignItems:'center', marginTop: 10}} onPress={() => toggleSameNumber(!form.use_same_number)}>
                   <MaterialCommunityIcons name={form.use_same_number ? "checkbox-marked" : "checkbox-blank-outline"} size={20} color={colors.primary} />
                   <Text style={{marginLeft: 8, color: '#666'}}>Use same for Contact Number</Text>
               </TouchableOpacity>

               <View style={[styles.row, {marginTop: 15}]}>
                   {renderDropdown("ID Type", form.document_type_name, "Select ID Type", 'dtype')}
                   <View style={{width: 10}}/>
                   <View style={{flex: 1.5}}>
                       <Text style={styles.label}>Document ID</Text>
                       <TextInput style={styles.input} value={form.document_id} onChangeText={t => setForm(p => ({...p, document_id: t}))} placeholder="Document number" />
                   </View>
               </View>

               <View style={{marginTop: 15}}>
                   <Text style={styles.label}>Upload Documents</Text>
                   <TouchableOpacity style={styles.fileBtn} onPress={pickDocument}>
                       <Text style={{color: '#333'}}>{form.document_file ? form.document_file.name : "Choose Files"}</Text>
                       <Text style={{color: '#999'}}>{form.document_file ? "Change" : "No file chosen"}</Text>
                   </TouchableOpacity>
               </View>
          </View>

          <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10}}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowCreateModal(false)}><Text style={{color: '#666'}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit} disabled={creating}>
                  {creating ? <ActivityIndicator color="#fff"/> : <Text style={{color: '#fff', fontWeight: 'bold'}}>Submit</Text>}
              </TouchableOpacity>
          </View>
      </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Parties</Text>

      {/* Render Party Selection Cards */}
      <View style={{marginBottom: 20}}>
          <View style={{flexDirection:'row', justifyContent:'space-between'}}><Text style={styles.secHeader}>SENDER</Text><TouchableOpacity onPress={() => openCreateModal('sender')}><Text style={{color:colors.primary}}>+ Add New</Text></TouchableOpacity></View>
          <TouchableOpacity style={styles.card} onPress={() => setShowSenderSelect(true)}>
             {data.sender ? <Text style={styles.selectedText}>{data.sender.name}</Text> : <Text style={styles.placeholder}>Select Sender</Text>}
             <MaterialCommunityIcons name="chevron-down" size={24} color="#ccc" />
          </TouchableOpacity>
      </View>

      <View style={{marginBottom: 20}}>
          <View style={{flexDirection:'row', justifyContent:'space-between'}}><Text style={styles.secHeader}>RECEIVER</Text><TouchableOpacity onPress={() => openCreateModal('receiver')}><Text style={{color:colors.primary}}>+ Add New</Text></TouchableOpacity></View>
          <TouchableOpacity style={styles.card} onPress={() => setShowReceiverSelect(true)}>
             {data.receiver ? <Text style={styles.selectedText}>{data.receiver.name}</Text> : <Text style={styles.placeholder}>Select Receiver</Text>}
             <MaterialCommunityIcons name="chevron-down" size={24} color="#ccc" />
          </TouchableOpacity>
      </View>

      {/* Modals for Selection */}
      <BottomSheetSelect visible={showSenderSelect} title="Select Sender" data={sendersList} onClose={() => setShowSenderSelect(false)} onSelect={i => update('sender', i)} />
      <BottomSheetSelect visible={showReceiverSelect} title="Select Receiver" data={receiversList} onClose={() => setShowReceiverSelect(false)} onSelect={i => update('receiver', i)} />
      
      {/* Modals for Master Data */}
      <BottomSheetSelect visible={modalType === 'country'} title="Country" data={countries} onClose={() => setModalType(null)} onSelect={handleCountrySelect} />
      <BottomSheetSelect visible={modalType === 'state'} title="State" data={states} onClose={() => setModalType(null)} onSelect={handleStateSelect} />
      <BottomSheetSelect visible={modalType === 'district'} title="District" data={districts} onClose={() => setModalType(null)} onSelect={i => setForm(p=>({...p, district_id:i.id, district_name:i.name}))} />
      <BottomSheetSelect visible={modalType === 'dtype'} title="Document Type" data={docTypes} onClose={() => setModalType(null)} onSelect={i => setForm(p=>({...p, document_type_id:i.id, document_type_name:i.name}))} />
      <BottomSheetSelect visible={modalType === 'w_code'} title="Code" data={phoneCodes} onClose={() => setModalType(null)} onSelect={i => setForm(p=>({...p, whatsapp_code:i.code}))} />
      <BottomSheetSelect visible={modalType === 'c_code'} title="Code" data={phoneCodes} onClose={() => setModalType(null)} onSelect={i => setForm(p=>({...p, contact_code:i.code}))} />

      {/* CREATE MODAL */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.overlay}>
              <View style={styles.modalBody}>
                  <Text style={styles.modalTitle}>{createType === 'sender' ? 'GULF CARGO KSA RIYADH' : 'GULF CARGO KSA RIYADH'}</Text>
                  {renderCreateForm()}
              </View>
          </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainTitle: { fontSize: 20, fontWeight: 'bold', color: colors.secondary, marginBottom: 15 },
  secHeader: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 5 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  placeholder: { fontSize: 16, color: '#999' },
  
  // Modal Styles
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBody: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: colors.secondary, marginBottom: 15, textTransform: 'uppercase' },
  
  sectionCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  badge: { backgroundColor: '#222', width: 20, height: 20, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  sectionTitleText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  
  row: { flexDirection: 'row' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 5 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, padding: 8, fontSize: 14, height: 45 },
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, paddingHorizontal: 10, height: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ddText: { fontSize: 14, color: '#333' },
  
  phoneRow: { flexDirection: 'row', height: 45 },
  codeBtn: { width: 70, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRightWidth: 0, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  phoneInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderTopRightRadius: 6, borderBottomRightRadius: 6, paddingHorizontal: 10, fontSize: 14 },
  disabledInput: { backgroundColor: '#f0f0f0', color: '#999' },
  
  fileBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, flexDirection: 'row', justifyContent: 'space-between' },
  
  btnCancel: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, width: 80, alignItems: 'center' },
  btnSubmit: { padding: 10, backgroundColor: colors.primary, borderRadius: 6, width: 100, alignItems: 'center' }
});