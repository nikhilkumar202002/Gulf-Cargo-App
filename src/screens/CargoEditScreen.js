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
  const [items, setItems] = useState([]);
  const [boxWeights, setBoxWeights] = useState({});
  const [expandedBoxes, setExpandedBoxes] = useState({});
  const [shippingMethodModalVisible, setShippingMethodModalVisible] = useState(false);
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] = useState(false);
  const [deliveryTypeModalVisible, setDeliveryTypeModalVisible] = useState(false);
  const [senderModalVisible, setSenderModalVisible] = useState(false);
  const [receiverModalVisible, setReceiverModalVisible] = useState(false);
  const [sendersList, setSendersList] = useState([]);
  const [receiversList, setReceiversList] = useState([]);

  const shippingMethods = [
    { id: 1, name: 'IND SEA' },
    { id: 2, name: 'IND AIR' },
    { id: 3, name: 'INTER SEA' },
    { id: 4, name: 'INTER AIR' },
  ];

  const paymentMethods = [
    { id: 1, name: 'CASH' },
    { id: 2, name: 'CHEQUE' },
    { id: 3, name: 'TRANSFER' },
  ];

  const deliveryTypes = [
    { id: 1, name: 'DOOR TO DOOR' },
    { id: 2, name: 'AIRPORT' },
    { id: 3, name: 'PORT' },
  ];

  useEffect(() => {
    fetchCargoDetails();
    fetchSendersAndReceivers();
  }, [id]);

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
        'IND SEA': 1,
        'IND AIR': 2,
        'INTER SEA': 3,
        'INTER AIR': 4,
      };
      
      const deliveryTypeMap = {
        'DOOR TO DOOR': 1,
        'AIRPORT': 2,
        'PORT': 3,
      };
      
      const paymentMethodMap = {
        'CASH': 1,
        'CHEQUE': 2,
        'TRANSFER': 3,
      };
      
      const parsedFormData = {
        branch_id: String(cargoData.branch_id || ''),
        sender_id: String(cargoData.sender_id || ''),
        receiver_id: String(cargoData.receiver_id || ''),
        shipping_method_id: String(shippingMethodMap[cargoData.shipping_method] || cargoData.shipping_method_id || ''),
        payment_method_id: String(paymentMethodMap[cargoData.payment_method] || cargoData.payment_method_id || ''),
        delivery_type_id: String(deliveryTypeMap[cargoData.delivery_type] || cargoData.delivery_type_id || ''),
        status_id: String(cargoData.status_id || ''),
        date: String(cargoData.date || ''),
        time: String(cargoData.time || ''),
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
      };
      
      console.log('Parsed form data:', parsedFormData);
      setFormData(parsedFormData);
      
      // Parse items from nested boxes structure
      let itemsArray = [];
      if (cargoData.boxes && typeof cargoData.boxes === 'object') {
        console.log('Boxes object:', cargoData.boxes);
        Object.keys(cargoData.boxes).forEach(boxNum => {
          const box = cargoData.boxes[boxNum];
          if (box.items && Array.isArray(box.items)) {
            itemsArray = itemsArray.concat(box.items);
          }
        });
      } else if (Array.isArray(cargoData.items)) {
        itemsArray = cargoData.items;
      }
      
      console.log('Parsed items:', itemsArray);
      console.log('Items length:', itemsArray.length);
      if (itemsArray.length > 0) {
        console.log('First item:', itemsArray[0]);
      }
      setItems(itemsArray);
      
      // Parse box weights - handle array or object format
      let boxWeightsData = {};
      if (Array.isArray(cargoData.box_weight)) {
        cargoData.box_weight.forEach((weight, idx) => {
          boxWeightsData[idx + 1] = weight;
        });
      } else if (typeof cargoData.box_weight === 'object') {
        boxWeightsData = cargoData.box_weight;
      }
      console.log('Parsed box weights:', boxWeightsData);
      setBoxWeights(boxWeightsData);
      
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

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleBoxWeightChange = (boxNum, weight) => {
    setBoxWeights(prev => ({ ...prev, [boxNum]: weight }));
  };

  const toggleBoxExpand = (boxNum) => {
    setExpandedBoxes(prev => ({
      ...prev,
      [boxNum]: !prev[boxNum]
    }));
  };

  const getItemsByBox = () => {
    const boxedItems = {};
    items.forEach(item => {
      const boxNum = item.box_number || '1';
      if (!boxedItems[boxNum]) {
        boxedItems[boxNum] = [];
      }
      boxedItems[boxNum].push(item);
    });
    return boxedItems;
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const payload = {
        ...formData,
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
        total_weight: parseFloat(formData.total_weight),
        items,
        box_weight: boxWeights,
      };
      
      await updateCargo(id, payload);
      Alert.alert('Success', 'Cargo updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
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
            <Text style={styles.netTotalValue}>{formData.bill_charges || '0.00'}</Text>
          </View>
        </View>

        {/* BOX WEIGHTS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <SectionHeader title="Box Weights" icon="package-variant" />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                const nextBox = Math.max(...Object.keys(boxWeights).map(Number), 0) + 1;
                setBoxWeights(prev => ({ ...prev, [nextBox]: 0 }));
              }}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {Object.entries(boxWeights).map(([boxNum, weight]) => (
            <View key={boxNum} style={styles.boxWeightRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Box {boxNum}</Text>
                <TextInput
                  style={styles.input}
                  value={String(weight || '')}
                  onChangeText={(v) => handleBoxWeightChange(boxNum, v)}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </View>
              <TouchableOpacity
                style={styles.deleteBoxButton}
                onPress={() => {
                  const newBoxWeights = { ...boxWeights };
                  delete newBoxWeights[boxNum];
                  setBoxWeights(newBoxWeights);
                }}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ITEMS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <SectionHeader title="Items" icon="cube-outline" />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                const newItem = {
                  id: Date.now(),
                  box_number: Object.keys(getItemsByBox())[0] || '1',
                  name: '',
                  piece_no: '',
                  unit_price: '',
                  weight: '',
                };
                setItems([...items, newItem]);
              }}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {items && items.length > 0 ? (
            Object.entries(getItemsByBox()).map(([boxNum, boxItems]) => (
              <View key={boxNum} style={styles.boxContainer}>
                <TouchableOpacity 
                  style={styles.boxHeader}
                  onPress={() => toggleBoxExpand(boxNum)}
                >
                  <View style={styles.boxHeaderLeft}>
                    <MaterialCommunityIcons 
                      name={expandedBoxes[boxNum] ? "chevron-down" : "chevron-right"} 
                      size={22} 
                      color={colors.primary} 
                    />
                    <Text style={styles.boxTitle}>Box {boxNum}</Text>
                    <View style={styles.boxBadge}>
                      <Text style={styles.boxBadgeText}>{boxItems.length} items</Text>
                    </View>
                  </View>
                  {boxWeights[boxNum] && (
                    <Text style={styles.boxWeight}>{boxWeights[boxNum]} kg</Text>
                  )}
                </TouchableOpacity>

                {expandedBoxes[boxNum] && (
                  <View style={styles.boxContent}>
                    {boxItems.map((item, itemIdx) => {
                      const actualIndex = items.indexOf(item);
                      return (
                      <View key={itemIdx} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                          <View>
                            <Text style={styles.itemNumber}>Item {itemIdx + 1}</Text>
                            <Text style={styles.itemId}>#{item.slno || itemIdx + 1}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.deleteItemButton}
                            onPress={() => {
                              const updatedItems = items.filter((_, idx) => idx !== actualIndex);
                              setItems(updatedItems);
                            }}
                          >
                            <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.itemDivider} />
                        
                        {/* Box Assignment Dropdown */}
                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>Assigned to Box</Text>
                          <TouchableOpacity
                            style={styles.dropdownInput}
                            onPress={() => {
                              // Simple dropdown for box assignment
                              const availableBoxes = Object.keys(boxWeights);
                              if (availableBoxes.length > 0) {
                                const currentIndex = availableBoxes.indexOf(String(item.box_number || '1'));
                                const nextIndex = (currentIndex + 1) % availableBoxes.length;
                                handleItemChange(actualIndex, 'box_number', availableBoxes[nextIndex]);
                              }
                            }}
                          >
                            <Text style={styles.dropdownText}>Box {item.box_number || '1'}</Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.secondary} />
                          </TouchableOpacity>
                        </View>
                        
                        <InputField label="Item Name" value={String(item.name || '')} onChangeText={(v) => handleItemChange(items.indexOf(item), 'name', v)} placeholder="Item name" />
                        
                        <View style={styles.twoColRow}>
                          <View style={styles.halfField}>
                            <InputField label="Pieces" value={String(item.piece_no || '')} onChangeText={(v) => handleItemChange(items.indexOf(item), 'piece_no', v)} placeholder="# pieces" keyboardType="numeric" />
                          </View>
                          <View style={styles.halfField}>
                            <InputField label="Unit Price" value={String(item.unit_price || '')} onChangeText={(v) => handleItemChange(items.indexOf(item), 'unit_price', v)} placeholder="0.00" keyboardType="decimal-pad" />
                          </View>
                        </View>

                        <InputField label="Weight (kg)" value={String(item.weight || '')} onChangeText={(v) => handleItemChange(items.indexOf(item), 'weight', v)} placeholder="0.00" keyboardType="decimal-pad" />

                        {item.total_price && (
                          <View style={styles.itemSummary}>
                            <Text style={styles.summaryLabel}>Total Price:</Text>
                            <Text style={styles.summaryValue}>{item.total_price}</Text>
                          </View>
                        )}
                      </View>
                    );
                    })}
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyStateBox}>
              <MaterialCommunityIcons name="package-variant-closed" size={40} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No items added</Text>
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
});
