import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../../styles/colors'; // Adjust path if needed

export default function Step4Items({ data, update }) {
  
  // --- ACTIONS ---
  const addBox = () => {
    const newBox = {
        weight: '',
        // Initialize new items with weight instead of price focus
        items: [{ name: '', qty: '1', weight: '' }] 
    };
    update('boxes', [...data.boxes, newBox]);
  };

  const removeBox = (index) => {
    const newBoxes = [...data.boxes];
    newBoxes.splice(index, 1);
    update('boxes', newBoxes);
  };

  const updateBoxField = (boxIndex, field, value) => {
    const newBoxes = [...data.boxes];
    newBoxes[boxIndex][field] = value;
    update('boxes', newBoxes);
  };

  // --- ITEM ACTIONS ---
  const addItem = (boxIndex) => {
    const newBoxes = [...data.boxes];
    // Add new item structure
    newBoxes[boxIndex].items.push({ name: '', qty: '1', weight: '' });
    update('boxes', newBoxes);
  };

  const removeItem = (boxIndex, itemIndex) => {
    const newBoxes = [...data.boxes];
    newBoxes[boxIndex].items.splice(itemIndex, 1);
    update('boxes', newBoxes);
  };

  const updateItem = (boxIndex, itemIndex, field, value) => {
    const newBoxes = [...data.boxes];
    newBoxes[boxIndex].items[itemIndex][field] = value;
    update('boxes', newBoxes);
  };

  // Helper to calculate summary
  const getTotalItems = () => {
    return data.boxes.reduce((acc, box) => acc + box.items.length, 0);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Boxes & Items</Text>
        <Text style={styles.summaryText}>{data.boxes.length} Boxes | {getTotalItems()} Items</Text>
      </View>

      {data.boxes.map((box, boxIndex) => (
        <View key={boxIndex} style={styles.boxCard}>
            {/* Box Header */}
            <View style={styles.boxHeader}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <View style={styles.boxIconContainer}>
                         <MaterialCommunityIcons name="cube-outline" size={20} color="#283891" />
                    </View>
                    <Text style={styles.boxTitle}>Box {boxIndex + 1}</Text>
                </View>
                {data.boxes.length > 0 && (
                    <TouchableOpacity onPress={() => removeBox(boxIndex)} style={styles.deleteBoxBtn}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>

             <View style={styles.divider} />

            {/* Box Weight Input */}
            <View style={styles.weightRow}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={styles.label}>Total Box Weight (KG)</Text>
                    <Text style={{color: '#EF4444', marginLeft: 2}}>*</Text>
                </View>
                <TextInput 
                    style={[styles.weightInput, (!box.weight || parseFloat(box.weight) <= 0) && {borderWidth: 1, borderColor: '#FCA5A5'}]} 
                    keyboardType="numeric"
                    value={String(box.weight)}
                    onChangeText={(t) => updateBoxField(boxIndex, 'weight', t)}
                />
            </View>

            {/* Items List */}
            <View style={styles.itemsContainer}>
                {box.items.map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.itemRow}>
                        {/* ITEM NAME */}
                        <View style={{flex: 3, marginRight: 8}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
                                <Text style={styles.itemLabel}>Item Name</Text>
                                <Text style={{color: '#EF4444', fontSize: 10, marginLeft: 2}}>*</Text>
                            </View>
                            <TextInput 
                                style={[styles.itemInput, (!item.name || item.name.trim() === "") && {borderColor: '#FCA5A5'}]} 
                                value={item.name}
                                onChangeText={(t) => updateItem(boxIndex, itemIndex, 'name', t)}
                            />
                        </View>

                        {/* QTY */}
                        <View style={{flex: 1, marginRight: 8}}>
                            <Text style={styles.itemLabel}>Qty</Text>
                            <TextInput 
                                style={[styles.itemInput, {textAlign: 'center'}]} 
                                keyboardType="numeric" 
                                value={String(item.qty)}
                                onChangeText={(t) => updateItem(boxIndex, itemIndex, 'qty', t)}
                            />
                        </View>

                        {/* WEIGHT (KG) */}
                        <View style={{flex: 1.2}}>
                            <Text style={styles.itemLabel}>KG</Text>
                            <TextInput 
                                style={[styles.itemInput, {textAlign: 'center'}]} 
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
                    <MaterialCommunityIcons name="plus" size={20} color="#34339A" />
                    <Text style={styles.addItemText}>Add Item</Text>
                </TouchableOpacity>
            </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addBoxBtn} onPress={addBox}>
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        <Text style={styles.addBoxText}>Add New Box</Text>
      </TouchableOpacity>

      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 15, marginTop: 10
  },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  summaryText: { fontSize: 13, color: '#9CA3AF' },
  
  boxCard: { 
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, 
   
  },
  
  // Header
  boxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  boxIconContainer: { marginRight: 10 },
  boxTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  deleteBoxBtn: { 
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEE2E2', 
    justifyContent: 'center', alignItems: 'center' 
  },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 16 },

  // Weight Row
  weightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827' },
  weightInput: { 
    backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, 
    width: 100, textAlign: 'right', fontSize: 15, color: '#111827' 
  },

  // Items List
  itemsContainer: { },
  itemRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  itemLabel: { fontSize: 11, color: '#6B7280', marginBottom: 6 },
  itemInput: { 
    backgroundColor: '#F9FAFB', borderRadius: 8, paddingHorizontal: 12, height: 44, 
    fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#F3F4F6'
  },
  deleteItemBtn: { marginLeft: 8, marginBottom: 12, padding: 4 },

  // Add Item Button
  addItemBtn: { 
    backgroundColor: '#E0E7FF', borderRadius: 8, height: 48, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 
  },
  addItemText: { color: '#34339A', fontWeight: '600', fontSize: 15, marginLeft: 6 },

  // Add Box Button (Global)
  addBoxBtn: { 
    backgroundColor: '#ed2624', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    height: 54, borderRadius: 12, marginTop: 8 
  },
  addBoxText: { color: '#fff', fontWeight: '600', marginLeft: 8, fontSize: 16 }
});
