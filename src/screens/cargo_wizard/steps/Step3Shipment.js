import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Ensure these service paths are correct for your project
import { 
  getActiveShipmentMethods, 
  getActiveDeliveryTypes, 
  getActivePaymentMethods 
} from '../../../services/coreServices'; 
import BottomSheetSelect from '../components/BottomSheetSelect'; 
import colors from '../../../styles/colors';

export default function Step3Shipment({ data, update }) {
  // --- STATE ---
  const [shipmentMethods, setShipmentMethods] = useState([]);
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  const [showShipMethod, setShowShipMethod] = useState(false);
  const [showDelType, setShowDelType] = useState(false);
  const [showPayMethod, setShowPayMethod] = useState(false);

  // --- EFFECT: LOAD DATA ---
  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      // 1. Fetch all API lists in parallel
      const [smRes, dtRes, pmRes] = await Promise.all([
        getActiveShipmentMethods(),
        getActiveDeliveryTypes(),
        getActivePaymentMethods()
      ]);

      // 2. Extract arrays safely
      const smList = smRes.data?.data || smRes.data || [];
      const dtList = dtRes.data?.data || dtRes.data || [];
      const pmList = pmRes.data?.data || pmRes.data || [];

      setShipmentMethods(smList);
      setDeliveryTypes(dtList);
      setPaymentMethods(pmList);

      // 3. APPLY DEFAULTS (Only if no value is currently selected)
      
      // Default: IND SEA
      if (!data.shipping_method_id) {
        findAndSelect(smList, 'IND SEA', 'shipping_method_id', 'shipping_method_name');
      }

      // Default: DOOR TO DOOR
      if (!data.delivery_type_id) {
        findAndSelect(dtList, 'DOOR TO DOOR', 'delivery_type_id', 'delivery_type_name');
      }

      // Default: CASH
      if (!data.payment_method_id) {
        findAndSelect(pmList, 'CASH', 'payment_method_id', 'payment_method_name');
      }

    } catch (e) {
      console.error("Error loading shipment data:", e);
      // Optional: Alert user if network fails
      // Alert.alert("Error", "Could not load shipment options.");
    }
  };

  /**
   * Helper to find an item in a list loosely (ignores case/spacing)
   * and update the parent state.
   */
  const findAndSelect = (list, targetName, idKey, nameKey) => {
    if (!list || list.length === 0) return;

    // Normalize strings for comparison (remove spaces, uppercase)
    // "IND SEA" becomes "INDSEA"
    const normalize = (str) => str ? str.toString().replace(/\s+/g, '').toUpperCase() : '';
    const target = normalize(targetName);

    const foundItem = list.find(item => normalize(item.name) === target);

    if (foundItem) {
      // We use a small timeout to ensure React processes updates sequentially
      setTimeout(() => {
        update(idKey, foundItem.id);
        update(nameKey, foundItem.name);
      }, 50); 
    } else {
      console.log(`[Warning] Default '${targetName}' not found in API list.`);
    }
  };

  // --- RENDER HELPERS ---
  const renderLabel = (text) => (
    <Text style={styles.label}>{text}</Text>
  );

  const renderSelectBox = (value, onPress) => (
    <TouchableOpacity style={styles.selectBox} onPress={onPress}>
      <Text style={[styles.selectText, !value && styles.placeholderText]}>
        {value || 'Select Option'}
      </Text>
      <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.headerTitle}>Shipment Details</Text>

      {/* 1. SHIPMENT METHOD */}
      <View style={styles.inputGroup}>
        {renderLabel("SHIPMENT METHOD")}
        {renderSelectBox(data.shipping_method_name, () => setShowShipMethod(true))}
      </View>

      {/* 2. DELIVERY TYPE */}
      <View style={styles.inputGroup}>
        {renderLabel("DELIVERY TYPE")}
        {renderSelectBox(data.delivery_type_name, () => setShowDelType(true))}
      </View>

      {/* 3. PAYMENT METHOD */}
      <View style={styles.inputGroup}>
        {renderLabel("PAYMENT METHOD")}
        {renderSelectBox(data.payment_method_name, () => setShowPayMethod(true))}
      </View>

      {/* 4. TRACKING CODE */}
      <View style={styles.inputGroup}>
        {renderLabel("LRL TRACKING CODE (OPTIONAL)")}
        <TextInput 
          style={styles.textInput} 
          placeholder="Enter Tracking Code"
          placeholderTextColor="#999"
          value={data.lrl_tracking_code}
          onChangeText={(t) => update('lrl_tracking_code', t)}
        />
      </View>

      {/* 5. SPECIAL REMARKS */}
      <View style={styles.inputGroup}>
        {renderLabel("SPECIAL REMARKS")}
        <TextInput 
          style={[styles.textInput, styles.textArea]} 
          placeholder="Any special instructions..."
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          value={data.special_remarks}
          onChangeText={(t) => update('special_remarks', t)}
        />
      </View>

      {/* --- BOTTOM SHEETS --- */}
      <BottomSheetSelect 
        visible={showShipMethod} 
        title="Select Shipment Method" 
        data={shipmentMethods} 
        onClose={() => setShowShipMethod(false)} 
        onSelect={(item) => { 
          update('shipping_method_id', item.id); 
          update('shipping_method_name', item.name); 
        }} 
      />
      
      <BottomSheetSelect 
        visible={showDelType} 
        title="Select Delivery Type" 
        data={deliveryTypes} 
        onClose={() => setShowDelType(false)} 
        onSelect={(item) => { 
          update('delivery_type_id', item.id); 
          update('delivery_type_name', item.name); 
        }} 
      />
      
      <BottomSheetSelect 
        visible={showPayMethod} 
        title="Select Payment Method" 
        data={paymentMethods} 
        onClose={() => setShowPayMethod(false)} 
        onSelect={(item) => { 
          update('payment_method_id', item.id); 
          update('payment_method_name', item.name); 
        }} 
      />

    </ScrollView>
  );
}

// --- STYLES TO MATCH SCREENSHOT ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#fff', // Or your background color
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a', // Dark Blue like screenshot
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280', // Cool Gray
    marginBottom: 8,
    textTransform: 'uppercase', // Matches screenshot labels
    letterSpacing: 0.5,
  },
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb', // Light border
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    height: 50, // Fixed height for consistency
  },
  selectText: {
    fontSize: 14,
    color: '#111827', // Dark text
  },
  placeholderText: {
    color: '#9ca3af',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
    height: 50,
  },
  textArea: {
    height: 100,
    paddingTop: 12, // For multiline top alignment
  },
});