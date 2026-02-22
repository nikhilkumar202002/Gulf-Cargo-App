import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, Alert, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import colors from '../styles/colors';

export default function SettingScreen() {
  const { userData } = useUser();
  const navigation = useNavigation();

  // Access user data safely based on your context structure
  const currentUser = userData?.user || userData || {};

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.replace('Login');
        }
      }
    ]);
  };

  const SettingItem = ({ icon, label, value, onPress, color = "#333", showChevron = true }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress} 
      disabled={!onPress}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: color + '10' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <View>
          <Text style={styles.itemLabel}>{label}</Text>
          {value ? <Text style={styles.itemValue}>{value}</Text> : null}
        </View>
      </View>
      {showChevron && <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* 1. PROFILE HEADER */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {currentUser.profile_pic ? (
            <Image source={{ uri: currentUser.profile_pic }} style={styles.avatar} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={80} color={colors.secondary} />
          )}
          <TouchableOpacity style={styles.editAvatarBtn}>
            <MaterialCommunityIcons name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{currentUser.name || 'Staff Member'}</Text>
        <Text style={styles.userEmail}>{currentUser.email || 'No Email'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{currentUser.role?.name || currentUser.role || 'Staff'}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* 2. ACCOUNT SECTION */}
        <Text style={styles.sectionTitle}>Account & Branch</Text>
        <View style={styles.sectionCard}>
          <SettingItem 
            icon="office-building" 
            label="Assigned Branch" 
            value={currentUser.branch?.name || currentUser.branchName || 'Not Assigned'}
            color={colors.secondary}
            showChevron={false}
          />
          <View style={styles.divider} />
          <SettingItem 
            icon="account-edit-outline" 
            label="Edit Profile" 
            onPress={() => navigation.navigate('EditProfile')}
          />
        </View>

        {/* 3. APP INFO */}
        <Text style={styles.sectionTitle}>Application</Text>
        <View style={styles.sectionCard}>
          <SettingItem 
            icon="information-outline" 
            label="App Version" 
            value="v1.0.2" 
            showChevron={false}
          />
        </View>

        {/* 5. LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={colors.primary} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>Gulf Cargo International © 2026</Text>
        <View style={{ height: 140 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#f0f0f0' },
  editAvatarBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: { fontSize: 18, fontWeight: '700', color: '#000', fontFamily: 'InstrumentSans-Bold' },
  userEmail: { fontSize: 13, color: '#9CA3AF', marginTop: 3, fontFamily: 'InstrumentSans-Regular' },
  roleBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
  },
  roleText: { color: colors.secondary, fontSize: 11, fontWeight: '600', fontFamily: 'InstrumentSans-Regular' },
  
  content: { padding: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BCCCDC',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 2,
    marginTop: 6,
    letterSpacing: 0.5,
    fontFamily: 'InstrumentSans-Medium'
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemLabel: { fontSize: 14, fontWeight: '500', color: '#1F2937', fontFamily: 'InstrumentSans-Regular' },
  itemValue: { fontSize: 12, color: '#9CA3AF', marginTop: 2, fontFamily: 'InstrumentSans-Regular' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 14 },
  
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 13,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ffebee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  logoutText: { color: colors.primary, fontWeight: '600', fontSize: 14, marginLeft: 8, fontFamily: 'InstrumentSans-Regular' },
  footerNote: { textAlign: 'center', color: '#D1D5DB', fontSize: 11, marginTop: 12, fontFamily: 'InstrumentSans-Regular' },
});