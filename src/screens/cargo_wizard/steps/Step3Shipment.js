import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getActiveShipmentMethods, getActiveDeliveryTypes, getActivePaymentMethods } from '../../../services/coreServices'; 
import BottomSheetSelect from '../components/BottomSheetSelect'; 
import colors from '../../../styles/colors';

export default function Step3Shipment({ data, update }) {
  // Lists
  const [shipmentMethods, setShipmentMethods] = useState([]);
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  // Modals
  const [showShipMethod, setShowShipMethod] = useState(false);
  const [showDelType, setShowDelType] = useState(false);
  const [showPayMethod, setShowPayMethod] = useState(false);

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
        const [sm, dt, pm] = await Promise.all([
            getActiveShipmentMethods(),
            getActiveDeliveryTypes(),
            getActivePaymentMethods()
        ]);
        
        const smList = sm.data.data || sm.data || [];
        const dtList = dt.data.data || dt.data || [];
        const pmList = pm.data.data || pm.data || [];

        setShipmentMethods(smList);
        setDeliveryTypes(dtList);
        setPaymentMethods(pmList);

        // --- FIX: AUTO-FILL NAMES FOR DEFAULTS ---
        // If the form has an ID (like 1) but no Name, find it and save it.
        if (data.shipping_method_id && !data.shipping_method_name) {
            const item = smList.find(i => i.id === data.shipping_method_id);
            if (item) update('shipping_method_name', item.name);
        }
        if (data.delivery_type_id && !data.delivery_type_name) {
            const item = dtList.find(i => i.id === data.delivery_type_id);
            if (item) update('delivery_type_name', item.name);
        }
        if (data.payment_method_id && !data.payment_method_name) {
            const item = pmList.find(i => i.id === data.payment_method_id);
            if (item) update('payment_method_name', item.name);
        }

    } catch (e) {
        console.log("Error loading shipment master data", e);
    }
  };

  const renderSelect = (label, valueName, openFn) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={openFn}>
            <Text style={[styles.selectText, !valueName && { color: '#999' }]}>
                {valueName || 'Select Option'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
        </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Shipment Details</Text>

      {/* Uses _name fields for display now */}
      {renderSelect("Shipment Method", data.shipping_method_name, () => setShowShipMethod(true))}
      {renderSelect("Delivery Type", data.delivery_type_name, () => setShowDelType(true))}
      {renderSelect("Payment Method", data.payment_method_name, () => setShowPayMethod(true))}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>LRL Tracking Code (Optional)</Text>
        <TextInput 
            style={styles.input} 
            placeholder="Enter Tracking Code" 
            value={data.lrl_tracking_code}
            onChangeText={(t) => update('lrl_tracking_code', t)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Special Remarks</Text>
        <TextInput 
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
            placeholder="Any special instructions..." 
            multiline
            numberOfLines={3}
            value={data.special_remarks}
            onChangeText={(t) => update('special_remarks', t)}
        />
      </View>

      {/* MODALS - Now update BOTH ID and Name */}
      <BottomSheetSelect 
        visible={showShipMethod} title="Shipment Method" data={shipmentMethods} 
        onClose={() => setShowShipMethod(false)} 
        onSelect={(i) => { 
            update('shipping_method_id', i.id); 
            update('shipping_method_name', i.name); // Save Name
        }} 
      />
      <BottomSheetSelect 
        visible={showDelType} title="Delivery Type" data={deliveryTypes} 
        onClose={() => setShowDelType(false)} 
        onSelect={(i) => { 
            update('delivery_type_id', i.id); 
            update('delivery_type_name', i.name); // Save Name
        }} 
      />
      <BottomSheetSelect 
        visible={showPayMethod} title="Payment Method" data={paymentMethods} 
        onClose={() => setShowPayMethod(false)} 
        onSelect={(i) => { 
            update('payment_method_id', i.id); 
            update('payment_method_name', i.name); // Save Name
        }} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.secondary, marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 6, textTransform: 'uppercase' },
  selectBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectText: { fontSize: 16, color: '#333' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16 }
});