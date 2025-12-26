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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Boxes & Items</Text>
        <Text style={styles.summaryText}>{data.boxes.length} Boxes • {getTotalItems()} Items</Text>
      </View>

      {data.boxes.map((box, boxIndex) => (
        <View key={boxIndex} style={styles.boxCard}>
            {/* Box Header */}
            <View style={styles.boxHeader}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <MaterialCommunityIcons name="package-variant" size={24} color={colors.secondary} />
                    <Text style={styles.boxTitle}> Box #{boxIndex + 1}</Text>
                </View>
                <TouchableOpacity onPress={() => removeBox(boxIndex)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="red" />
                </TouchableOpacity>
            </View>

            {/* Box Weight Input */}
            <View style={styles.rowInput}>
                <Text style={styles.label}>Total Box Weight (kg):</Text>
                <TextInput 
                    style={styles.smallInput} 
                    placeholder="0.0" 
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
                        <View style={{flex: 1}}>
                            <Text style={styles.itemLabel}>Item Name</Text>
                            <TextInput 
                                style={styles.itemInput} 
                                placeholder="e.g. Clothes" 
                                value={item.name}
                                onChangeText={(t) => updateItem(boxIndex, itemIndex, 'name', t)}
                            />
                        </View>

                        {/* QTY */}
                        <View style={{width: 60, marginLeft: 10}}>
                            <Text style={styles.itemLabel}>Qty</Text>
                            <TextInput 
                                style={styles.itemInput} 
                                placeholder="1" 
                                keyboardType="numeric" 
                                value={String(item.qty)}
                                onChangeText={(t) => updateItem(boxIndex, itemIndex, 'qty', t)}
                            />
                        </View>

                        {/* CHANGED: PRICE -> WEIGHT */}
                        <View style={{width: 80, marginLeft: 10}}>
                            <Text style={styles.itemLabel}>Weight</Text>
                            <TextInput 
                                style={styles.itemInput} 
                                placeholder="0.0" 
                                keyboardType="numeric" 
                                value={String(item.weight)}
                                onChangeText={(t) => updateItem(boxIndex, itemIndex, 'weight', t)}
                            />
                        </View>

                        {/* Remove Item Button */}
                        {box.items.length > 1 && (
                            <TouchableOpacity onPress={() => removeItem(boxIndex, itemIndex)} style={{marginTop: 18, marginLeft: 8}}>
                                <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
                
                <TouchableOpacity style={styles.addItemBtn} onPress={() => addItem(boxIndex)}>
                    <Text style={styles.addItemText}>+ Add Another Item</Text>
                </TouchableOpacity>
            </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addBoxBtn} onPress={addBox}>
        <MaterialCommunityIcons name="plus-box" size={24} color="#fff" />
        <Text style={styles.addBoxText}>Add New Box</Text>
      </TouchableOpacity>

      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.secondary },
  summaryText: { color: '#666', fontWeight: '600' },
  
  boxCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#ddd', elevation: 2 },
  boxHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10 },
  boxTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  
  rowInput: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  label: { fontSize: 14, color: '#333', marginRight: 10 },
  smallInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, width: 100, textAlign: 'center', fontWeight: 'bold' },

  itemsContainer: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 },
  itemRow: { flexDirection: 'row', marginBottom: 10 },
  itemLabel: { fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase' },
  itemInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, padding: 8, fontSize: 14 },
  
  addItemBtn: { alignSelf: 'center', marginTop: 5, padding: 10 },
  addItemText: { color: colors.primary, fontWeight: '600' },

  addBoxBtn: { backgroundColor: colors.secondary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 10 },
  addBoxText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 }
});