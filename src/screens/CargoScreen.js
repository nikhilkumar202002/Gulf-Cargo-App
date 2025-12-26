import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import colors from '../styles/colors';
import { useUser } from '../context/UserContext';
import { createCargo } from '../services/cargoService';

// --- IMPORT ALL STEPS ---
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
  const totalSteps = 6;

  // --- CENTRAL FORM STATE ---
  const [formData, setFormData] = useState({
    branch_id: '', 
    branch_name: '',
    name_id: '',
    collected_by: null,
    date: new Date(),
    time: new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'}),
    
    sender: null, 
    receiver: null,
    
    shipping_method_id: 1, 
    delivery_type_id: 1, 
    payment_method_id: 1, 
    status_id: 1,
    lrl_tracking_code: '', 
    special_remarks: '',
    
    boxes: [], // [{ weight: 10, items: [...] }]
    
    total_cost: 0, 
    bill_charges: 0, 
    vat_percentage: 5.0, 
    vat_cost: 0, 
    net_total: 0, 
    total_amount: 0,
    
    quantity_packing_charge: 0, amount_packing_charge: 0,
    quantity_insurance: 0, amount_insurance: 0,
    quantity_duty: 0, amount_duty: 0,
    quantity_awb_fee: 1, amount_awb_fee: 0,
    quantity_other_charges: 0, amount_other_charges: 0,
    amount_discount: 0
  });

  // Sync Data when Context Loads
  useEffect(() => {
    if (userData) {
        const foundBranchId = userData.branch_id || userData.branch?.id;
        if (foundBranchId) {
            setFormData(prev => ({
                ...prev,
                branch_id: foundBranchId,
                branch_name: userData.branchName || userData.branch?.name,
                name_id: userData.id,
            }));
        }
    }
  }, [userData]); 

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // --- NAVIGATION HANDLERS ---
  const handleNext = () => {
    // Validation per step
    if (currentStep === 1 && !formData.collected_by) return Alert.alert("Required", "Select Collector");
    if (currentStep === 2 && (!formData.sender || !formData.receiver)) return Alert.alert("Required", "Select Sender and Receiver");
    if (currentStep === 4 && formData.boxes.length === 0) return Alert.alert("Required", "Add at least one box");
    
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    else handleSubmitInvoice();
  };

  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleSubmitInvoice = async () => {
    setLoading(true);
    // Transform boxes structure for API
    const boxWeightMap = {};
    const flatItemsList = [];
    formData.boxes.forEach((box, i) => {
        boxWeightMap[(i+1).toString()] = parseFloat(box.weight || 0);
        box.items.forEach(item => flatItemsList.push({
            box_number: i + 1,
            name: item.name,
            piece_no: parseInt(item.qty),
            unit_price: parseFloat(item.price),
            total_price: parseFloat(item.price) * parseInt(item.qty),
            weight: 0 // Optional item weight
        }));
    });

    const payload = {
        ...formData,
        sender_id: formData.sender?.id,
        receiver_id: formData.receiver?.id,
        collected_by_id: formData.collected_by?.id,
        date: formData.date.toISOString().split('T')[0],
        box_weight: boxWeightMap,
        items: flatItemsList,
        no_of_pieces: flatItemsList.length
    };

    try {
        await createCargo(payload);
        Alert.alert("Success", "Invoice Created!", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (e) {
        Alert.alert("Error", "Failed to submit.");
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1: return <Step1Collection data={formData} update={updateFormData} />;
      case 2: return <Step2Parties data={formData} update={updateFormData} />;
      case 3: return <Step3Shipment data={formData} update={updateFormData} />;
      case 4: return <Step4Items data={formData} update={updateFormData} />;
      case 5: return <Step5Charges data={formData} update={updateFormData} />;
      case 6: return <Step6Review data={formData} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Invoice</Text>
        <View style={styles.stepBadge}><Text style={styles.stepText}>Step {currentStep}/{totalSteps}</Text></View>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${(currentStep/totalSteps)*100}%` }]} />
      </View>
      <View style={styles.contentContainer}>{renderStep()}</View>
      <View style={styles.footer}>
        {currentStep > 1 ? (
             <TouchableOpacity style={styles.backBtn} onPress={handleBack}><Text style={styles.backBtnText}>Back</Text></TouchableOpacity>
        ) : <View style={{width: 10}} />}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.nextBtnText}>{currentStep === totalSteps ? 'Submit' : 'Next Step'}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.secondary },
  stepBadge: { backgroundColor: '#e0e7ff', padding: 8, borderRadius: 12 },
  stepText: { fontSize: 12, fontWeight: 'bold', color: colors.secondary },
  progressBarBg: { height: 4, backgroundColor: '#eee' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary },
  contentContainer: { flex: 1, padding: 16 },
  footer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', justifyContent: 'space-between' },
  backBtn: { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  backBtnText: { fontWeight: '600', color: '#666' },
  nextBtn: { flex: 1, marginLeft: 10, backgroundColor: colors.primary, padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: 'bold' }
});