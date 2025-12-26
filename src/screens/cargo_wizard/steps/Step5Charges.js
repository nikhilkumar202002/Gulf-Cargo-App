import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import colors from '../../../styles/colors';

export default function Step5Charges({ data, update }) {
  
  // Auto-calculate Totals whenever relevant fields change
  useEffect(() => {
    calculateTotals();
  }, [
    data.quantity_packing_charge, data.amount_packing_charge,
    data.quantity_insurance, data.amount_insurance,
    data.amount_awb_fee, data.amount_duty, data.vat_percentage,
    data.amount_other_charges, data.amount_discount,
    // Add other dependencies as needed
  ]);

  const calculateTotals = () => {
    // 1. Sum up all extra charges
    const packing = parseFloat(data.amount_packing_charge || 0);
    const insurance = parseFloat(data.amount_insurance || 0);
    const duty = parseFloat(data.amount_duty || 0);
    const awb = parseFloat(data.amount_awb_fee || 0);
    const other = parseFloat(data.amount_other_charges || 0);
    
    const subTotal = packing + insurance + duty + awb + other;
    
    // 2. VAT Calculation
    const vatPct = parseFloat(data.vat_percentage || 0);
    const vatAmt = (subTotal * vatPct) / 100;
    
    // 3. Discount
    const discount = parseFloat(data.amount_discount || 0);

    // 4. Net Total
    const net = subTotal + vatAmt - discount;

    // Update State (Avoid infinite loops by checking values first if needed, but setState handles equality)
    update('bill_charges', subTotal.toFixed(2));
    update('vat_cost', vatAmt.toFixed(2));
    update('net_total', net.toFixed(2));
    update('total_amount', net.toFixed(2)); // Assuming total_amount is final payable
  };

  const renderChargeRow = (label, qtyField, amountField) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <View style={{flexDirection: 'row', gap: 10}}>
            <TextInput 
                style={[styles.input, {width: 60}]} 
                placeholder="Qty" 
                keyboardType="numeric"
                value={String(data[qtyField] || 0)}
                onChangeText={(t) => update(qtyField, t)}
            />
            <TextInput 
                style={[styles.input, {width: 100}]} 
                placeholder="0.00" 
                keyboardType="numeric"
                value={String(data[amountField] || 0)}
                onChangeText={(t) => update(amountField, t)}
            />
        </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Charges & Fees</Text>

      {/* Charge Inputs */}
      <View style={styles.card}>
        {renderChargeRow("Packing Charge", 'quantity_packing_charge', 'amount_packing_charge')}
        {renderChargeRow("Insurance", 'quantity_insurance', 'amount_insurance')}
        {renderChargeRow("Customs Duty", 'quantity_duty', 'amount_duty')}
        {renderChargeRow("AWB Fee", 'quantity_awb_fee', 'amount_awb_fee')}
        {renderChargeRow("Other Charges", 'quantity_other_charges', 'amount_other_charges')}
      </View>

      {/* Totals Section */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sub Total</Text>
            <Text style={styles.summaryValue}>{data.bill_charges}</Text>
        </View>

        <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
            <Text style={styles.summaryLabel}>VAT %</Text>
            <TextInput 
                style={[styles.input, {width: 60, height: 35, padding: 0, textAlign: 'center'}]} 
                value={String(data.vat_percentage)}
                onChangeText={(t) => update('vat_percentage', t)}
                keyboardType="numeric"
            />
        </View>

        <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>VAT Amount</Text>
            <Text style={styles.summaryValue}>{data.vat_cost}</Text>
        </View>

        <View style={styles.row}>
             <Text style={styles.label}>Discount</Text>
             <TextInput 
                style={[styles.input, {width: 100}]} 
                placeholder="0.00"
                value={String(data.amount_discount || 0)}
                onChangeText={(t) => update('amount_discount', t)}
            />
        </View>
        
        <View style={styles.divider} />

        <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>NET TOTAL</Text>
            <Text style={styles.totalValue}>{data.net_total} SAR</Text>
        </View>
      </View>
      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.secondary, marginBottom: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 14, color: '#333', fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, textAlign: 'right', backgroundColor: '#f9f9f9' },
  
  summaryCard: { backgroundColor: '#eef2ff', padding: 20, borderRadius: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 10 },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: colors.primary }
});