import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import colors from '../../../styles/colors';

export default function BottomSheetSelect({ visible, title, data, onClose, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{color: 'red'}}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList 
                        data={data}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={styles.item} 
                                onPress={() => { onSelect(item); onClose(); }}
                            >
                                <Text style={styles.itemText}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    title: { fontWeight: 'bold', fontSize: 16 },
    item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    itemText: { fontSize: 16, color: '#333' }
});