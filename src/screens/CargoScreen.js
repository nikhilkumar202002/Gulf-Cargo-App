import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import colors from '../styles/colors';
import { useUser } from '../context/UserContext';
import { createCargo } from '../services/cargoService'; 
import { generateInvoicePDF } from '../services/pdfGenerator';

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

  // --- INITIAL STATE HELPER ---
  const getInitialState = () => ({
    // Step 1
    branch_id: '',
    branch_name: '',
    name_id: '',
    collected_by: null,
    date: new Date(),
    time: new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'}),

    // Step 2
    sender: null,
    receiver: null,

    // Step 3
    shipping_method_id: '', shipping_method_name: '',
    delivery_type_id: '', delivery_type_name: '',
    payment_method_id: '', payment_method_name: '',
    status_id: 1,
    lrl_tracking_code: '',
    special_remarks: '',

    // Step 4
    boxes: [], 
    no_of_pieces: 0, 

    // Step 5 & Financials
    total_cost: 0, bill_charges: 0, vat_percentage: 5.0, vat_cost: 0, 
    net_total: 0, total_amount: 0, total_weight: 0,
    
    // Detailed Charges
    quantity_total_weight: 0, unit_rate_total_weight: 0, amount_total_weight: 0,
    quantity_duty: 0, unit_rate_duty: 0, amount_duty: 0,
    quantity_packing_charge: 0, unit_rate_packing_charge: 0, amount_packing_charge: 0,
    quantity_additional_packing_charge: 0, unit_rate_additional_packing_charge: 0, amount_additional_packing_charge: 0,
    quantity_insurance: 0, unit_rate_insurance: 0, amount_insurance: 0,
    quantity_awb_fee: 1, unit_rate_awb_fee: 0, amount_awb_fee: 0,
    quantity_other_charges: 0, unit_rate_other_charges: 0, amount_other_charges: 0,
    quantity_discount: 0, unit_rate_discount: 0, amount_discount: 0,
    quantity_vat_amount: 1, unit_rate_vat_amount: 0, amount_vat_amount: 0,
  });

  const [formData, setFormData] = useState(getInitialState());

  // --- SYNC USER DATA ---
  useEffect(() => {
    if (userData) {
        const userObj = userData.user || userData; 
        const foundBranchId = userObj.branch_id || userObj.branch?.id;
        const foundBranchName = userObj.branchName || userObj.branch?.name || '';

        if (foundBranchId) {
            setFormData(prev => ({
                ...prev,
                branch_id: foundBranchId,
                branch_name: foundBranchName,
                name_id: userObj.id,
            }));
        }
    }
  }, [userData]);

  // --- RESET FORM (REDIRECT TO STEP 1) ---
  const resetForm = () => {
      const freshState = getInitialState();
      // Preserve User/Branch info
      setFormData({
          ...freshState,
          branch_id: formData.branch_id,
          branch_name: formData.branch_name,
          name_id: formData.name_id
      });
      setCurrentStep(1);
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // --- SUBMIT LOGIC ---
  const handleSubmitInvoice = async () => {
    setLoading(true);

    let calculatedTotalWeight = 0;
    formData.boxes.forEach(box => {
        calculatedTotalWeight += parseFloat(box.weight) || 0;
    });

    const boxWeightMap = {};
    const flatItemsList = [];
    let serialNumberCounter = 1; 

    formData.boxes.forEach((box, i) => {
        const boxNum = i + 1;
        boxWeightMap[boxNum.toString()] = parseFloat(box.weight) || 0;

        if (box.items) {
            box.items.forEach(item => {
                flatItemsList.push({
                    slno: serialNumberCounter++, 
                    box_number: boxNum,
                    name: item.name || 'Item',
                    piece_no: parseInt(item.qty) || 1,
                    unit_price: 0, 
                    total_price: 0,
                    weight: parseFloat(item.weight) || 0
                });
            });
        }
    });

    const payload = {
        ...formData,
        branch_id: formData.branch_id,
        sender_id: formData.sender?.id, 
        receiver_id: formData.receiver?.id, 
        collected_by_id: formData.collected_by?.id, 
        date: new Date(formData.date).toISOString().split('T')[0],
        total_weight: calculatedTotalWeight,
        quantity_total_weight: calculatedTotalWeight,
        unit_rate_total_weight: formData.unit_rate_total_weight || 0, 
        amount_total_weight: formData.amount_total_weight || 0,
        box_weight: boxWeightMap,
        items: flatItemsList,
        no_of_pieces: flatItemsList.length
    };

    try {
        const response = await createCargo(payload);
        if(response.data.success || response.status === 200) {
            const createdInvoiceData = response.data.data || response.data.cargo || { ...payload, id: response.data.id };
            
             Alert.alert(
                "Success", 
                "Invoice Created Successfully!", 
                [
                    { 
                        text: "Generate PDF", 
                        onPress: () => {
                            generateInvoicePDF(createdInvoiceData);
                            resetForm(); // Redirects to Step 1 after generating
                        } 
                    },
                    { 
                        text: "Create New", 
                        onPress: resetForm // Redirects to Step 1 immediately
                    }
                ]
            );
        } else {
             Alert.alert("Error", response.data.message || "Failed to create invoice");
        }
    } catch (error) {
        console.error("❌ SUBMISSION ERROR:", error);
        
        if (error.response?.data?.errors) {
            const errorData = error.response.data.errors;
            const firstErrorKey = Object.keys(errorData)[0];
            const firstErrorMessage = errorData[firstErrorKey][0];
            Alert.alert("Validation Error", `${firstErrorKey}: ${firstErrorMessage}`);
        } else {
            Alert.alert("Error", "Server returned an error. Check console.");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.collected_by) return Alert.alert("Required", "Select Collector");
    if (currentStep === 2 && (!formData.sender || !formData.receiver)) return Alert.alert("Required", "Select Sender and Receiver");
    if (currentStep === 4 && formData.boxes.length === 0) return Alert.alert("Required", "Add at least one box");
    
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    else handleSubmitInvoice();
  };

  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Invoice</Text>
        <View style={styles.stepBadge}><Text style={styles.stepText}>Step {currentStep}/{totalSteps}</Text></View>
      </View>
      
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${(currentStep/totalSteps)*100}%` }]} />
      </View>
      
      {/* Content */}
      <View style={styles.contentContainer}>
        {renderStep()}
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        {currentStep > 1 ? (
             <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Text style={styles.backBtnText}>Back</Text>
             </TouchableOpacity>
        ) : <View style={{width: 10}} />}
        
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={loading}>
            {loading ? (
                <ActivityIndicator color="#fff"/> 
            ) : (
                <Text style={styles.nextBtnText}>
                    {currentStep === totalSteps ? 'Submit' : 'Next Step'}
                </Text>
            )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f7fa' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 10,
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderColor: '#eee' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.secondary 
  },
  stepBadge: { 
    backgroundColor: '#e0e7ff', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  stepText: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: colors.secondary 
  },
  progressBarBg: { 
    height: 4, 
    backgroundColor: '#eee' 
  },
  progressBarFill: { 
    height: '100%', 
    backgroundColor: colors.primary 
  },
  contentContainer: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 8,
    paddingBottom: 0 
  },
  footer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderColor: '#eee', 
    justifyContent: 'space-between' 
  },
  backBtn: { 
    padding: 10, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8 
  },
  backBtnText: { 
    fontWeight: '600', 
    color: '#666' 
  },
  nextBtn: { 
    flex: 1, 
    marginLeft: 10, 
    backgroundColor: colors.primary, 
    padding: 10, 
    borderRadius: 8, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  nextBtnText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  }
});