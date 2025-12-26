import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import colors from '../../../styles/colors';

export default function Step6Review({ data }) {
  
  const renderRow = (label, value) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || '-'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Review Invoice</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic Info</Text>
        {renderRow("Branch", data.branch_name)}
        {renderRow("Collector", data.collected_by?.name)}
        {renderRow("Date", new Date(data.date).toDateString())}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Parties</Text>
        {renderRow("Sender", data.sender?.name)}
        {renderRow("Receiver", data.receiver?.name)}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cargo Details</Text>
        {renderRow("Boxes", data.boxes.length)}
        {renderRow("Total Weight", data.total_weight + " kg")}
        {renderRow("Shipment Method", "Air/Sea (ID: " + data.shipping_method_id + ")")}
      </View>

      <View style={[styles.card, { backgroundColor: '#f0fff4', borderColor: '#c6f6d5' }]}>
        <Text style={[styles.cardTitle, { color: 'green' }]}>Financials</Text>
        {renderRow("Subtotal", data.bill_charges)}
        {renderRow("VAT", data.vat_cost)}
        {renderRow("Total Payable", data.net_total + " SAR")}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.secondary, marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#888' },
  value: { fontWeight: '600', color: '#333' }
});