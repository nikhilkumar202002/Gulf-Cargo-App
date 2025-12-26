import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
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
        setShipmentMethods(sm.data.data || sm.data || []);
        setDeliveryTypes(dt.data.data || dt.data || []);
        setPaymentMethods(pm.data.data || pm.data || []);
    } catch (e) {
        console.log("Error loading shipment master data", e);
    }
  };

  // Helper to find name by ID
  const getName = (list, id) => list.find(i => i.id === id)?.name || 'Select Option';

  const renderSelect = (label, valueId, list, openFn) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.selectBtn} onPress={openFn}>
            <Text style={[styles.selectText, !valueId && { color: '#999' }]}>
                {getName(list, valueId)}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
        </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Shipment Details</Text>

      {renderSelect("Shipment Method", data.shipping_method_id, shipmentMethods, () => setShowShipMethod(true))}
      {renderSelect("Delivery Type", data.delivery_type_id, deliveryTypes, () => setShowDelType(true))}
      {renderSelect("Payment Method", data.payment_method_id, paymentMethods, () => setShowPayMethod(true))}

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

      {/* MODALS */}
      <BottomSheetSelect 
        visible={showShipMethod} title="Shipment Method" data={shipmentMethods} 
        onClose={() => setShowShipMethod(false)} 
        onSelect={(i) => update('shipping_method_id', i.id)} 
      />
      <BottomSheetSelect 
        visible={showDelType} title="Delivery Type" data={deliveryTypes} 
        onClose={() => setShowDelType(false)} 
        onSelect={(i) => update('delivery_type_id', i.id)} 
      />
      <BottomSheetSelect 
        visible={showPayMethod} title="Payment Method" data={paymentMethods} 
        onClose={() => setShowPayMethod(false)} 
        onSelect={(i) => update('payment_method_id', i.id)} 
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