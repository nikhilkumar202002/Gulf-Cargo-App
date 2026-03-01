import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCargoDetails, updateCargo } from '../services/cargoService';
import { getSenderParties, getReceiverParties } from '../services/partiesServices';
import colors from '../styles/colors';

export default function CargoEditScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;

  const [cargo, setCargo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({});
  const [boxes, setBoxes] = useState([]);
  const [expandedBoxes, setExpandedBoxes] = useState({});
  const [shippingMethodModalVisible, setShippingMethodModalVisible] = useState(false);
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] = useState(false);
  const [deliveryTypeModalVisible, setDeliveryTypeModalVisible] = useState(false);
  const [senderModalVisible, setSenderModalVisible] = useState(false);
  const [receiverModalVisible, setReceiverModalVisible] = useState(false);
  const [sendersList, setSendersList] = useState([]);
  const [receiversList, setReceiversList] = useState([]);

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

  const shippingMethods = [
    { id: '1', name: 'IND SEA' },
    { id: '2', name: 'IND AIR' },
    { id: '3', name: 'INTER SEA' },
    { id: '4', name: 'INTER AIR' },
  ];

  const paymentMethods = [
    { id: '1', name: 'CASH' },
    { id: '2', name: 'CHEQUE' },
    { id: '3', name: 'TRANSFER' },
  ];

  const deliveryTypes = [
    { id: '1', name: 'DOOR TO DOOR' },
    { id: '2', name: 'AIRPORT' },
    { id: '3', name: 'PORT' },
  ];

  const formatTime = (input) => {
    if (!input) return '00:00';
    const cleaned = input.replace(/[^0-9:]/g, '');
    const parts = cleaned.split(':');
    if (parts.length >= 2) {
      const hours = parts[0].padStart(2, '0').slice(-2);
      const minutes = parts[1].padStart(2, '0').slice(-2);
      return `${hours}:${minutes}`;
    }
    return '00:00';
  };

  useEffect(() => {
    fetchCargoDetails();
    fetchSendersAndReceivers();
  }, [id]);

  // --- 1. AUTO-CALCULATE WEIGHT & BOX COUNT ---
  useEffect(() => {
    const boxCount = boxes.length;
    const totalWeight = boxes.reduce((sum, box) => sum + (parseFloat(box.weight) || 0), 0);

    if (String(formData.no_of_boxes) !== String(boxCount)) {
        setFormData(prev => ({ ...prev, no_of_boxes: String(boxCount) }));
    }
    
    if (parseFloat(formData.quantity_total_weight || 0) !== totalWeight) {
        setFormData(prev => ({ ...prev, quantity_total_weight: String(totalWeight) }));
    }
  }, [boxes]); 

  // --- 2. CALCULATION ENGINE ---
  useEffect(() => {
    calculateAll();
  }, [
    ...chargeRows.map(r => formData[`quantity_${r.key}`]),
    ...chargeRows.map(r => formData[`unit_rate_${r.key}`]),
  ]);

  const calculateAll = () => {
    let grandTotal = 0;

    chargeRows.forEach(row => {
      const qty = parseFloat(formData[`quantity_${row.key}`]) || 0;
      const rate = parseFloat(formData[`unit_rate_${row.key}`]) || 0;
      const amount = qty * rate;

      const currentAmount = parseFloat(formData[`amount_${row.key}`]) || 0;
      if (currentAmount !== amount) {
         setFormData(prev => ({ ...prev, [`amount_${row.key}`]: amount.toFixed(2) }));
      }

      if (row.isDeduction) grandTotal -= amount;
      else grandTotal += amount;
    });

    const currentTotal = parseFloat(formData.net_total) || 0;
    if (currentTotal.toFixed(2) !== grandTotal.toFixed(2)) {
      setFormData(prev => ({ 
        ...prev, 
        net_total: grandTotal.toFixed(2),
        total_amount: grandTotal.toFixed(2)
      }));
    }
  };

  const fetchSendersAndReceivers = async () => {
    try {
      const [sendersRes, receiversRes] = await Promise.all([
        getSenderParties(),
        getReceiverParties(),
      ]);
      const sendersData = sendersRes.data.data || sendersRes.data || [];
      const receiversData = receiversRes.data.data || receiversRes.data || [];
      setSendersList(Array.isArray(sendersData) ? sendersData : []);
      setReceiversList(Array.isArray(receiversData) ? receiversData : []);
    } catch (error) {
      console.error('Error fetching senders/receivers:', error);
    }
  };

  const fetchCargoDetails = async () => {
    try {
      setLoading(true);
      const res = await getCargoDetails(id);
      console.log('=== Cargo Edit Fetch ===');
      console.log('Full response:', res);
      console.log('Response data:', res.data);
      
      const cargoData = res.data.cargo || res.data.data || res.data;
      console.log('Parsed cargo data:', cargoData);
      
      setCargo(cargoData);
      
      // Parse shipment method ID and delivery type ID from strings
      const shippingMethodMap = {
        'IND SEA': '1',
        'IND AIR': '2',
        'INTER SEA': '3',
        'INTER AIR': '4',
      };
      
      const deliveryTypeMap = {
        'DOOR TO DOOR': '1',
        'AIRPORT': '2',
        'PORT': '3',
      };
      
      const paymentMethodMap = {
        'CASH': '1',
        'CHEQUE': '2',
        'TRANSFER': '3',
      };
      
      const parsedFormData = {
        branch_id: String(cargoData.branch_id || ''),
        sender_id: String(cargoData.sender_id || ''),
        receiver_id: String(cargoData.receiver_id || ''),
        shipping_method_id: String(shippingMethodMap[cargoData.shipping_method] || cargoData.shipping_method_id || '1'),
        payment_method_id: String(paymentMethodMap[cargoData.payment_method] || cargoData.payment_method_id || '1'),
        delivery_type_id: String(deliveryTypeMap[cargoData.delivery_type] || cargoData.delivery_type_id || '1'),
        date: String(cargoData.date || ''),
        time: formatTime(cargoData.time || '00:00'),
        lrl_tracking_code: String(cargoData.lrl_tracking_code || cargoData.tracking_code || ''),
        special_remarks: String(cargoData.special_remarks || ''),
        total_cost: String(cargoData.total_cost || '0'),
        bill_charges: String(cargoData.bill_charges || '0'),
        quantity_other_charges: String(cargoData.quantity_other_charges || '0'),
        unit_rate_other_charges: String(cargoData.unit_rate_other_charges || '0'),
        quantity_packing_charge: String(cargoData.quantity_packing_charge || '0'),
        unit_rate_packing_charge: String(cargoData.unit_rate_packing_charge || '0'),
        quantity_insurance: String(cargoData.quantity_insurance || '0'),
        unit_rate_insurance: String(cargoData.unit_rate_insurance || '0'),
        quantity_discount: String(cargoData.quantity_discount || '0'),
        unit_rate_discount: String(cargoData.unit_rate_discount || '0'),
        total_weight: String(cargoData.total_weight || '0'),
        // Add charge fields
        no_of_boxes: String(cargoData.no_of_boxes || '0'),
        quantity_total_weight: String(cargoData.quantity_total_weight || '0'),
        quantity_duty: String(cargoData.quantity_duty || '0'),
        unit_rate_duty: String(cargoData.unit_rate_duty || '0'),
        amount_duty: String(cargoData.amount_duty || '0'),
        quantity_packing_charge: String(cargoData.quantity_packing_charge || '0'),
        unit_rate_packing_charge: String(cargoData.unit_rate_packing_charge || '0'),
        amount_packing_charge: String(cargoData.amount_packing_charge || '0'),
        quantity_additional_packing_charge: String(cargoData.quantity_additional_packing_charge || '0'),
        unit_rate_additional_packing_charge: String(cargoData.unit_rate_additional_packing_charge || '0'),
        amount_additional_packing_charge: String(cargoData.amount_additional_packing_charge || '0'),
        quantity_insurance: String(cargoData.quantity_insurance || '0'),
        unit_rate_insurance: String(cargoData.unit_rate_insurance || '0'),
        amount_insurance: String(cargoData.amount_insurance || '0'),
        quantity_awb_fee: String(cargoData.quantity_awb_fee || '0'),
        unit_rate_awb_fee: String(cargoData.unit_rate_awb_fee || '0'),
        amount_awb_fee: String(cargoData.amount_awb_fee || '0'),
        quantity_vat: String(cargoData.quantity_vat || '0'),
        unit_rate_vat: String(cargoData.unit_rate_vat || '0'),
        amount_vat: String(cargoData.amount_vat || '0'),
        quantity_volume_weight: String(cargoData.quantity_volume_weight || '0'),
        unit_rate_volume_weight: String(cargoData.unit_rate_volume_weight || '0'),
        amount_volume_weight: String(cargoData.amount_volume_weight || '0'),
        quantity_other_charges: String(cargoData.quantity_other_charges || '0'),
        unit_rate_other_charges: String(cargoData.unit_rate_other_charges || '0'),
        amount_other_charges: String(cargoData.amount_other_charges || '0'),
        quantity_discount: String(cargoData.quantity_discount || '0'),
        unit_rate_discount: String(cargoData.unit_rate_discount || '0'),
        amount_discount: String(cargoData.amount_discount || '0'),
        net_total: String(cargoData.net_total || '0'),
        total_amount: String(cargoData.total_amount || '0'),
      };
      
      console.log('Parsed form data:', parsedFormData);
      setFormData(parsedFormData);
      
      // Parse box weights - handle array or object format
      let boxWeightsData = {};
      if (Array.isArray(cargoData.box_weight)) {
        cargoData.box_weight.forEach((weight, idx) => {
          boxWeightsData[(idx + 1).toString()] = weight;
        });
      } else if (typeof cargoData.box_weight === 'object') {
        boxWeightsData = cargoData.box_weight;
      }
      
      // Parse items from nested boxes structure
      let boxesArray = [];
      if (cargoData.boxes && typeof cargoData.boxes === 'object') {
        console.log('Boxes object:', cargoData.boxes);
        Object.keys(cargoData.boxes).forEach(boxNum => {
          const box = cargoData.boxes[boxNum];
          const boxItems = box.items && Array.isArray(box.items) ? box.items.map((item, idx) => ({
            slno: item.slno || String(idx + 1),
            name: item.name || '',
            qty: item.qty || item.piece_no || '1',
            weight: item.weight || '0',
            unit_price: item.unit_price || '0',
            total_price: item.total_price || '0'
          })) : [{ slno: '1', name: '', qty: '1', weight: '', unit_price: '0', total_price: '0' }];
          boxesArray.push({
            weight: box.weight || boxWeightsData[boxNum] || '0',
            items: boxItems
          });
        });
      } else if (Array.isArray(cargoData.items)) {
        // If no boxes, create one box with all items
        const allItems = cargoData.items.map((item, idx) => ({
          slno: item.slno || String(idx + 1),
          name: item.name || '',
          qty: item.qty || item.piece_no || '1',
          weight: item.weight || '0',
          unit_price: item.unit_price || '0',
          total_price: item.total_price || '0'
        }));
        boxesArray = [{
          weight: cargoData.total_weight || '0',
          items: allItems
        }];
      } else {
        // Default empty box
        boxesArray = [{
          weight: '0',
          items: [{ slno: '1', name: '', qty: '1', weight: '', unit_price: '0', total_price: '0' }]
        }];
      }
      
      console.log('Parsed boxes:', boxesArray);
      setBoxes(boxesArray);
      
    } catch (error) {
      console.error('Error fetching cargo:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', 'Could not load cargo details: ' + (error.message || 'Unknown error'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    const newFormData = { ...formData, [field]: String(numValue) };
    setFormData(newFormData);
  };

  const handleDropdownSelect = (field, id) => {
    setFormData(prev => ({ ...prev, [field]: String(id) }));
  };

  const getDropdownLabel = (id, data) => {
    if (!id) return 'Select...';
    const item = data.find(d => String(d.id) === String(id));
    return item ? item.name : 'Select...';
  };

  const addBox = () => {
    const newBox = {
      weight: '',
      items: [{ slno: '1', name: '', qty: '1', weight: '', unit_price: '0', total_price: '0' }]
    };
    setBoxes([...boxes, newBox]);
  };

  const removeBox = (index) => {
    const newBoxes = [...boxes];
    newBoxes.splice(index, 1);
    setBoxes(newBoxes);
  };

  const updateBoxWeight = (boxIndex, weight) => {
    const newBoxes = [...boxes];
    newBoxes[boxIndex].weight = weight;
    setBoxes(newBoxes);
  };

  const addItem = (boxIndex) => {
    const newBoxes = [...boxes];
    const newSlno = String(newBoxes[boxIndex].items.length + 1);
    newBoxes[boxIndex].items.push({ slno: newSlno, name: '', qty: '1', weight: '', unit_price: '0', total_price: '0' });
    setBoxes(newBoxes);
  };

  const removeItem = (boxIndex, itemIndex) => {
    const newBoxes = [...boxes];
    newBoxes[boxIndex].items.splice(itemIndex, 1);
    setBoxes(newBoxes);
  };

  const updateItem = (boxIndex, itemIndex, field, value) => {
    const newBoxes = [...boxes];
    newBoxes[boxIndex].items[itemIndex][field] = value;
    setBoxes(newBoxes);
  };

  const toggleBoxExpand = (boxNum) => {
    setExpandedBoxes(prev => ({
      ...prev,
      [boxNum]: !prev[boxNum]
    }));
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      
      // Convert boxes to flat items and box_weight
      const flatItems = [];
      const boxWeightsObj = {};
      boxes.forEach((box, index) => {
        const boxNum = (index + 1).toString();
        boxWeightsObj[boxNum] = box.weight;
        box.items.forEach(item => {
          flatItems.push({
            slno: item.slno,
            name: item.name,
            piece_no: item.qty,
            unit_price: item.unit_price,
            weight: item.weight,
            total_price: item.total_price,
            box_number: boxNum
          });
        });
      });
      
      // Calculate total weight from boxes
      let totalWeight = 0;
      for (const key in boxWeightsObj) {
        totalWeight += parseFloat(boxWeightsObj[key] || 0);
      }
      
      const payload = {
        ...formData,
        branch_id: parseInt(formData.branch_id),
        sender_id: parseInt(formData.sender_id),
        receiver_id: parseInt(formData.receiver_id),
        shipping_method_id: parseInt(formData.shipping_method_id),
        payment_method_id: parseInt(formData.payment_method_id),
        delivery_type_id: parseInt(formData.delivery_type_id),
        total_cost: parseFloat(formData.total_cost),
        bill_charges: parseFloat(formData.bill_charges),
        quantity_other_charges: parseFloat(formData.quantity_other_charges),
        unit_rate_other_charges: parseFloat(formData.unit_rate_other_charges),
        quantity_packing_charge: parseFloat(formData.quantity_packing_charge),
        unit_rate_packing_charge: parseFloat(formData.unit_rate_packing_charge),
        quantity_insurance: parseFloat(formData.quantity_insurance),
        unit_rate_insurance: parseFloat(formData.unit_rate_insurance),
        quantity_discount: parseFloat(formData.quantity_discount),
        unit_rate_discount: parseFloat(formData.unit_rate_discount),
        total_weight: totalWeight,
        // Add charge fields
        no_of_boxes: parseInt(formData.no_of_boxes),
        quantity_total_weight: parseFloat(formData.quantity_total_weight),
        quantity_duty: parseFloat(formData.quantity_duty),
        unit_rate_duty: parseFloat(formData.unit_rate_duty),
        amount_duty: parseFloat(formData.amount_duty),
        quantity_packing_charge: parseFloat(formData.quantity_packing_charge),
        unit_rate_packing_charge: parseFloat(formData.unit_rate_packing_charge),
        amount_packing_charge: parseFloat(formData.amount_packing_charge),
        quantity_additional_packing_charge: parseFloat(formData.quantity_additional_packing_charge),
        unit_rate_additional_packing_charge: parseFloat(formData.unit_rate_additional_packing_charge),
        amount_additional_packing_charge: parseFloat(formData.amount_additional_packing_charge),
        quantity_insurance: parseFloat(formData.quantity_insurance),
        unit_rate_insurance: parseFloat(formData.unit_rate_insurance),
        amount_insurance: parseFloat(formData.amount_insurance),
        quantity_awb_fee: parseFloat(formData.quantity_awb_fee),
        unit_rate_awb_fee: parseFloat(formData.unit_rate_awb_fee),
        amount_awb_fee: parseFloat(formData.amount_awb_fee),
        quantity_vat: parseFloat(formData.quantity_vat),
        unit_rate_vat: parseFloat(formData.unit_rate_vat),
        amount_vat: parseFloat(formData.amount_vat),
        quantity_volume_weight: parseFloat(formData.quantity_volume_weight),
        unit_rate_volume_weight: parseFloat(formData.unit_rate_volume_weight),
        amount_volume_weight: parseFloat(formData.amount_volume_weight),
        quantity_other_charges: parseFloat(formData.quantity_other_charges),
        unit_rate_other_charges: parseFloat(formData.unit_rate_other_charges),
        amount_other_charges: parseFloat(formData.amount_other_charges),
        quantity_discount: parseFloat(formData.quantity_discount),
        unit_rate_discount: parseFloat(formData.unit_rate_discount),
        amount_discount: parseFloat(formData.amount_discount),
        net_total: parseFloat(formData.net_total),
        total_amount: parseFloat(formData.total_amount),
        items: flatItems,
        box_weight: boxWeightsObj,
      };
      
      await updateCargo(id, payload);
      Alert.alert('Cargo updated', '', [
        { text: 'OK', onPress: () => navigation.replace('CargoList') }
      ]);
    } catch (error) {
      console.error('Error updating cargo:', error);
      Alert.alert('Error', 'Failed to update cargo');
    } finally {
      setUpdating(false);
    }
  };

  const SectionHeader = ({ title, icon }) => (
    <View style={styles.sectionHeader}>
      {icon && <MaterialCommunityIcons name={icon} size={18} color={colors.secondary} style={{marginRight: 8}} />}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const InputField = ({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        placeholder={placeholder}
        placeholderTextColor="#BCCCDC"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );

  // --- CHARGES RENDER HELPERS ---
  const renderChargesHeader = () => (
    <View style={styles.chargesHeaderRow}>
      <Text style={[styles.chargesHeaderText, styles.colCharges]}>Charges</Text>
      <Text style={[styles.chargesHeaderText, styles.colQty, {textAlign: 'center'}]}>Qty</Text>
      <Text style={[styles.chargesHeaderText, styles.colRate, {textAlign: 'center'}]}>Unit Rate</Text>
      <Text style={[styles.chargesHeaderText, styles.colAmount, {textAlign: 'right'}]}>Amount</Text>
    </View>
  );

  const renderChargeRow = (item) => {
    const qtyKey = `quantity_${item.key}`;
    const rateKey = `unit_rate_${item.key}`;
    const amountKey = `amount_${item.key}`;

    return (
      <View key={item.key} style={styles.chargeRowContainer}>
        {/* Label */}
        <Text style={styles.chargeRowLabel} numberOfLines={2}>{item.label}</Text>

        {/* Quantity Input */}
        <View style={styles.colQty}>
            <TextInput 
                style={[styles.chargeInput, item.readOnlyQty && styles.readOnlyChargeInput]}
                placeholder="0"
                keyboardType="numeric"
                value={String(formData[qtyKey] || '')}
                onChangeText={(t) => setFormData(prev => ({ ...prev, [qtyKey]: t }))}
                editable={!item.readOnlyQty}
                placeholderTextColor="#D1D5DB"
            />
        </View>

        {/* Unit Rate Input */}
        <View style={styles.colRate}>
             <TextInput 
                style={styles.chargeInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={String(formData[rateKey] || '')}
                onChangeText={(t) => setFormData(prev => ({ ...prev, [rateKey]: t }))}
                placeholderTextColor="#D1D5DB"
            />
        </View>

        {/* Calculated Amount */}
        <View style={styles.colAmount}>
             <Text style={styles.chargeAmountText}>
                {formData[amountKey] ? parseFloat(formData[amountKey]).toFixed(2) : '0.00'}
             </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Cargo</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* SHIPMENT DETAILS SECTION */}
        <View style={styles.section}>
          <SectionHeader title="Shipment Details" icon="truck-delivery" />
          
          {/* Sender Dropdown */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Sender</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setSenderModalVisible(true)}
            >
              <Text style={styles.dropdownText}>
                {formData.sender_id && sendersList.find(s => String(s.id) === String(formData.sender_id))
                  ? sendersList.find(s => String(s.id) === String(formData.sender_id)).name
                  : 'Select Sender'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Receiver Dropdown */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Receiver</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setReceiverModalVisible(true)}
            >
              <Text style={styles.dropdownText}>
                {formData.receiver_id && receiversList.find(r => String(r.id) === String(formData.receiver_id))
                  ? receiversList.find(r => String(r.id) === String(formData.receiver_id)).name
                  : 'Select Receiver'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Shipping Method Dropdown */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Shipping Method</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setShippingMethodModalVisible(true)}
            >
              <Text style={styles.dropdownText}>{getDropdownLabel(formData.shipping_method_id, shippingMethods)}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Payment Method Dropdown */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Payment Method</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setPaymentMethodModalVisible(true)}
            >
              <Text style={styles.dropdownText}>{getDropdownLabel(formData.payment_method_id, paymentMethods)}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Delivery Type Dropdown */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Delivery Type</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setDeliveryTypeModalVisible(true)}
            >
              <Text style={styles.dropdownText}>{getDropdownLabel(formData.delivery_type_id, deliveryTypes)}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Date Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.date}
              onChangeText={(value) => setFormData(prev => ({ ...prev, date: value }))}
            />
          </View>

          {/* Time Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Time</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              value={formData.time}
              onChangeText={(value) => setFormData(prev => ({ ...prev, time: formatTime(value) }))}
            />
          </View>
        </View>

        {/* Sender Modal */}
        <Modal
          visible={senderModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSenderModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSenderModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Sender</Text>
              {sendersList.map((sender) => (
                <TouchableOpacity
                  key={sender.id}
                  style={[
                    styles.modalOption,
                    String(formData.sender_id) === String(sender.id) && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    handleDropdownSelect('sender_id', sender.id);
                    setSenderModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      String(formData.sender_id) === String(sender.id) && styles.modalOptionTextSelected,
                    ]}
                  >
                    {sender.name}
                  </Text>
                  {String(formData.sender_id) === String(sender.id) && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Receiver Modal */}
        <Modal
          visible={receiverModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setReceiverModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setReceiverModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Receiver</Text>
              {receiversList.map((receiver) => (
                <TouchableOpacity
                  key={receiver.id}
                  style={[
                    styles.modalOption,
                    String(formData.receiver_id) === String(receiver.id) && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    handleDropdownSelect('receiver_id', receiver.id);
                    setReceiverModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      String(formData.receiver_id) === String(receiver.id) && styles.modalOptionTextSelected,
                    ]}
                  >
                    {receiver.name}
                  </Text>
                  {String(formData.receiver_id) === String(receiver.id) && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Shipping Method Modal */}
        <Modal
          visible={shippingMethodModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShippingMethodModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShippingMethodModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Shipping Method</Text>
              {shippingMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.modalOption,
                    String(formData.shipping_method_id) === String(method.id) && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    handleDropdownSelect('shipping_method_id', method.id);
                    setShippingMethodModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      String(formData.shipping_method_id) === String(method.id) && styles.modalOptionTextSelected,
                    ]}
                  >
                    {method.name}
                  </Text>
                  {String(formData.shipping_method_id) === String(method.id) && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Payment Method Modal */}
        <Modal
          visible={paymentMethodModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPaymentMethodModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setPaymentMethodModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.modalOption,
                    String(formData.payment_method_id) === String(method.id) && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    handleDropdownSelect('payment_method_id', method.id);
                    setPaymentMethodModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      String(formData.payment_method_id) === String(method.id) && styles.modalOptionTextSelected,
                    ]}
                  >
                    {method.name}
                  </Text>
                  {String(formData.payment_method_id) === String(method.id) && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Delivery Type Modal */}
        <Modal
          visible={deliveryTypeModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDeliveryTypeModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDeliveryTypeModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Delivery Type</Text>
              {deliveryTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    String(formData.delivery_type_id) === String(type.id) && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    handleDropdownSelect('delivery_type_id', type.id);
                    setDeliveryTypeModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      String(formData.delivery_type_id) === String(type.id) && styles.modalOptionTextSelected,
                    ]}
                  >
                    {type.name}
                  </Text>
                  {String(formData.delivery_type_id) === String(type.id) && (
                    <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* FINANCIAL DETAILS SECTION */}
        <View style={styles.section}>
          <SectionHeader title="Financial Details" icon="cash-multiple" />
          <View style={styles.twoColRow}>
            <View style={styles.halfField}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Total Cost</Text>
                <View style={styles.readOnlyInput}>
                  <Text style={styles.readOnlyText}>{formData.total_cost || '0.00'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.halfField}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Bill Charges</Text>
                <View style={styles.readOnlyInput}>
                  <Text style={styles.readOnlyText}>{formData.bill_charges || '0.00'}</Text>
                </View>
              </View>
            </View>
          </View>



          <View style={styles.netTotalContainer}>
            <Text style={styles.netTotalLabel}>Net Total</Text>
            <Text style={styles.netTotalValue}>{formData.net_total || '0.00'}</Text>
          </View>
        </View>

        {/* CHARGES & FEES SECTION */}
        <View style={styles.section}>
          <SectionHeader title="Charges & Fees" icon="calculator" />
          
          {/* Main Charges Table */}
          <View style={styles.chargesCard}>
            {renderChargesHeader()}
            <View style={styles.chargesDivider} />
            <View style={{paddingVertical: 10}}>
                 {chargeRows.map(row => renderChargeRow(row))}
            </View>
          </View>

          {/* Footer Summary */}
          <View style={styles.chargesFooterCard}>
            
            {/* No of Boxes Row */}
            <View style={styles.chargesFooterRow}>
                 <Text style={styles.chargesFooterLabel}>No. Of Boxes</Text>
                 <View style={styles.boxCountContainer}>
                     <Text style={styles.boxCountText}>{formData.no_of_boxes || '0'}</Text>
                 </View>
            </View>

            {/* Total Amount Row */}
            <View style={[styles.chargesFooterRow, {marginTop: 15}]}>
                 <Text style={styles.totalLabel}>Total Amount</Text>
                 <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                    <Text style={styles.totalValue}>{formData.net_total || '0.00'}</Text>
                    <Text style={styles.currency}> SAR</Text>
                 </View>
            </View>
          </View>
        </View>

        {/* ITEMS SECTION */}
        <View style={styles.section}>
          <View style={styles.header}>
            <Text style={styles.title}>Boxes & Items</Text>
            <Text style={styles.summaryText}>{boxes.length} Boxes | {boxes.reduce((acc, box) => acc + box.items.length, 0)} Items</Text>
          </View>

          <View style={styles.sectionHeaderRow}>
            <View />
            <TouchableOpacity style={styles.addButton} onPress={addBox}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {boxes.map((box, boxIndex) => (
            <View key={boxIndex} style={styles.boxCard}>
              {/* Box Header */}
              <View style={styles.boxHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.boxIconContainer}>
                    <MaterialCommunityIcons name="cube-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.boxTitle}>Box {boxIndex + 1}</Text>
                </View>
                {boxes.length > 1 && (
                  <TouchableOpacity onPress={() => removeBox(boxIndex)} style={styles.deleteBoxBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.divider} />

              {/* Box Weight Input */}
              <View style={styles.weightRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.label}>Total Box Weight (KG)</Text>
                  <Text style={{ color: '#EF4444', marginLeft: 2 }}>*</Text>
                </View>
                <TextInput
                  style={[styles.weightInput, (!box.weight || parseFloat(box.weight) <= 0) && { borderWidth: 1, borderColor: '#FCA5A5' }]}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={String(box.weight)}
                  onChangeText={(t) => updateBoxWeight(boxIndex, t)}
                />
              </View>

              {/* Items List */}
              <View style={styles.itemsContainer}>
                {box.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.itemRow}>
                    {/* ITEM NAME */}
                    <View style={{ flex: 3, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={styles.itemLabel}>Item Name</Text>
                        <Text style={{ color: '#EF4444', fontSize: 10, marginLeft: 2 }}>*</Text>
                      </View>
                      <TextInput
                        style={[styles.itemInput, (!item.name || item.name.trim() === "") && { borderColor: '#FCA5A5' }]}
                        placeholder="Dates"
                        value={item.name}
                        onChangeText={(t) => updateItem(boxIndex, itemIndex, 'name', t)}
                      />
                    </View>

                    {/* QTY */}
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.itemLabel}>Qty</Text>
                      <TextInput
                        style={[styles.itemInput, { textAlign: 'center' }]}
                        placeholder="0"
                        keyboardType="numeric"
                        value={String(item.qty)}
                        onChangeText={(t) => updateItem(boxIndex, itemIndex, 'qty', t)}
                      />
                    </View>

                    {/* WEIGHT (KG) */}
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.itemLabel}>KG</Text>
                      <TextInput
                        style={[styles.itemInput, { textAlign: 'center' }]}
                        placeholder="0"
                        keyboardType="numeric"
                        value={String(item.weight)}
                        onChangeText={(t) => updateItem(boxIndex, itemIndex, 'weight', t)}
                      />
                    </View>

                    {/* Remove Item Button (Small X) */}
                    {box.items.length > 1 && (
                      <TouchableOpacity onPress={() => removeItem(boxIndex, itemIndex)} style={styles.deleteItemBtn}>
                        <MaterialCommunityIcons name="close" size={16} color="#999" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity style={styles.addItemBtn} onPress={() => addItem(boxIndex)}>
                  <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
                  <Text style={styles.addItemText}>Add Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {boxes.length === 0 && (
            <View style={styles.emptyStateBox}>
              <MaterialCommunityIcons name="package-variant-closed" size={40} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No boxes added</Text>
            </View>
          )}
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.updateBtn, updating && styles.updateBtnDisabled]}
            onPress={handleUpdate}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.updateBtnText}>Update Cargo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'InstrumentSans-Bold',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondary,
    fontFamily: 'InstrumentSans-Bold',
  },
  chargesSubHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
    marginBottom: 8,
    fontFamily: 'InstrumentSans-Regular',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    fontFamily: 'InstrumentSans-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'InstrumentSans-Regular',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  halfField: {
    flex: 1,
  },
  boxContainer: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  boxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F3F4F6',
  },
  boxHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  boxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 8,
    fontFamily: 'InstrumentSans-Bold',
  },
  boxBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 10,
  },
  boxBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'InstrumentSans-Regular',
  },
  boxWeight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: 'InstrumentSans-Regular',
  },
  boxContent: {
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'InstrumentSans-Bold',
  },
  itemId: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    fontFamily: 'InstrumentSans-Regular',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
  },
  itemSummary: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: 'InstrumentSans-Regular',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'InstrumentSans-Bold',
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    fontFamily: 'InstrumentSans-Regular',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'InstrumentSans-Regular',
  },
  updateBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  updateBtnDisabled: {
    opacity: 0.7,
  },
  updateBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'InstrumentSans-Regular',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'InstrumentSans-Regular',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'InstrumentSans-Regular',
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: 'InstrumentSans-Bold',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalOptionSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  modalOptionText: {
    fontSize: 14,
    fontFamily: 'InstrumentSans-Regular',
    color: '#64748B',
  },
  modalOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'InstrumentSans-SemiBold',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  deleteItemButton: {
    padding: 4,
  },
  deleteBoxButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
    marginLeft: 8,
    marginTop: 32,
  },
  boxWeightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    minHeight: 44,
  },
  readOnlyText: {
    fontSize: 14,
    fontFamily: 'InstrumentSans-Regular',
    color: '#64748B',
    fontWeight: '600',
  },
  netTotalContainer: {
    backgroundColor: colors.primary + '10',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'InstrumentSans-Bold',
  },
  netTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'InstrumentSans-Bold',
  },
  boxCard: { 
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  boxIconContainer: { marginRight: 10 },
  deleteBoxBtn: { 
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEE2E2', 
    justifyContent: 'center', alignItems: 'center' 
  },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 16 },
  weightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', fontFamily: 'InstrumentSans-Regular' },
  weightInput: { 
    backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, 
    width: 100, textAlign: 'right', fontSize: 15, color: '#111827', fontFamily: 'InstrumentSans-Regular'
  },
  itemsContainer: { },
  itemRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  itemLabel: { fontSize: 11, color: '#6B7280', marginBottom: 6, fontFamily: 'InstrumentSans-Regular' },
  itemInput: { 
    backgroundColor: '#F9FAFB', borderRadius: 8, paddingHorizontal: 12, height: 44, 
    fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#F3F4F6', fontFamily: 'InstrumentSans-Regular'
  },
  deleteItemBtn: { marginLeft: 8, marginBottom: 12, padding: 4 },
  addItemBtn: { 
    backgroundColor: '#E0E7FF', borderRadius: 8, height: 48, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 
  },
  addItemText: { color: colors.primary, fontWeight: '600', fontSize: 15, marginLeft: 6, fontFamily: 'InstrumentSans-Regular' },
  title: { fontSize: 16, fontWeight: '600', color: '#111827', fontFamily: 'InstrumentSans-Regular' },
  summaryText: { fontSize: 13, color: '#9CA3AF', fontFamily: 'InstrumentSans-Regular' },
  chargesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    marginBottom: 16,
  },
  chargesHeaderRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  chargesHeaderText: { fontSize: 13, fontWeight: '600', color: '#111827', fontFamily: 'InstrumentSans-Regular' },
  chargesDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: -16 },
  colCharges: { flex: 2.5, paddingRight: 8 },
  colQty: { width: 50, alignItems: 'center' },
  colRate: { width: 70, alignItems: 'center', marginLeft: 8 },
  colAmount: { width: 60, alignItems: 'flex-end', marginLeft: 4 },
  chargeRowContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 14,
    height: 38 
  },
  chargeRowLabel: { 
    flex: 2.5, 
    fontSize: 13, 
    color: '#111827', 
    paddingRight: 8,
    fontFamily: 'InstrumentSans-Regular'
  },
  chargeInput: {
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
    paddingVertical: 6,
    fontFamily: 'InstrumentSans-Regular'
  },
  readOnlyChargeInput: {
    backgroundColor: '#E5E7EB',
    color: '#111827',
    borderColor: '#E5E7EB'
  },
  chargeAmountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: 'InstrumentSans-Bold'
  },
  chargesFooterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  chargesFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chargesFooterLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    fontFamily: 'InstrumentSans-Regular'
  },
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
    color: '#111827',
    fontFamily: 'InstrumentSans-Regular'
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'InstrumentSans-Regular'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: 'InstrumentSans-Bold'
  },
  currency: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    fontFamily: 'InstrumentSans-Regular'
  }
});
