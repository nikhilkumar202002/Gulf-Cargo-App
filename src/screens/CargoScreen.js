import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../styles/colors';
import { useUser } from '../context/UserContext';
import { createCargo } from '../services/cargoService';
import { generateInvoicePDF } from '../services/pdfGenerator';
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
  const totalSteps = 6;

  const getInitialState = () => ({
    branch_id: '', branch_name: '', sender_id: '', receiver_id: '',
    shipping_method_id: '', payment_method_id: '', status_id: 1,
    date: new Date(),
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    collected_by_id: '', name_id: '', lrl_tracking_code: '', delivery_type_id: '',
    special_remarks: '',
    total_cost: 0, bill_charges: 0, vat_percentage: 15.0, vat_cost: 0, 
    net_total: 0, total_amount: 0, total_weight: 0,
    
    // API-aligned financial keys
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
    
    boxes: [], no_of_pieces: 0, sender: null, receiver: null, collected_by: null 
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    if (userData) {
        const userObj = userData.user || userData;
        // Fix for branch not loading: search all possible context paths
        const bId = userData.branch_id || userObj.branch?.id || userObj.branch_id;
        const bName = userData.branchName || userObj.branch?.name || userObj.branch_name;
        
        if (bId) {
            setFormData(prev => ({
                ...prev,
                branch_id: bId,
                branch_name: bName,
                name_id: userObj.id || userData.id,
            }));
        }
    }
  }, [userData]);

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmitInvoice = async () => {
    setLoading(true);
    try {
        const boxWeightMap = {};
        const flatItems = [];
        formData.boxes.forEach((box, i) => {
            const bNum = (i + 1).toString();
            boxWeightMap[bNum] = parseFloat(box.weight) || 0;
            box.items?.forEach(item => {
                flatItems.push({
                    slno: flatItems.length + 1, box_number: i + 1, name: item.name,
                    piece_no: parseInt(item.qty) || 1, unit_price: 0, total_price: 0, 
                    weight: parseFloat(item.weight) || 0
                });
            });
        });

        // Calculate bill charges: sum of all fees excluding total weight charge
        const otherCharges = (
            parseFloat(formData.amount_duty || 0) + parseFloat(formData.amount_packing_charge || 0) +
            parseFloat(formData.amount_additional_packing_charge || 0) + parseFloat(formData.amount_insurance || 0) +
            parseFloat(formData.amount_awb_fee || 0) + parseFloat(formData.amount_other_charges || 0) +
            parseFloat(formData.amount_volume_weight || 0)
        );

        const payload = {
            ...formData,
            // FIX: Explicitly set required ID fields from objects
            sender_id: formData.sender?.id,
            receiver_id: formData.receiver?.id,
            collected_by_id: formData.collected_by?.id || formData.collected_by_id,
            date: new Date(formData.date).toISOString().split('T')[0],
            total_cost: parseFloat(formData.amount_total_weight) || 0,
            bill_charges: otherCharges,
            vat_cost: parseFloat(formData.amount_vat_amount) || 0,
            total_amount: parseFloat(formData.net_total) || 0,
            box_weight: boxWeightMap,
            items: flatItems,
            no_of_pieces: flatItems.length
        };

        const res = await createCargo(payload);
        if (res.data.success || res.status === 200) {
            Alert.alert("Success", "Cargo Invoice Created!", [
                { 
                  text: "Generate PDF", 
                  onPress: () => {
                    generateInvoicePDF(res.data.data || res.data.cargo);
                    // Reset form data and redirect to History
                    setFormData(getInitialState());
                    setCurrentStep(1); // Reset to first step
                    navigation.navigate('History');
                  } 
                },
                { 
                  text: "OK", 
                  onPress: () => {
                    // Reset form data and redirect to History
                    setFormData(getInitialState());
                    setCurrentStep(1); // Reset to first step
                    navigation.navigate('History');
                  } 
                }
            ]);
        }
    } catch (e) {
        const serverErrors = e.response?.data?.errors;
        const msg = serverErrors ? Object.values(serverErrors).flat().join('\n') : "Submission failed.";
        Alert.alert("Submission Error", msg);
    } finally {
        setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.collected_by && !formData.collected_by_id) return Alert.alert("Required", "Select Collector");
    if (currentStep === 2 && (!formData.sender || !formData.receiver)) return Alert.alert("Required", "Select Sender and Receiver");
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    else handleSubmitInvoice();
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
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Bill</Text>
          <View style={styles.stepBadge}><Text style={styles.stepText}>Step {currentStep}/{totalSteps}</Text></View>
        </View>
        <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${(currentStep/totalSteps)*100}%` }]} /></View>
        <View style={styles.contentContainer}>{renderStep()}</View>
        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(currentStep - 1)}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.nextBtnText}>{currentStep === totalSteps ? 'Submit' : 'Next Step'}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 110 : 90 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.secondary },
  stepBadge: { backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stepText: { fontSize: 12, fontWeight: 'bold', color: colors.secondary },
  progressBarBg: { height: 4, backgroundColor: '#eee' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary },
  contentContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 0 },
  footer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', justifyContent: 'space-between', elevation: 5 },
  backBtn: { padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  backBtnText: { fontWeight: '600', color: '#666' },
  nextBtn: { flex: 1, marginLeft: 10, backgroundColor: colors.primary, padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: 'bold' }
});