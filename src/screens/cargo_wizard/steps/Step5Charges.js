import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import colors from '../../../styles/colors'; // Ensure this path is correct

export default function Step5Charges({ data, update }) {

  // Configuration of all Charge Rows
  const chargeRows = [
    // Total Weight is Read-Only (calculated from boxes)
    { label: 'Total Weight', key: 'total_weight', readOnlyQty: true }, 
    
    // Other charges are editable
    { label: 'Duty', key: 'duty' },
    { label: 'Packing charge', key: 'packing_charge' },
    { label: 'Additional Packing charge', key: 'additional_packing_charge' },
    { label: 'Insurance', key: 'insurance' },
    { label: 'AWB Fee', key: 'awb_fee' },
    { label: 'VAT Amount', key: 'vat' },
    { label: 'Volume weight', key: 'volume_weight' },
    { label: 'Other charges', key: 'other_charges' },
    
    // Discount is a deduction
    { label: 'Discount', key: 'discount', isDeduction: true },
  ];

  // --- 1. AUTO-CALCULATE WEIGHT & BOX COUNT ---
  // This runs immediately when the screen loads or when 'data.boxes' changes
  useEffect(() => {
    const boxes = data.boxes || []; 
    
    // A. Calculate Box Count
    const boxCount = boxes.length;

    // B. Calculate Total Weight (Sum of all box weights)
    // Assumes your box object has a 'weight' property. Change 'box.weight' if needed.
    const totalWeight = boxes.reduce((sum, box) => sum + (parseFloat(box.weight) || 0), 0);

    // C. Update State (Only if values differ to prevent infinite loops)
    if (String(data.no_of_boxes) !== String(boxCount)) {
        update('no_of_boxes', String(boxCount));
    }
    
    if (parseFloat(data.quantity_total_weight || 0) !== totalWeight) {
        update('quantity_total_weight', String(totalWeight));
    }
    
  }, [data.boxes]); 

  // --- 2. CALCULATION ENGINE (AMOUNTS & TOTALS) ---
  useEffect(() => {
    calculateAll();
  }, [
    // Recalculate if any Quantity or Rate changes
    ...chargeRows.map(r => data[`quantity_${r.key}`]),
    ...chargeRows.map(r => data[`rate_${r.key}`]),
  ]);

  const calculateAll = () => {
    let grandTotal = 0;

    chargeRows.forEach(row => {
      // Get values (default to 0 if empty)
      const qty = parseFloat(data[`quantity_${row.key}`]) || 0;
      const rate = parseFloat(data[`rate_${row.key}`]) || 0;
      
      // Calculate Row Amount
      const amount = qty * rate;

      // Update Row Amount in State if different
      const currentAmount = parseFloat(data[`amount_${row.key}`]) || 0;
      if (currentAmount !== amount) {
         update(`amount_${row.key}`, amount.toFixed(2));
      }

      // Add or Deduct from Grand Total
      if (row.isDeduction) {
        grandTotal -= amount;
      } else {
        grandTotal += amount;
      }
    });

    // Update Net Total
    const currentTotal = parseFloat(data.net_total) || 0;
    // We compare fixed strings to avoid floating point precision issues causing loops
    if (currentTotal.toFixed(2) !== grandTotal.toFixed(2)) {
      update('net_total', grandTotal.toFixed(2));
      update('total_amount', grandTotal.toFixed(2));
    }
  };

  // --- RENDER COMPONENTS ---

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerText, { flex: 2 }]}>Charges</Text>
      <Text style={[styles.headerText, styles.centerText]}>Quantity</Text>
      <Text style={[styles.headerText, styles.centerText]}>Unit Rate</Text>
      <Text style={[styles.headerText, styles.rightText]}>Amount</Text>
    </View>
  );

  const renderRow = (item) => {
    const qtyKey = `quantity_${item.key}`;
    const rateKey = `rate_${item.key}`;
    const amountKey = `amount_${item.key}`;

    return (
      <View key={item.key} style={styles.dataRow}>
        <Text style={styles.rowLabel}>{item.label}</Text>

        {/* Quantity Input */}
        {/* If readOnlyQty is true (Total Weight), input is disabled and greyed out */}
        <TextInput 
            style={[styles.input, item.readOnlyQty && styles.readOnlyInput]}
            placeholder="0"
            keyboardType="numeric"
            value={String(data[qtyKey] || '')}
            onChangeText={(t) => update(qtyKey, t)}
            editable={!item.readOnlyQty} 
        />

        {/* Unit Rate Input */}
        <TextInput 
            style={styles.input}
            placeholder="0.00"
            keyboardType="numeric"
            value={String(data[rateKey] || '')}
            onChangeText={(t) => update(rateKey, t)}
        />

        {/* Calculated Amount (Always Read-Only) */}
        <View style={styles.amountBox}>
             <Text style={styles.amountText}>
                {data[amountKey] || '0.00'}
             </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Charges & Fees</Text>

      <View style={styles.tableCard}>
        {renderHeader()}
        {chargeRows.map(row => renderRow(row))}
      </View>

      {/* Footer Section */}
      <View style={styles.footerSection}>
        
        {/* No. of Boxes (Read Only - Calculated from Step 4) */}
        <View style={styles.footerRow}>
             <Text style={styles.footerLabel}>No. of Boxes</Text>
             <TextInput 
                style={[styles.input, { width: 100 }, styles.readOnlyInput]}
                placeholder="0"
                value={String(data.no_of_boxes || '0')}
                editable={false} 
             />
        </View>

        {/* Grand Total */}
        <View style={[styles.footerRow, { marginTop: 15 }]}>
             <Text style={styles.totalLabel}>Total Amount</Text>
             <View style={styles.totalBox}>
                <Text style={styles.totalValue}>{data.net_total || '0.00'} SAR</Text>
             </View>
        </View>

      </View>
      
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.secondary, marginBottom: 15, marginTop: 10 },
  
  // Table Styling
  tableCard: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 10, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingHorizontal: 10, paddingBottom: 10, marginBottom: 5 },
  headerText: { flex: 1, fontSize: 12, color: '#666', fontWeight: '600' },
  centerText: { textAlign: 'center' },
  rightText: { textAlign: 'right' },
  
  // Row Styling
  dataRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginBottom: 12 },
  rowLabel: { flex: 2, fontSize: 13, color: '#374151', fontWeight: '500' },
  
  // Input Styling
  input: { 
    flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, 
    paddingVertical: 6, paddingHorizontal: 8, fontSize: 13, textAlign: 'center', 
    marginHorizontal: 4, backgroundColor: '#fff', height: 38, color: '#000'
  },
  readOnlyInput: {
    backgroundColor: '#f3f4f6', // Light Grey background for read-only
    color: '#6b7280', 
    borderColor: '#e5e7eb'
  },

  // Amount & Footer
  amountBox: { flex: 1, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 4 },
  amountText: { fontSize: 13, fontWeight: '600', color: '#111827' },
  footerSection: { marginTop: 20, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 15 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  totalBox: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db', minWidth: 120, alignItems: 'flex-end' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary }
});