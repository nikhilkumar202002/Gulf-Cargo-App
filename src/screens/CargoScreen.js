import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  useLayoutEffect(() => {
    StatusBar.setHidden(false, 'slide');
  }, []);

  const getInitialState = () => ({
    branch_id: '', branch_name: '', sender_id: '', receiver_id: '',
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
    
    boxes: [], no_of_pieces: 0, sender: null, receiver: null, collected_by: null 
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    if (userData) {
        const userObj = userData.user || userData;
        const bId = userData.branch_id || userObj.branch?.id || userObj.branch_id;
        const bName = userData.branchName || userObj.branch?.name || userObj.branch_name;
        
        if (bId) {
            setFormData(prev => ({ ...prev, branch_id: bId, branch_name: bName, name_id: userObj.id || userData.id }));
        }
    }
  }, [userData]);

  const updateFormData = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmitInvoice = async () => {
    setLoading(true);
    // ... (Keep your exact existing submit logic here) ...
    setLoading(false);
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
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* Global Progress Card matching UI exactly */}
        <View style={styles.topCardContainer}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Create New Bill</Text>
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
          <TouchableOpacity 
            style={[styles.btn, styles.backBtn, currentStep === 1 && { opacity: 0 }]} 
            onPress={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
          >
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.btn, styles.nextBtn]} onPress={handleNext} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.nextBtnText}>{currentStep === totalSteps ? 'Submit' : 'Next Step'}</Text>}
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
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  progressTitle: { fontSize: 16, color: '#111827', fontWeight: '500', fontFamily: 'InstrumentSans-Regular' },
  stepBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stepBadgeText: { color: '#312E81', fontSize: 12, fontWeight: '600', fontFamily: 'InstrumentSans-Regular' },
  progressBarBg: { height: 4, backgroundColor: '#E5E7EB', width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: '#ed2624' },
  
  contentContainer: { flex: 1, paddingHorizontal: 20 },
  footer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, backgroundColor: '#F9FAFB', justifyContent: 'space-between' },
  btn: { height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  backBtn: { flex: 0.35, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB' },
  backBtnText: { color: '#374151', fontSize: 16, fontWeight: '500', fontFamily: 'InstrumentSans-Regular' },
  nextBtn: { flex: 0.6, marginLeft: 12, backgroundColor: '#34339A' }, // Deep Indigo from UI
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '500', fontFamily: 'InstrumentSans-Regular' }
});