import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import colors from '../../../styles/colors';

export default function Step6Review({ data }) {
  // Financial Breakdown Logic
  const subtotalValue = parseFloat(data.amount_total_weight) || 0;
  const otherChargeKeys = ['duty', 'packing_charge', 'additional_packing_charge', 'insurance', 'awb_fee', 'other_charges'];
  const billChargesValue = otherChargeKeys.reduce((sum, key) => sum + (parseFloat(data[`amount_${key}`]) || 0), 0);

  const renderRow = (label, value, isBold = false) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, isBold && { fontWeight: 'bold', color: colors.primary }]}>{value || '0.00'}</Text>
    </View>
  );

  const renderPartyDetails = (title, party) => {
    // Explicitly fetching and joining City for the address
    const address = [party?.address, party?.city].filter(Boolean).join(', ') || 'Not Provided';
    return (
        <View style={styles.subSection}>
            <Text style={styles.subHeader}>{title}</Text>
            {party ? (
                <>
                    {renderRow("Name", party.name)}
                    {renderRow("Phone", party.phone || party.mobile || party.contact_number)}
                    {renderRow("Address", address)}
                </>
            ) : <Text style={{ fontStyle: 'italic', color: '#999' }}>Not Selected</Text>}
        </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Review Invoice</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic Info</Text>
        {renderRow("Branch", data.branch_name)}
        {renderRow("Collector", data.collected_by?.name)}
        {renderRow("Date", new Date(data.date).toDateString())}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Parties</Text>
        {renderPartyDetails("Sender", data.sender)}
        <View style={styles.divider} />
        {renderPartyDetails("Receiver", data.receiver)}
      </View>
      <View style={[styles.card, { borderColor: colors.secondary }]}>
        <Text style={styles.cardTitle}>Financial Summary</Text>
        {renderRow("Subtotal (Weight)", subtotalValue.toFixed(2))}
        {renderRow("Bill Charges", billChargesValue.toFixed(2))}
        {renderRow("VAT", data.amount_vat_amount || '0.00')}
        <View style={styles.divider} />
        {renderRow("TOTAL (NET)", `${data.net_total} SAR`, true)}
      </View>
      <View style={{height: 20}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.secondary, marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  subSection: { marginBottom: 5 },
  subHeader: { fontSize: 14, fontWeight: 'bold', color: '#777', marginBottom: 5, marginTop: 5, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#888', fontSize: 14, flex: 1 },
  value: { fontWeight: '600', color: '#333', fontSize: 14, flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 }
});