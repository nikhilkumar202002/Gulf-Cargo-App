import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import colors from '../styles/colors';

const Header = () => {
  const { userData } = useUser();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  // --- FIX START ---
  // The API response you shared puts data inside a "user" object.
  // We try to access userData.user first. If that doesn't exist, we fallback to userData.
  const currentUser = userData?.user || userData || {};
  // --- FIX END ---

  const toggleMenu = () => setMenuVisible(!menuVisible);
  const closeMenu = () => setMenuVisible(false);

  const handleLogout = () => {
    closeMenu();
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  return (
    <View style={styles.headerContainer}>
      {/* Left Content */}
      <View style={styles.leftContainer}>
        {/* We use 'currentUser' instead of 'userData' now */}
        {currentUser.name ? (
          <>
            <Text style={styles.headerNameText}>{currentUser.name}</Text>
            {/* Accessing nested branch name safely */}
            <Text style={styles.headerBranchText}>
              {currentUser.branch?.name || 'No Branch Assigned'}
            </Text>
          </>
        ) : (
          <Text style={styles.headerTitle}>Welcome</Text>
        )}
      </View>

      {/* Right Content */}
      <View style={styles.rightContainer}>
        <TouchableOpacity onPress={toggleMenu} style={styles.avatarButton}>
          {/* Using the snake_case key 'profile_pic' from your API */}
          {currentUser.profile_pic ? (
            <Image 
              source={{ uri: currentUser.profile_pic }} 
              style={styles.profileImage} 
            />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={40} color={colors.secondary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {menuVisible && (
        <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={closeMenu}>
          <TouchableWithoutFeedback onPress={closeMenu}>
            <View style={styles.modalOverlay}>
              <View style={styles.dropdownMenu}>
                <View style={styles.menuItemHeader}>
                  <Text style={styles.userName}>{currentUser.name || 'User'}</Text>
                  <Text style={styles.userEmail}>{currentUser.email}</Text>
                  {/* Added Role from nested object */}
                  <Text style={styles.userRole}>{currentUser.role?.name}</Text>
                </View>
                
                <View style={styles.divider} />
                
                <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); Alert.alert('Account'); }}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#333" />
                  <Text style={styles.menuText}>Account</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                  <MaterialCommunityIcons name="logout" size={20} color={colors.primary} />
                  <Text style={[styles.menuText, { color: colors.primary }]}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45, 
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 3,
  },
  leftContainer: { flex: 1, justifyContent: 'center' },
  headerNameText: { fontSize: 18, fontWeight: 'bold', color: colors.secondary },
  headerBranchText: { fontSize: 12, color: '#666', marginTop: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.secondary },
  rightContainer: { flexDirection: 'row', alignItems: 'center' },
  avatarButton: { padding: 2 },
  profileImage: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  dropdownMenu: { marginTop: 80, marginRight: 20, backgroundColor: '#fff', borderRadius: 8, width: 220, paddingVertical: 10, elevation: 5 },
  menuItemHeader: { paddingHorizontal: 15, paddingBottom: 10 },
  userName: { fontWeight: 'bold', fontSize: 16, color: '#000' },
  userEmail: { fontSize: 12, color: '#666' },
  userRole: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 2 }, 
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15 },
  menuText: { marginLeft: 10, fontSize: 16, color: '#333' },
});

export default Header;