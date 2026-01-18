import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, 
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { createParty } from '../../../services/partiesServices'; 
import { 
  getAllCountries, getStatesByCountry, getDistrictsByState, 
  getAllPhoneCodes, getAllDocumentTypes 
} from '../../../services/coreServices'; 
import BottomSheetSelect from '../components/BottomSheetSelect'; 
import colors from '../../../styles/colors'; 

export default function CreatePartyForm({ type, branchId, onCancel, onSuccess }) {
  // --- MASTER DATA STATE ---
  const [phoneCodes, setPhoneCodes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [docTypes, setDocTypes] = useState([]);

  // --- FORM STATE ---
  const [creating, setCreating] = useState(false);
  const [modalType, setModalType] = useState(null); 

  const initialForm = {
    name: '',
    email: '',
    whatsapp_code: '+966', whatsapp_number: '',
    contact_code: '+966', contact_number: '',
    use_same_number: false,
    
    // Auto ID
    customer_type_id: '', 

    country_id: '', country_name: '',
    state_id: '', state_name: '',
    district_id: '', district_name: '',
    city: '', post: '', postal_code: '', address: '',
    document_type_id: '', document_type_name: '',
    document_id: '', document_file: null
  };
  const [form, setForm] = useState(initialForm);

  // --- LOAD DATA ---
  useEffect(() => {
    loadMasterData();
    initializeForm();
  }, []);

  const initializeForm = () => {
    const typeId = type === 'sender' ? 1 : 2;

    if (type === 'sender') {
        // Default Sender to Saudi
        handleCountrySelect({ id: 1, name: 'Saudi Arabia' }); 
        setForm(prev => ({ 
            ...prev, 
            customer_type_id: typeId, 
            city: 'Riyadh' 
        })); 
    } else {
        setForm(prev => ({ 
            ...prev, 
            customer_type_id: typeId, 
            country_id: '', country_name: '' 
        }));
    }
  };

  const loadMasterData = async () => {
    try {
      const [pc, co, dt] = await Promise.all([
          getAllPhoneCodes(), 
          getAllCountries(), 
          getAllDocumentTypes()
      ]);

      // 1. Phone Codes
      const rawCodes = pc.data.data || pc.data || [];
      const formattedCodes = rawCodes.map(item => ({
          ...item,
          name: `${item.country_name || 'Unknown'} (${item.code})` 
      }));
      setPhoneCodes(formattedCodes);

      // 2. Locations (Countries)
      setCountries(co.data.data || co.data || []);

      // 3. Document Types
      const rawDocs = dt.data.data || dt.data || [];
      const formattedDocs = rawDocs.map(item => ({
          ...item,
          name: item.document_name // Map document_name to name for dropdown
      }));
      setDocTypes(formattedDocs);

    } catch(e) {
      console.log("Error loading form master data", e);
    }
  };

  // --- DYNAMIC LOCATION LOGIC ---

  const handleCountrySelect = async (item) => {
    // 1. Update Form: Set Country, Clear State & District
    setForm(p => ({ 
        ...p, 
        country_id: item.id, 
        country_name: item.name, 
        state_id: '', state_name: '', 
        district_id: '', district_name: '' 
    }));

    // 2. Clear Lists
    setStates([]);
    setDistricts([]);

    // 3. Auto-Update Phone Code
    const matchingCode = phoneCodes.find(pc => 
        (pc.country_id && pc.country_id == item.id) || 
        (pc.country_name && pc.country_name.toLowerCase() === item.name.toLowerCase())
    );
    if (matchingCode) {
        setForm(p => ({ ...p, whatsapp_code: matchingCode.code, contact_code: matchingCode.code }));
    }

    // 4. Fetch States
    try {
        const res = await getStatesByCountry(item.id);
        const list = res.data.data || res.data || [];
        setStates(list);
    } catch(e) {
        console.log("Error fetching states", e);
    }
  };

  const handleStateSelect = async (item) => {
    // 1. Update Form: Set State, Clear District
    setForm(p => ({ 
        ...p, 
        state_id: item.id, 
        state_name: item.name, 
        district_id: '', district_name: '' 
    }));

    // 2. Clear District List
    setDistricts([]);

    // 3. Fetch Districts
    try {
        //
        const res = await getDistrictsByState(item.id);
        const list = res.data.data || res.data || [];
        setDistricts(list);
    } catch(e) {
        console.log("Error fetching districts", e);
    }
  };

  const pickDocument = async () => {
    try {
        const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
        if (!res.canceled && res.assets && res.assets.length > 0) {
            setForm(p => ({ ...p, document_file: res.assets[0] }));
        }
    } catch(e) {
        Alert.alert("Error", "Document selection failed");
    }
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
      if(!form.whatsapp_number) return Alert.alert("Required", "WhatsApp Number is required");
      
      setCreating(true);
      try {
          const formData = new FormData();
          
          formData.append('name', form.name);
          formData.append('email', form.email || `user${Date.now()}@gulfcargo.com`);
          formData.append('branch_id', branchId || 1);
          formData.append('customer_type_id', form.customer_type_id); 
          
          formData.append('whatsapp_number', form.whatsapp_number); 
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
              onSuccess(response.data.data); 
          } else {
              Alert.alert("Error", response.data.message || "Failed to create party");
          }
      } catch(e) {
          Alert.alert("Error", "Network error or invalid data.");
          console.error(e);
      } finally {
          setCreating(false);
      }
  };

  // --- RENDERERS ---
  const renderInput = (label, value, onChange, placeholder, props = {}) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput 
            style={styles.textInput}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#A0AEC0"
            {...props}
        />
    </View>
  );

  const renderDropdown = (label, value, placeholder, modalKey) => (
      <View style={styles.inputContainer}>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setModalType(modalKey)} activeOpacity={0.7}>
              <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
                  {value || placeholder}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={22} color="#718096" />
          </TouchableOpacity>
      </View>
  );

  const renderPhoneInput = (label, codeField, numField, isContact) => (
      <View style={styles.inputContainer}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.phoneGroup}>
              <TouchableOpacity 
                  style={styles.codeSelector} 
                  onPress={() => setModalType(isContact ? 'c_code' : 'w_code')}
                  disabled={isContact && form.use_same_number}
              >
                  <Text style={styles.codeText}>{form[codeField]}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color="#718096"/>
              </TouchableOpacity>
              <TextInput 
                  style={[styles.phoneInput, (isContact && form.use_same_number) && styles.disabledInput]}
                  value={form[numField]}
                  onChangeText={t => {
                      if(isContact) setForm(p=>({...p, [numField]: t}));
                      else setForm(p=>({...p, [numField]: t, contact_number: p.use_same_number ? t : p.contact_number}));
                  }}
                  placeholder="50xxxxxxx"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="phone-pad"
                  editable={!(isContact && form.use_same_number)}
              />
          </View>
      </View>
  );

  // --- SECTIONS ---
  const AddressSection = () => (
      <View style={styles.section}>
          <Text style={styles.sectionHeader}>Address Details</Text>
          
          {renderDropdown("Country", form.country_name, "Select Country", 'country')}
          {renderDropdown("State", form.state_name, "Select State", 'state')}
          {renderDropdown("District", form.district_name, "Select District", 'district')}
          {renderInput("City", form.city, t => setForm(p => ({...p, city: t})), "City Name")}
          {renderInput("Post Office", form.post, t => setForm(p => ({...p, post: t})), "Locality")}
          {renderInput("Postal Code", form.postal_code, t => setForm(p => ({...p, postal_code: t})), "ZIP Code", {keyboardType: 'numeric'})}

          <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Address</Text>
              <TextInput 
                style={[styles.textInput, styles.textArea]} 
                multiline 
                value={form.address} 
                onChangeText={t => setForm(p => ({...p, address: t}))} 
                placeholder="House No, Street, Landmark..." 
                placeholderTextColor="#A0AEC0"
              />
          </View>
      </View>
  );

  const IdentitySection = () => (
      <View style={styles.section}>
           <Text style={styles.sectionHeader}>Identity & Contact</Text>
           
           {renderInput("Full Name *", form.name, t => setForm(p => ({...p, name: t})), "Enter full name")}

           {type === 'sender' && (
                renderInput("City", form.city, t => setForm(p => ({...p, city: t})), "City Name")
           )}

           {renderPhoneInput("WhatsApp Number *", "whatsapp_code", "whatsapp_number")}

           <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => toggleSameNumber(!form.use_same_number)}
              activeOpacity={0.8}
           >
               <MaterialCommunityIcons 
                  name={form.use_same_number ? "checkbox-marked" : "checkbox-blank-outline"} 
                  size={24} 
                  color={form.use_same_number ? colors.primary : "#A0AEC0"} 
               />
               <Text style={styles.checkboxText}>Use same for Contact Number</Text>
           </TouchableOpacity>

           {renderPhoneInput("Contact Number", "contact_code", "contact_number", true)}

           {renderDropdown("ID Type", form.document_type_name, "Select Type", 'dtype')}
           {renderInput("ID Number", form.document_id, t => setForm(p => ({...p, document_id: t})), "e.g. 1045...")}

           <View style={styles.inputContainer}>
               <Text style={styles.label}>Upload Document</Text>
               <TouchableOpacity style={styles.uploadZone} onPress={pickDocument}>
                   <MaterialCommunityIcons name="cloud-upload" size={32} color={colors.primary} />
                   <Text style={styles.uploadText}>
                       {form.document_file ? form.document_file.name : "Tap to upload image/pdf"}
                   </Text>
               </TouchableOpacity>
           </View>
      </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New {type}</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={creating}>
            <Text style={[styles.headerAction, creating && {opacity: 0.5}]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {type === 'receiver' ? (
              <>
                  <AddressSection />
                  <IdentitySection />
              </>
          ) : (
              <IdentitySection />
          )}
          <View style={{height: 40}} /> 
      </ScrollView>

      {/* DROPDOWN MODALS */}
      <BottomSheetSelect 
        visible={modalType === 'country'} 
        title="Select Country" 
        data={countries} 
        onClose={() => setModalType(null)} 
        onSelect={handleCountrySelect} 
      />
      <BottomSheetSelect 
        visible={modalType === 'state'} 
        title="Select State" 
        data={states} 
        onClose={() => setModalType(null)} 
        onSelect={handleStateSelect} 
      />
      <BottomSheetSelect 
        visible={modalType === 'district'} 
        title="Select District" 
        data={districts} 
        onClose={() => setModalType(null)} 
        onSelect={i => setForm(p=>({...p, district_id:i.id, district_name:i.name}))} 
      />
      <BottomSheetSelect 
        visible={modalType === 'dtype'} 
        title="Document Type" 
        data={docTypes} 
        onClose={() => setModalType(null)} 
        onSelect={i => setForm(p=>({...p, document_type_id:i.id, document_type_name:i.name}))} 
      />
      <BottomSheetSelect 
        visible={modalType === 'w_code'} 
        title="Select Code" 
        data={phoneCodes} 
        placeholder="Search Code or Country"
        onClose={() => setModalType(null)} 
        onSelect={i => {
            setForm(p => {
                const newState = { ...p, whatsapp_code: i.code };
                if (p.use_same_number) newState.contact_code = i.code;
                return newState;
            });
        }} 
      />
      <BottomSheetSelect 
        visible={modalType === 'c_code'} 
        title="Select Code" 
        data={phoneCodes} 
        placeholder="Search Code or Country"
        onClose={() => setModalType(null)} 
        onSelect={i => setForm(p=>({...p, contact_code:i.code}))} 
      />

      {creating && (
        <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{color: '#fff', marginTop: 10, fontWeight: '600'}}>Creating Party...</Text>
        </View>
      )}

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6',
    marginHorizontal: -16, 
    marginTop: -8, 
    marginBottom: -20,
  },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', 
    borderBottomWidth: 1, borderColor: '#EDF2F7', elevation: 2 
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  headerAction: { fontSize: 16, fontWeight: '600', color: colors.primary },
  closeButton: { padding: 4 },
  scrollContent: { padding: 16 },
  section: { 
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: {width:0, height:2}, elevation: 2
  },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#2D3748', marginBottom: 16 },
  inputContainer: { marginBottom: 16, width: '100%' },
  label: { fontSize: 13, fontWeight: '600', color: '#4A5568', marginBottom: 8, marginLeft: 2 },
  textInput: { 
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, 
    paddingHorizontal: 14, height: 54, fontSize: 15, color: '#1A202C', width: '100%'
  },
  textArea: { height: 100, paddingTop: 14, textAlignVertical: 'top' },
  dropdown: { 
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, 
    paddingHorizontal: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%'
  },
  dropdownText: { fontSize: 15, color: '#1A202C' },
  placeholderText: { color: '#A0AEC0' },
  phoneGroup: { flexDirection: 'row', height: 54, width: '100%' },
  codeSelector: { 
    backgroundColor: '#EDF2F7', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', 
    borderRightWidth: 0, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', minWidth: 90 
  },
  codeText: { fontSize: 15, fontWeight: '600', color: '#2D3748', marginRight: 4 },
  phoneInput: { 
    flex: 1, backgroundColor: '#F9FAFB', borderTopRightRadius: 12, borderBottomRightRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', 
    paddingHorizontal: 14, fontSize: 15, color: '#1A202C' 
  },
  disabledInput: { backgroundColor: '#F7FAFC', color: '#CBD5E0' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: -8 },
  checkboxText: { marginLeft: 8, fontSize: 14, color: '#4A5568' },
  uploadZone: { 
    borderWidth: 2, borderColor: '#CBD5E0', borderStyle: 'dashed', borderRadius: 12, 
    height: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7FAFC', width: '100%'
  },
  uploadText: { marginTop: 6, fontSize: 13, color: '#718096', textAlign: 'center', paddingHorizontal: 10 },
  loaderOverlay: { 
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 999 
  }
});