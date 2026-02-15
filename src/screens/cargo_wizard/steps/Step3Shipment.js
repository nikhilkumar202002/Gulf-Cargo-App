import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform 
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
    }
  };

  const findAndSelect = (list, targetName, idKey, nameKey) => {
    if (!list || list.length === 0) return;
    const normalize = (str) => str ? str.toString().replace(/\s+/g, '').toUpperCase() : '';
    const target = normalize(targetName);
    const foundItem = list.find(item => normalize(item.name) === target);

    if (foundItem) {
      setTimeout(() => {
        update(idKey, foundItem.id);
        update(nameKey, foundItem.name);
      }, 50); 
    }
  };

  // --- RENDER HELPERS ---

  // Reusable Card Component for Dropdowns to match the UI
  const SelectionCard = ({ label, value, placeholder, icon, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon} size={24} color="#5B5FC7" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={[styles.cardValue, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-down" size={24} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      
      <Text style={styles.sectionHeader}>Shipment Details</Text>

      {/* 1. SHIPMENT METHOD */}
      <SelectionCard 
        label="Shipment Method"
        value={data.shipping_method_name}
        placeholder="Choose the Shipment Method"
        icon="package-variant-closed"
        onPress={() => setShowShipMethod(true)}
      />

      {/* 2. DELIVERY TYPE */}
      <SelectionCard 
        label="Delivery Type"
        value={data.delivery_type_name}
        placeholder="Choose the Delivery Type"
        icon="truck-delivery-outline"
        onPress={() => setShowDelType(true)}
      />

      {/* 3. PAYMENT METHOD */}
      <SelectionCard 
        label="Payment Method"
        value={data.payment_method_name}
        placeholder="Choose the Payment Method"
        icon="wallet-outline"
        onPress={() => setShowPayMethod(true)}
      />

      <View style={styles.spacer} />

      <Text style={styles.sectionHeader}>LRL Tracking Code & Special Marks (Optional)</Text>

      {/* 4. TRACKING CODE */}
      <View style={styles.inputCard}>
        <TextInput 
          style={styles.textInput} 
          placeholder="Enter Tracking Code"
          placeholderTextColor="#9CA3AF"
          value={data.lrl_tracking_code}
          onChangeText={(t) => update('lrl_tracking_code', t)}
        />
      </View>

      {/* 5. SPECIAL REMARKS */}
      <View style={[styles.inputCard, styles.textAreaCard]}>
        <TextInput 
          style={[styles.textInput, styles.textArea]} 
          placeholder="Any Special Instruction"
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
          value={data.special_remarks}
          onChangeText={(t) => update('special_remarks', t)}
        />
      </View>

      <View style={{height: 40}} />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Typically the parent wizard has padding, but if not:
    // paddingHorizontal: 20, 
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  spacer: {
    height: 16,
  },
  // Card Styles
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    // Minimal shadow/border to match image
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EEF2FF', // Light Indigo background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 12,
    color: '#6B7280', // Gray-500
  },
  placeholderText: {
    color: '#9CA3AF', // Gray-400
  },
  
  // Input Styles
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6', // Very subtle border
    marginBottom: 12,
    justifyContent: 'center',
    height: 56,
  },
  textInput: {
    fontSize: 14,
    color: '#111827',
    height: '100%',
  },
  textAreaCard: {
    height: 140,
    paddingVertical: 16,
    justifyContent: 'flex-start',
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },
});