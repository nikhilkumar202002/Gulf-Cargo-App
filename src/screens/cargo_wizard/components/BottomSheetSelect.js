import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, 
  TouchableWithoutFeedback, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// FIX: Ensure this path points to your actual colors file
import colors from '../../../styles/colors'; 

export default function BottomSheetSelect({ visible, title, data, onClose, onSelect, placeholder = "Search..." }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  // Reset list and search when the modal opens or data changes
  useEffect(() => {
    if (visible) {
        setFilteredData(data || []);
        setSearchQuery('');
    }
  }, [data, visible]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const newData = data.filter(item => {
        const itemName = item.name ? item.name.toUpperCase() : '';
        const itemPhone = item.phone ? String(item.phone).toUpperCase() : '';
        const textData = text.toUpperCase();
        
        // Search by Name OR Phone
        return itemName.indexOf(textData) > -1 || itemPhone.indexOf(textData) > -1;
      });
      setFilteredData(newData);
    } else {
      setFilteredData(data);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
            {/* Stop propagation so clicking the sheet doesn't close it */}
            <TouchableWithoutFeedback> 
            <View style={styles.sheet}>
              
              {/* 1. Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* 2. Search Bar (Auto Suggestion) */}
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20} color="#888" style={{marginRight: 8}} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={placeholder}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                   <TouchableOpacity onPress={() => handleSearch('')}>
                       <MaterialCommunityIcons name="close-circle" size={18} color="#ccc" />
                   </TouchableOpacity>
                )}
              </View>

              {/* 3. List Data */}
              <FlatList
                data={filteredData}
                keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={() => (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No results found</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <View>
                        <Text style={styles.itemText}>{item.name}</Text>
                        {item.phone && <Text style={styles.subText}>{item.phone}</Text>}
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#eee" />
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { 
        backgroundColor: '#fff', 
        borderTopLeftRadius: 20, 
        borderTopRightRadius: 20, 
        maxHeight: '85%', 
        minHeight: '50%',
        paddingTop: 10
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    title: { fontWeight: 'bold', fontSize: 18, color: '#333' },
    closeBtn: { padding: 5 },
    
    // Search Styles
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
        margin: 15,
        paddingHorizontal: 15,
        height: 45,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee'
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%'
    },

    // List Styles
    item: { 
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#f9f9f9', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    itemText: { fontSize: 16, color: '#333', fontWeight: '500' },
    subText: { fontSize: 13, color: '#888', marginTop: 2 },
    
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#999', fontSize: 14 }
});