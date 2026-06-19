import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { createCargo, getNextInvoiceNumber } from '../services/cargoService';
import { useNavigation } from '@react-navigation/native';

// --- IMPORT STEPS ---
import Step1Collection from './cargo_wizard/steps/Step1Collection';
import Step2Parties from './cargo_wizard/steps/Step2Parties';
import Step3Shipment from './cargo_wizard/steps/Step3Shipment';
import Step4Items from './cargo_wizard/steps/Step4Items';
import Step5Charges from './cargo_wizard/steps/Step5Charges';
import Step6Review from './cargo_wizard/steps/Step6Review';

export default function CargoScreen() {
  const navigation = useNavigation();
  const { userData } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const totalSteps = 6;
  const stepTitles = ['Cargo Items', 'Parties', 'Shipment', 'Charges', 'Collection', 'Review'];

  useLayoutEffect(() => {
    StatusBar.setHidden(false, 'slide');
  }, []);

  const getInitialState = () => ({
    branch_id: '', branch_name: '', booking_no: '', sender_id: '', receiver_id: '',
    shipping_method_id: '', payment_method_id: '', status_id: 1,
    date: new Date(),
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    collected_by_id: '', name_id: '', lrl_tracking_code: '', delivery_type_id: '',
    special_remarks: '',
    total_cost: 0, bill_charges: 0, vat_percentage: 15.0, vat_cost: 0, 
    net_total: 0, total_amount: 0, total_weight: 0,
    
    quantity_total_weight: 0, unit_rate_total_weight: 0, amount_total_weight: 0,
    quantity_duty: 0, unit_rate_duty: 0, amount_duty: 0,
    quantity_packing_charge: 0, unit_rate_packing_charge: 0, amount_packing_charge: 0,
    quantity_additional_packing_charge: 0, unit_rate_additional_packing_charge: 0, amount_additional_packing_charge: 0,
    quantity_insurance: 0, unit_rate_insurance: 0, amount_insurance: 0,
    quantity_awb_fee: 1, unit_rate_awb_fee: 0, amount_awb_fee: 0,
    quantity_vat_amount: 1, unit_rate_vat_amount: 0, amount_vat_amount: 0,
    quantity_volume_weight: 0, unit_rate_volume_weight: 0, amount_volume_weight: 0,
    quantity_discount: 0, unit_rate_discount: 0, amount_discount: 0,
    quantity_other_charges: 0, unit_rate_other_charges: 0, amount_other_charges: 0,
    
    boxes: [{ weight: '', items: [{ name: '', qty: '1', weight: '' }] }], no_of_pieces: 0, sender: null, receiver: null, collected_by: null 
  });

  const [formData, setFormData] = useState(getInitialState());

  const loadNextInvoiceNumber = async (branchId) => {
    if (!branchId) return;

    setInvoiceLoading(true);
    try {
      const nextInvoiceNumber = await getNextInvoiceNumber(branchId);
      if (nextInvoiceNumber) {
        setFormData(prev => ({ ...prev, booking_no: nextInvoiceNumber }));
      }
    } catch (error) {
      setFormData(prev => ({ ...prev, booking_no: '' }));
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
        const userObj = userData.user || userData;
        const bId = userData.branch_id || userObj.branch?.id || userObj.branch_id;
        const bName = userData.branchName || userObj.branch?.name || userObj.branch_name;
        
        if (bId) {
            setFormData(prev => ({ ...prev, branch_id: bId, branch_name: bName, name_id: userObj.id || userData.id }));
            loadNextInvoiceNumber(bId);
        }
    }
  }, [userData]);

  useFocusEffect(
    React.useCallback(() => {
      // Reset form and step when screen comes into focus
      setCurrentStep(1);
      const userObj = userData?.user || userData;
      const bId = userData?.branch_id || userObj?.branch?.id || userObj?.branch_id;
      const bName = userData?.branchName || userObj?.branch?.name || userObj?.branch_name;
      
      setFormData({
        ...getInitialState(),
        branch_id: bId || '',
        branch_name: bName || '',
        name_id: userObj?.id || userData?.id || ''
      });

      loadNextInvoiceNumber(bId);
    }, [userData])
  );

  const updateFormData = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const calculateFinancials = () => {
    const amount_total_weight = (formData.quantity_total_weight || 0) * (formData.unit_rate_total_weight || 0);
    const amount_duty = (formData.quantity_duty || 0) * (formData.unit_rate_duty || 0);
    const amount_packing_charge = (formData.quantity_packing_charge || 0) * (formData.unit_rate_packing_charge || 0);
    const amount_additional_packing_charge = (formData.quantity_additional_packing_charge || 0) * (formData.unit_rate_additional_packing_charge || 0);
    const amount_insurance = (formData.quantity_insurance || 0) * (formData.unit_rate_insurance || 0);
    const amount_awb_fee = (formData.quantity_awb_fee || 0) * (formData.unit_rate_awb_fee || 0);
    const amount_vat_amount = (formData.quantity_vat_amount || 0) * (formData.unit_rate_vat_amount || 0);
    const amount_volume_weight = (formData.quantity_volume_weight || 0) * (formData.unit_rate_volume_weight || 0);
    const amount_discount = (formData.quantity_discount || 0) * (formData.unit_rate_discount || 0);
    const amount_other_charges = (formData.quantity_other_charges || 0) * (formData.unit_rate_other_charges || 0);

    const totalWeight = formData.boxes.reduce((sum, box) => sum + parseFloat(box.weight || 0), 0);
    const total_cost = amount_total_weight;
    const bill_charges = amount_duty + amount_packing_charge + amount_additional_packing_charge + amount_insurance + amount_awb_fee + amount_volume_weight + amount_other_charges;
    const net_total = total_cost + bill_charges + amount_vat_amount;
    const vat_cost = amount_vat_amount;

    setFormData(prev => ({
      ...prev,
      total_weight: totalWeight,
      total_cost,
      bill_charges,
      net_total,
      vat_cost,
      amount_total_weight,
      amount_duty,
      amount_packing_charge,
      amount_additional_packing_charge,
      amount_insurance,
      amount_awb_fee,
      amount_vat_amount,
      amount_volume_weight,
      amount_discount,
      amount_other_charges,
    }));
  };

  useEffect(() => {
    if (currentStep === 6) {
      calculateFinancials();
    }
  }, [currentStep]);

  const handleSubmitInvoice = async () => {
    // Calculate amounts
    const amount_total_weight = (formData.quantity_total_weight || 0) * (formData.unit_rate_total_weight || 0);
    const amount_duty = (formData.quantity_duty || 0) * (formData.unit_rate_duty || 0);
    const amount_packing_charge = (formData.quantity_packing_charge || 0) * (formData.unit_rate_packing_charge || 0);
    const amount_additional_packing_charge = (formData.quantity_additional_packing_charge || 0) * (formData.unit_rate_additional_packing_charge || 0);
    const amount_insurance = (formData.quantity_insurance || 0) * (formData.unit_rate_insurance || 0);
    const amount_awb_fee = (formData.quantity_awb_fee || 0) * (formData.unit_rate_awb_fee || 0);
    const amount_vat_amount = (formData.quantity_vat_amount || 0) * (formData.unit_rate_vat_amount || 0);
    const amount_volume_weight = (formData.quantity_volume_weight || 0) * (formData.unit_rate_volume_weight || 0);
    const amount_discount = (formData.quantity_discount || 0) * (formData.unit_rate_discount || 0);
    const amount_other_charges = (formData.quantity_other_charges || 0) * (formData.unit_rate_other_charges || 0);

    // Calculate totals
    const totalWeight = formData.boxes.reduce((sum, box) => sum + parseFloat(box.weight || 0), 0);
    const boxWeightArr = formData.boxes.map(box => parseFloat(box.weight || 0).toString());
    const totalPieces = formData.boxes.length;

    // total_cost is the box weight total cost
    const total_cost = amount_total_weight;
    // bill_charges is the sum of other charges
    const bill_charges = amount_duty + amount_packing_charge + amount_additional_packing_charge + amount_insurance + amount_awb_fee + amount_volume_weight + amount_other_charges;
    // net_total is total_cost + bill_charges
    const net_total = total_cost + bill_charges;
    // vat_cost
    const vat_cost = amount_vat_amount;

    // Format data for API
    const submitData = {
      ...formData,
      booking_no: formData.booking_no,
      date: formData.date.toISOString().split('T')[0], // YYYY-MM-DD
      sender_id: formData.sender?.id || formData.sender_id,
      receiver_id: formData.receiver?.id || formData.receiver_id,
      collected_by_id: formData.collected_by?.id || formData.collected_by_id,
      // Ensure branch_id is set
      branch_id: formData.branch_id || userData?.branch_id || userData?.user?.branch?.id,
      // Add calculated fields
      total_weight: parseFloat(totalWeight).toFixed(2),
      box_weight: boxWeightArr,
      no_of_pieces: totalPieces,
      total_cost: parseFloat(total_cost).toFixed(2),
      bill_charges: parseFloat(bill_charges).toFixed(2),
      vat_percentage: parseFloat(formData.vat_percentage || 0).toFixed(2),
      vat_cost: parseFloat(vat_cost).toFixed(2),
      net_total: parseFloat(net_total).toFixed(2),
      // Update amounts
      amount_total_weight: parseFloat(amount_total_weight).toFixed(2),
      amount_duty: parseFloat(amount_duty).toFixed(2),
      amount_packing_charge: parseFloat(amount_packing_charge).toFixed(2),
      amount_additional_packing_charge: parseFloat(amount_additional_packing_charge).toFixed(2),
      amount_insurance: parseFloat(amount_insurance).toFixed(2),
      amount_awb_fee: parseFloat(amount_awb_fee).toFixed(2),
      amount_vat_amount: parseFloat(amount_vat_amount).toFixed(2),
      amount_volume_weight: parseFloat(amount_volume_weight).toFixed(2),
      amount_discount: parseFloat(amount_discount).toFixed(2),
      amount_other_charges: parseFloat(amount_other_charges).toFixed(2),
      // Format items from boxes
      items: formData.boxes.flatMap((box, boxIndex) => 
        box.items.map((item, itemIndex) => ({
          slno: itemIndex + 1,
          box_number: boxIndex + 1,
          name: item.name || '',
          piece_no: item.qty || 1,
          weight: parseFloat(item.weight || 0).toFixed(2),
          unit_price: parseFloat(item.unit_price || 0).toFixed(2),
          total_price: parseFloat(item.total_price || 0).toFixed(2),
          box_weight: parseFloat(box.weight || 0).toFixed(2)
        }))
      ),
    };
    
    // Pre-submit validation
    const requiredFields = [
      'branch_id', 'sender_id', 'receiver_id', 'collected_by_id', 
      'shipping_method_id', 'payment_method_id'
    ];
    
    const missingFields = requiredFields.filter(field => !submitData[field]);
    
    if (missingFields.length > 0) {
      Alert.alert("Validation Error", `Please fill in: ${missingFields.join(', ')}`);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await createCargo(submitData);
      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "Cargo created successfully!");
        setFormData(getInitialState()); // Reset form to fresh state
        navigation.navigate('History');
      } else {
        Alert.alert("Error", "Failed to create cargo");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to create cargo";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.boxes || formData.boxes.length === 0) {
        return Alert.alert("Required", "Please add at least one box");
      }
      for (let i = 0; i < formData.boxes.length; i++) {
        const box = formData.boxes[i];
        if (!box.weight || parseFloat(box.weight) <= 0) {
          return Alert.alert("Required", `Please enter a valid weight for Box ${i + 1}`);
        }
        if (!box.items || box.items.length === 0) {
          return Alert.alert("Required", `Box ${i + 1} must have at least one item`);
        }
        for (let j = 0; j < box.items.length; j++) {
          const item = box.items[j];
          if (!item.name || item.name.trim() === "") {
            return Alert.alert("Required", `Please enter a name for Item ${j + 1} in Box ${i + 1}`);
          }
        }
      }
    }
    if (currentStep === 2 && (!formData.sender || !formData.receiver)) return Alert.alert("Required", "Select Sender and Receiver");
    if (currentStep === 5 && !formData.collected_by && !formData.collected_by_id) return Alert.alert("Required", "Select Collector");
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    else handleSubmitInvoice();
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1: return <Step4Items data={formData} update={updateFormData} />;
      case 2: return <Step2Parties data={formData} update={updateFormData} />;
      case 3: return <Step3Shipment data={formData} update={updateFormData} />;
      case 4: return <Step5Charges data={formData} update={updateFormData} />;
      case 5: return <Step1Collection data={formData} update={updateFormData} />;
      case 6: return <Step6Review data={formData} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* Global Progress Card matching UI exactly */}
        <View style={styles.topCardContainer}>
          <View style={styles.progressCard}>
            <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Invoice Number</Text>
                <View style={styles.invoiceBadge}>
                    <Text style={styles.invoiceBadgeText}>
                      {invoiceLoading ? 'Loading...' : formData.booking_no || 'Pending'}
                    </Text>
                </View>
            </View>
            <View style={styles.progressHeader}>
                <View style={styles.progressTitleBlock}>
                    <Text style={styles.progressTitle}>Create New Bill</Text>
                    <Text style={styles.progressSubtitle}>{stepTitles[currentStep - 1]}</Text>
                </View>
                <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>Step {currentStep}/{totalSteps}</Text>
                </View>
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(currentStep/totalSteps)*100}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.contentContainer}>{renderStep()}</View>
        
        {/* Styled Footer matching UI exactly */}
        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity 
              style={[styles.btn, styles.backBtn]} 
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <MaterialCommunityIcons name="arrow-left" size={18} color="#374151" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.btn, styles.nextBtn, currentStep === 1 && { flex: 1 }]} 
            onPress={handleNext} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff"/>
            ) : (
              <>
                <Text style={styles.nextBtnText}>{currentStep === totalSteps ? 'Submit Bill' : 'Next Step'}</Text>
                <MaterialCommunityIcons name={currentStep === totalSteps ? 'check' : 'arrow-right'} size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  topCardContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  progressCard: {
      backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
      elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
  },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  invoiceLabel: { fontSize: 12, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, fontFamily: 'InstrumentSans-Regular' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  progressTitleBlock: { flex: 1 },
  progressTitle: { fontSize: 16, color: '#111827', fontWeight: '500', fontFamily: 'InstrumentSans-Regular' },
  progressSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2, fontFamily: 'InstrumentSans-Regular' },
  invoiceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34339A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  invoiceBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: 'InstrumentSans-Regular' },
  stepBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stepBadgeText: { color: '#312E81', fontSize: 12, fontWeight: '600', fontFamily: 'InstrumentSans-Regular' },
  progressBarBg: { height: 4, backgroundColor: '#E5E7EB', width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: '#ed2624' },
  
  contentContainer: { flex: 1, paddingHorizontal: 20 },
  footer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 130, backgroundColor: '#F9FAFB' },
  btn: { height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
  backBtn: { flex: 0.3, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', marginRight: 10 },
  backBtnText: { color: '#374151', fontSize: 16, fontWeight: '500', fontFamily: 'InstrumentSans-Regular' },
  nextBtn: { flex: 0.7, backgroundColor: '#34339A' }, // Deep Indigo from UI
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '500', fontFamily: 'InstrumentSans-Regular' }
});
