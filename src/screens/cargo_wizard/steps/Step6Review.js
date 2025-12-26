import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import colors from '../../../styles/colors';

export default function Step6Review({ data }) {
  
  // 1. Calculate Total Weight dynamically from boxes
  const calculatedTotalWeight = data.boxes.reduce((sum, box) => sum + (parseFloat(box.weight) || 0), 0);
  const totalItems = data.boxes.reduce((sum, box) => sum + (box.items ? box.items.length : 0), 0);

  const renderRow = (label, value, isBold = false) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, isBold && { fontWeight: 'bold', color: colors.primary }]}>
            {value || '-'}
        </Text>
    </View>
  );

  const renderPartyDetails = (title, party) => (
    <View style={styles.subSection}>
        <Text style={styles.subHeader}>{title}</Text>
        {party ? (
            <>
                {renderRow("Name", party.name)}
                {renderRow("Phone", party.phone || party.mobile || party.contact_number)}
                {(party.whatsapp || party.whatsapp_number) && 
                    renderRow("WhatsApp", party.whatsapp || party.whatsapp_number)
                }
                {renderRow("Address", party.address || party.location || party.full_address)}
            </>
        ) : (
            <Text style={{ fontStyle: 'italic', color: '#999' }}>Not Selected</Text>
        )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Review Invoice</Text>
      
      {/* 1. Basic Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic Info</Text>
        {renderRow("Branch", data.branch_name)}
        {renderRow("Collector", data.collected_by?.name)}
        {renderRow("Date", new Date(data.date).toDateString())}
        {renderRow("Time", data.time)}
      </View>

      {/* 2. Parties */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Parties</Text>
        {renderPartyDetails("Sender", data.sender)}
        <View style={styles.divider} />
        {renderPartyDetails("Receiver", data.receiver)}
      </View>

      {/* 3. Shipment Details (FIXED: Using Names now) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Shipment Details</Text>
        {renderRow("Shipment Method", data.shipping_method_name)}
        {renderRow("Delivery Type", data.delivery_type_name)}
        {renderRow("Payment Method", data.payment_method_name)}
        {renderRow("LRL Tracking", data.lrl_tracking_code)}
        {renderRow("Remarks", data.special_remarks)}
      </View>

      {/* 4. Cargo Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cargo Details</Text>
        {renderRow("Total Boxes", data.boxes.length)}
        {renderRow("Total Items", totalItems)}
        {renderRow("Total Weight", `${calculatedTotalWeight.toFixed(2)} kg`, true)}
      </View>

      {/* 5. Financials */}
      <View style={[styles.card, { backgroundColor: '#f0fff4', borderColor: '#c6f6d5' }]}>
        <Text style={[styles.cardTitle, { color: 'green' }]}>Financials</Text>
        {renderRow("Subtotal", data.bill_charges)}
        {renderRow("VAT Amount", data.vat_cost)}
        {renderRow("Discount", data.amount_discount)}
        <View style={styles.divider} />
        {renderRow("NET PAYABLE", `${data.net_total} SAR`, true)}
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