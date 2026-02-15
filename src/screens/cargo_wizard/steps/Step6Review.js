import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import colors from '../../../styles/colors';

export default function Step6Review({ data }) {
  
  // --- HELPERS ---
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  // Financial Calculations
  const subtotalValue = parseFloat(data.amount_total_weight) || 0;
  const otherChargeKeys = ['duty', 'packing_charge', 'additional_packing_charge', 'insurance', 'awb_fee', 'other_charges'];
  const billChargesValue = otherChargeKeys.reduce((sum, key) => sum + (parseFloat(data[`amount_${key}`]) || 0), 0);
  
  // Flatten Items for display
  const allItems = data.boxes ? data.boxes.flatMap((box, boxIndex) => 
    box.items.map((item, itemIndex) => ({
      ...item,
      boxNumber: boxIndex + 1,
      // Global index if needed, or per-box index. UI shows "Sl No. 01, 02" likely global
      globalIndex: 0 // Will be set in map
    }))
  ).map((item, index) => ({...item, globalIndex: index + 1})) : [];


  // --- RENDER COMPONENTS ---
  
  const InfoRow = ({ label, value, isBold = false, isRed = false, suffix = '' }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[
            styles.value, 
            isBold && styles.boldValue, 
            isRed && styles.redValue
        ]}>
            {value ? String(value) : '-'} {suffix}
        </Text>
    </View>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const SubHeader = ({ title }) => (
    <Text style={styles.subHeader}>{title}</Text>
  );

  const Divider = () => <View style={styles.divider} />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Invoice Overview</Text>

      <View style={styles.card}>
        
        {/* --- BASIC INFO --- */}
        <SectionHeader title="Basic Info" />
        <View style={styles.sectionContent}>
            <InfoRow label="Branch" value={data.branch_name || 'GULF CARGO KSA RIYADH'} isBold />
            <InfoRow label="Branch AR" value="جلف كارغو السعودية الرياض" isBold />
            <InfoRow label="Collector" value={data.collected_by?.name || 'Office'} isBold />
            <InfoRow label="Staff / Agent" value="GULF CARGO KSA" isBold />
        </View>
        <Divider />

        {/* --- PARTIES --- */}
        <SectionHeader title="Parties" />
        
        {/* SHIPPER */}
        <View style={styles.partyContainer}>
            <SubHeader title="SHIPPER" />
            <InfoRow label="Name" value={data.sender?.name} isBold />
            <InfoRow label="ID Number" value={data.sender?.document_id} isBold />
            <InfoRow label="Tel No." value={data.sender?.phone || data.sender?.contact_number} isBold />
            <InfoRow label="No. of PCS" value={data.no_of_boxes} isBold />
            <InfoRow label="Weight" value={data.quantity_total_weight} suffix="KG" isBold />
            <InfoRow label="Date" value={formatDate(data.date)} isBold />
            <InfoRow label="Payment" value={data.payment_method_name} isBold />
        </View>

        {/* CONSIGNEE */}
        <View style={styles.partyContainer}>
            <SubHeader title="CONSIGNEE" />
            <InfoRow label="Name" value={data.receiver?.name} isBold />
            <InfoRow label="Address" value={data.receiver?.address} isBold />
            <InfoRow label="Post" value={data.receiver?.post} isBold />
            <InfoRow label="Pin" value={data.receiver?.postal_code || data.receiver?.pin} isBold />
            <InfoRow label="Country" value={data.receiver?.country_name || data.receiver?.country} isBold />
            <InfoRow label="State" value={data.receiver?.state_name || data.receiver?.state} isBold />
            <InfoRow label="District" value={data.receiver?.district_name || data.receiver?.district} isBold />
            <InfoRow label="City" value={data.receiver?.city} isBold />
            {/* Combine phones if available */}
            <InfoRow 
                label="Tel No." 
                value={`${data.receiver?.phone || ''} ${data.receiver?.whatsapp_number ? '/ ' + data.receiver?.whatsapp_number : ''}`} 
                isBold 
            />
        </View>
        <Divider />

        {/* --- CARGO ITEMS --- */}
        <SectionHeader title="Cargo Items" />
        <View style={styles.itemsList}>
            {allItems.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeLabel}>Sl No.</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{String(item.globalIndex).padStart(2, '0')}</Text>
                            </View>
                        </View>
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeLabel}>Box No.</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{String(item.boxNumber).padStart(2, '0')}</Text>
                            </View>
                        </View>
                    </View>
                    
                    <Text style={styles.itemLabel}>Item</Text>
                    <Text style={styles.itemName}>{item.name || 'Unknown Item'}</Text>

                    <View style={styles.itemFooter}>
                        <View>
                            <Text style={styles.itemSubLabel}>Qty</Text>
                            <Text style={styles.itemSubValue}>{String(item.qty).padStart(2, '0')}</Text>
                        </View>
                        <View>
                             <Text style={[styles.itemSubLabel, {textAlign: 'right'}]}>Item Weight</Text>
                             <Text style={[styles.itemSubValue, {textAlign: 'right'}]}>{parseFloat(item.weight || 0).toFixed(2)} KG</Text>
                        </View>
                    </View>
                    {index < allItems.length - 1 && <View style={styles.itemDivider} />}
                </View>
            ))}
            {allItems.length === 0 && <Text style={{color:'#999', fontStyle:'italic', padding: 10}}>No items added</Text>}
        </View>
        <Divider />

        {/* --- FINANCIAL SUMMARY --- */}
        <SectionHeader title="Financial Summary" />
        <View style={styles.sectionContent}>
            <InfoRow label="Subtotal (Weight)" value={formatCurrency(subtotalValue)} suffix="SAR" isBold />
            <InfoRow label="Bill Charges" value={formatCurrency(billChargesValue)} suffix="SAR" isBold />
            <InfoRow label="VAT" value={data.quantity_vat_amount ? `${parseInt(data.quantity_vat_amount)}%` : '0%'} isBold />
            
            <View style={styles.netTotalRow}>
                <Text style={styles.netTotalLabel}>NET Total</Text>
                <Text style={styles.netTotalValue}>{data.net_total} <Text style={styles.currency}>SAR</Text></Text>
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
    color: '#111827', // Dark gray/black
    marginBottom: 12,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
   
  },
  
  // Headers
  sectionHeader: {
    fontSize: 13,
    color: colors.primary, // Red
    marginBottom: 12,
    fontWeight: '600',
  },
  subHeader: {
    fontSize: 13,
    color: colors.primary, // Red
    marginBottom: 12,
    marginTop: 10,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  
  // Rows
  sectionContent: { marginBottom: 5 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'flex-start' // Handle multiline addresses
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF', // Gray-400
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#111827', // Gray-900
    flex: 2,
    textAlign: 'right',
  },
  boldValue: {
    fontWeight: '600',
  },
  
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6', // Very light gray
    marginVertical: 16,
  },

  // Parties
  partyContainer: { marginBottom: 0 },

  // Items
  itemsList: { marginBottom: 5 },
  itemCard: { marginBottom: 0 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center' },
  badgeLabel: { fontSize: 12, color: '#111827', marginRight: 6, fontWeight: '500' },
  badge: { backgroundColor: colors.primary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  itemLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  itemSubLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  itemSubValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  
  itemDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  // Net Total
  netTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    // borderTopWidth: 1,
    // borderTopColor: '#F3F4F6'
  },
  netTotalLabel: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500'
  },
  netTotalValue: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700'
  },
  currency: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary
  }
});