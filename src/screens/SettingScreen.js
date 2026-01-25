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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
            onPress={() => Alert.alert("Edit Profile", "Feature coming soon")}
          />
        </View>

        {/* 3. SECURITY & SESSION SECTION */}
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.sectionCard}>
          <SettingItem 
            icon="lock-reset" 
            label="Change Password" 
            onPress={() => Alert.alert("Security", "Contact Admin to reset password")}
          />
          <View style={styles.divider} />
          <SettingItem 
            icon="history" 
            label="Session Info" 
            value="Active (Expires monthly)" 
            showChevron={false}
          />
        </View>

        {/* 4. APP INFO */}
        <Text style={styles.sectionTitle}>Application</Text>
        <View style={styles.sectionCard}>
          <SettingItem 
            icon="information-outline" 
            label="App Version" 
            value="v1.0.2" 
            showChevron={false}
          />
          <View style={styles.divider} />
          <SettingItem 
            icon="shield-check-outline" 
            label="Terms & Conditions" 
            onPress={() => Alert.alert("Terms", "Legal documents loading...")}
          />
        </View>

        {/* 5. LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={colors.primary} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>Gulf Cargo International © 2026</Text>
        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.secondary },
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
  userName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 14, color: '#666', marginTop: 4 },
  roleBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  roleText: { color: colors.secondary, fontSize: 12, fontWeight: 'bold' },
  
  content: { padding: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
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
  itemLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  itemValue: { fontSize: 12, color: '#888', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 15 },
  
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ffebee',
  },
  logoutText: { color: colors.primary, fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  footerNote: { textAlign: 'center', color: '#ccc', fontSize: 12, marginTop: 20 },
});