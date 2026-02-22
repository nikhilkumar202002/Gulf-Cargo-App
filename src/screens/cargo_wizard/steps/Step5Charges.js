import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform } from 'react-native';
import colors from '../../../styles/colors';

export default function Step5Charges({ data, update }) {

  // Configuration of all Charge Rows
  const chargeRows = [
    { label: 'Total Weight', key: 'total_weight', readOnlyQty: true }, 
    { label: 'Duty', key: 'duty' },
    { label: 'Packing Charge', key: 'packing_charge' },
    { label: 'Additional Packing Charges', key: 'additional_packing_charge' },
    { label: 'Insurance', key: 'insurance' },
    { label: 'AWB Fee', key: 'awb_fee' },
    { label: 'VAT Amount', key: 'vat' },
    { label: 'Volume Weight', key: 'volume_weight' },
    { label: 'Other Charges', key: 'other_charges' },
    { label: 'Discount', key: 'discount', isDeduction: true },
  ];

  // --- 1. AUTO-CALCULATE WEIGHT & BOX COUNT ---
  useEffect(() => {
    const boxes = data.boxes || []; 
    const boxCount = boxes.length;
    const totalWeight = boxes.reduce((sum, box) => sum + (parseFloat(box.weight) || 0), 0);

    if (String(data.no_of_boxes) !== String(boxCount)) {
        update('no_of_boxes', String(boxCount));
    }
    
    if (parseFloat(data.quantity_total_weight || 0) !== totalWeight) {
        update('quantity_total_weight', String(totalWeight));
    }
  }, [data.boxes]); 

  // --- 2. CALCULATION ENGINE ---
  useEffect(() => {
    calculateAll();
  }, [
    ...chargeRows.map(r => data[`quantity_${r.key}`]),
    ...chargeRows.map(r => data[`unit_rate_${r.key}`]),
  ]);

  const calculateAll = () => {
    let grandTotal = 0;

    chargeRows.forEach(row => {
      const qty = parseFloat(data[`quantity_${row.key}`]) || 0;
      const rate = parseFloat(data[`unit_rate_${row.key}`]) || 0;
      const amount = qty * rate;

      const currentAmount = parseFloat(data[`amount_${row.key}`]) || 0;
      if (currentAmount !== amount) {
         update(`amount_${row.key}`, amount.toFixed(2));
      }

      if (row.isDeduction) grandTotal -= amount;
      else grandTotal += amount;
    });

    const currentTotal = parseFloat(data.net_total) || 0;
    if (currentTotal.toFixed(2) !== grandTotal.toFixed(2)) {
      update('net_total', grandTotal.toFixed(2));
      update('total_amount', grandTotal.toFixed(2));
    }
  };

  // --- RENDER HELPERS ---

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerText, styles.colCharges]}>Charges</Text>
      <Text style={[styles.headerText, styles.colQty, {textAlign: 'center'}]}>Qty</Text>
      <Text style={[styles.headerText, styles.colRate, {textAlign: 'center'}]}>Unit Rate</Text>
      <Text style={[styles.headerText, styles.colAmount, {textAlign: 'right'}]}>Amount</Text>
    </View>
  );

  const renderRow = (item) => {
    const qtyKey = `quantity_${item.key}`;
    const rateKey = `unit_rate_${item.key}`;
    const amountKey = `amount_${item.key}`;

    return (
      <View key={item.key} style={styles.rowContainer}>
        {/* Label */}
        <Text style={styles.rowLabel} numberOfLines={2}>{item.label}</Text>

        {/* Quantity Input */}
        <View style={styles.colQty}>
            <TextInput 
                style={[styles.input, item.readOnlyQty && styles.readOnlyInput]}
                placeholder="0"
                keyboardType="numeric"
                value={String(data[qtyKey] || '')}
                onChangeText={(t) => update(qtyKey, t)}
                editable={!item.readOnlyQty}
                placeholderTextColor="#D1D5DB"
            />
        </View>

        {/* Unit Rate Input */}
        <View style={styles.colRate}>
             <TextInput 
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={String(data[rateKey] || '')}
                onChangeText={(t) => update(rateKey, t)}
                placeholderTextColor="#D1D5DB"
            />
        </View>

        {/* Calculated Amount */}
        <View style={styles.colAmount}>
             <Text style={styles.amountText}>
                {data[amountKey] ? parseFloat(data[amountKey]).toFixed(2) : '0.00'}
             </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Charges & Fees</Text>

      {/* Main Table Card */}
      <View style={styles.card}>
        {renderHeader()}
        <View style={styles.divider} />
        <View style={{paddingVertical: 10}}>
             {chargeRows.map(row => renderRow(row))}
        </View>
      </View>

      {/* Footer Summary Card */}
      <View style={styles.footerCard}>
        
        {/* No of Boxes Row */}
        <View style={styles.footerRow}>
             <Text style={styles.footerLabel}>No. Of Boxes</Text>
             <View style={styles.boxCountContainer}>
                 <Text style={styles.boxCountText}>{data.no_of_boxes || '0'}</Text>
             </View>
        </View>

        {/* Total Amount Row */}
        <View style={[styles.footerRow, {marginTop: 15}]}>
             <Text style={styles.totalLabel}>Total Amount</Text>
             <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                <Text style={styles.totalValue}>{data.net_total || '0.00'}</Text>
                <Text style={styles.currency}> SAR</Text>
             </View>
        </View>
      </View>
      
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    marginBottom: 16,

  },
  
  // Header
  headerRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  headerText: { fontSize: 13, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: -16 },

  // Columns Widths (Flex based)
  colCharges: { flex: 2.5, paddingRight: 8 }, // Label takes most space
  colQty: { width: 50, alignItems: 'center' },
  colRate: { width: 70, alignItems: 'center', marginLeft: 8 },
  colAmount: { width: 60, alignItems: 'flex-end', marginLeft: 4 },

  // Rows
  rowContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 14,
    height: 38 
  },
  rowLabel: { 
    flex: 2.5, 
    fontSize: 13, 
    color: '#111827', 
    paddingRight: 8 
  },
  
  // Inputs
  input: {
    width: '100%',
    height: 38,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  readOnlyInput: {
    backgroundColor: '#E5E7EB', // Matches the gray background in UI for Total Weight
    color: '#111827',
    borderColor: '#E5E7EB'
  },

  // Amount Text
  amountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444', // Red color matching UI
  },

  // Footer Card
  footerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500'
  },
  
  // Box Count Box
  boxCountContainer: {
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    width: 60,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center'
  },
  boxCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },

  // Total Amount
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444' // Red
  },
  currency: {
    fontSize: 13,
    color: '#9CA3AF', // Gray
    fontWeight: '500'
  }
});