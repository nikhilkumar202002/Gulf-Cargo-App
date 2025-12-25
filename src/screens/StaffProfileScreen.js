import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { getStaffDetails } from '../api/staff'; // Import the new function

export default function StaffProfileScreen() {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      // Fetching specifically for ID 10 as requested
      const response = await getStaffDetails(10);
      
      console.log('Staff Data:', response.data);
      
      if (response.data) {
        setStaff(response.data); // Adjust this depending on if data is nested like response.data.data
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      Alert.alert('Error', 'Could not fetch staff details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      {staff ? (
        <>
          <Text style={styles.title}>Staff Profile</Text>
          <Text style={styles.label}>ID: <Text style={styles.value}>{staff.id}</Text></Text>
          <Text style={styles.label}>Name: <Text style={styles.value}>{staff.name}</Text></Text>
          {/* Render other fields based on your API response structure */}
        </>
      ) : (
        <Text>No staff data found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  value: { fontWeight: 'normal' }
});