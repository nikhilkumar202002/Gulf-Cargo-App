import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function CargoScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7f7ff' }}>
      <View style={styles.content}>
        <Text>Cargo Screen Content</Text>
      </View>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});