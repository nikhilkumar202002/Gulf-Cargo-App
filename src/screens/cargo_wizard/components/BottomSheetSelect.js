import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, 
  TouchableWithoutFeedback, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../../styles/colors'; 

export default function BottomSheetSelect({ visible, title, data, onClose, onSelect, placeholder = "Search Name or Number..." }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (visible) {
        setFilteredData(data || []);
        setSearchQuery('');
    }
  }, [data, visible]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const lowerText = text.toLowerCase();
      const newData = data.filter(item => {
        const name = (item.name || '').toLowerCase();
        // Check all possible number fields
        const phone = (item.phone || item.mobile || item.contact_number || '').toString();
        const whatsapp = (item.whatsapp_number || item.whatsapp || '').toString();
        
        return name.includes(lowerText) || phone.includes(lowerText) || whatsapp.includes(lowerText);
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
            <TouchableWithoutFeedback> 
            <View style={styles.sheet}>
              
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20} color="#888" style={{marginRight: 8}} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={placeholder}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                  keyboardType={searchQuery.match(/^[0-9]+$/) ? "phone-pad" : "default"} 
                />
                {searchQuery.length > 0 && (
                   <TouchableOpacity onPress={() => handleSearch('')}>
                       <MaterialCommunityIcons name="close-circle" size={18} color="#ccc" />
                   </TouchableOpacity>
                )}
              </View>

              {/* List Data */}
              <FlatList
                data={filteredData}
                keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                    // normalize data for display
                    const contactNum = item.phone || item.mobile || item.contact_number;
                    const whatsAppNum = item.whatsapp_number || item.whatsapp;

                    return (
                      <TouchableOpacity
                        style={styles.item}
                        onPress={() => { onSelect(item); onClose(); }}
                      >
                        <View style={{flex: 1}}>
                            <Text style={styles.itemText}>{item.name}</Text>
                            
                            {/* Display Numbers Row */}
                            <View style={styles.numberRow}>
                                {contactNum ? (
                                    <View style={styles.badge}>
                                        <MaterialCommunityIcons name="phone" size={12} color="#666" style={{marginRight:4}} />
                                        <Text style={styles.subText}>{contactNum}</Text>
                                    </View>
                                ) : null}

                                {whatsAppNum ? (
                                    <View style={[styles.badge, {marginLeft: 8, backgroundColor: '#e8f5e9'}]}>
                                        <MaterialCommunityIcons name="whatsapp" size={12} color="green" style={{marginRight:4}} />
                                        <Text style={[styles.subText, {color: 'green'}]}>{whatsAppNum}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#eee" />
                      </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={() => (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No results found</Text>
                    </View>
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
        height: '70%', // Fixed height to prevent gaps or overflow issues
        paddingTop: 10
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    title: { fontWeight: 'bold', fontSize: 18, color: '#333' },
    closeBtn: { padding: 5 },
    
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f7fa',
        margin: 15, paddingHorizontal: 15, height: 45, borderRadius: 10, borderWidth: 1, borderColor: '#eee'
    },
    searchInput: { flex: 1, fontSize: 16, color: '#333', height: '100%' },

    item: { 
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#f9f9f9', 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' 
    },
    itemText: { fontSize: 16, color: '#333', fontWeight: '600', marginBottom: 4 },
    
    numberRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    badge: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', 
        paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, marginTop: 2 
    },
    subText: { fontSize: 12, color: '#555', fontWeight: '500' },
    
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#999', fontSize: 14 }
});