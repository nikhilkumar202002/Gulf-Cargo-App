import React from 'react';
import { View, StyleSheet, Platform, StatusBar, SafeAreaView } from 'react-native';
import Header from '../components/Header';
import MainTabNavigator from './MainTabNavigator';

export default function MainLayout() {
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      {/* Header */}
      <Header />
      
      {/* Content Area - MainTabNavigator (includes footer/tabs) */}
      <View style={styles.contentContainer}>
        <MainTabNavigator />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    flex: 1,
  },
});
