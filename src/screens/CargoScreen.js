import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import colors from '../styles/colors';
import { useUser } from '../context/UserContext';
import { createCargo } from '../services/cargoService';

// --- IMPORT STEPS ---
import Step1Collection from './cargo_wizard/steps/Step1Collection'; 

export default function CargoScreen() {
  const navigation = useNavigation();
  const { userData } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 6;

  // --- CENTRAL FORM STATE ---
  const [formData, setFormData] = useState({
    // Initialize with safe defaults
    branch_id: '', 
    branch_name: '',
    name_id: '',
    collected_by: null,
    date: new Date(),
    time: new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'}),
    // ... other fields ...
    sender: null, receiver: null,
    shipping_method_id: 1, delivery_type_id: 1, payment_method_id: 1, status_id: 1,
    lrl_tracking_code: '', special_remarks: '',
    boxes: [], no_of_pieces: 0,
    total_cost: 0, bill_charges: 0, vat_percentage: 5.0, vat_cost: 0, net_total: 0, total_weight: 0, total_amount: 0,
    quantity_total_weight: 0, unit_rate_total_weight: 0, amount_total_weight: 0,
    quantity_duty: 0, unit_rate_duty: 0, amount_duty: 0,
    quantity_packing_charge: 0, unit_rate_packing_charge: 0, amount_packing_charge: 0,
    quantity_additional_packing_charge: 0, unit_rate_additional_packing_charge: 0, amount_additional_packing_charge: 0,
    quantity_insurance: 0, unit_rate_insurance: 0, amount_insurance: 0,
    quantity_awb_fee: 1, unit_rate_awb_fee: 0, amount_awb_fee: 0,
    quantity_volume_weight: 0, unit_rate_volume_weight: 0, amount_volume_weight: 0,
    quantity_other_charges: 0, unit_rate_other_charges: 0, amount_other_charges: 0,
    quantity_discount: 0, unit_rate_discount: 0, amount_discount: 0,
    quantity_vat_amount: 1, unit_rate_vat_amount: 0, amount_vat_amount: 0,
  });

  // --- CRITICAL FIX: Sync Data when Context Loads ---
  useEffect(() => {
    if (userData) {
        console.log("🔄 CargoScreen: Syncing User Data...", userData);
        
        // Try to find the ID in every possible place
        const foundBranchId = userData.branch_id || userData.branch?.id;
        const foundBranchName = userData.branchName || userData.branch?.name;
        const foundUserId = userData.id;

        if (foundBranchId) {
            setFormData(prev => ({
                ...prev,
                branch_id: foundBranchId,     // <--- SETTING THE MISSING ID
                branch_name: foundBranchName,
                name_id: foundUserId,
            }));
            console.log("✅ Branch ID set to:", foundBranchId);
        } else {
            console.error("❌ STILL MISSING BRANCH ID in UserData");
        }
    }
  }, [userData]); 
  // --------------------------------------------------

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmitInvoice = async () => { /* ... keep your existing submit logic ... */ };

  const handleNext = () => {
    if (currentStep === 1 && !formData.collected_by) {
        Alert.alert("Required", "Please select who collected this cargo.");
        return;
    }
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    else handleSubmitInvoice();
  };

  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const renderStep = () => {
    switch(currentStep) {
      case 1: return <Step1Collection data={formData} update={updateFormData} />;
      default: return <View><Text>Step {currentStep} (Coming Soon)</Text></View>;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Invoice</Text>
        <View style={styles.stepBadge}><Text style={styles.stepText}>{currentStep}/{totalSteps}</Text></View>
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
            <Text style={styles.nextBtnText}>{currentStep === totalSteps ? 'Submit' : 'Next Step'}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
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
  nextBtnText: { color: '#fff', fontWeight: 'bold', marginRight: 8 }
});