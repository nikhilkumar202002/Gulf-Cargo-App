import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, Image } from 'react-native'; // Import Image
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../styles/colors';

// Added 'profilePic' to props
const Header = ({ userName, branchName, profilePic, user, onLogout, onAccountPress }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => { setMenuVisible(!menuVisible); };
  const closeMenu = () => { setMenuVisible(false); };

  const handleLogout = () => {
    closeMenu();
    onLogout();
  };

  const handleAccount = () => {
    closeMenu();
    if (onAccountPress) onAccountPress();
  };

  return (
    <View style={styles.headerContainer}>
      {/* Left Content */}
      <View style={styles.leftContainer}>
        {userName ? (
          <>
            <Text style={styles.headerNameText}>{userName}</Text>
            <Text style={styles.headerBranchText}>{branchName || 'Loading...'}</Text>
          </>
        ) : (
          <Text style={styles.headerTitle}>Loading...</Text>
        )}
      </View>

      {/* Right Content: Avatar or Image */}
      <View style={styles.rightContainer}>
        <TouchableOpacity onPress={toggleMenu} style={styles.avatarButton}>
          {profilePic ? (
             // Show Image if available
            <Image 
              source={{ uri: profilePic }} 
              style={styles.profileImage} 
            />
          ) : (
            // Show Icon if no image
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
                  <Text style={styles.userName}>{userName || 'User'}</Text>
                  <Text style={styles.userEmail}>{user?.email || ''}</Text>
                </View>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.menuItem} onPress={handleAccount}>
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
  // ... existing styles ...
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  leftContainer: { flex: 1, justifyContent: 'center' },
  headerNameText: { fontSize: 18, fontWeight: 'bold', color: colors.secondary },
  headerBranchText: { fontSize: 12, color: '#666', marginTop: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.secondary },
  rightContainer: { flexDirection: 'row', alignItems: 'center' },
  avatarButton: { padding: 2 },
  
  // NEW STYLE FOR IMAGE
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20, // Makes it a perfect circle
    borderWidth: 1,
    borderColor: '#ddd'
  },

  // Dropdown styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  dropdownMenu: { marginTop: 60, marginRight: 20, backgroundColor: '#fff', borderRadius: 8, width: 220, paddingVertical: 10, elevation: 5 },
  menuItemHeader: { paddingHorizontal: 15, paddingBottom: 10 },
  userName: { fontWeight: 'bold', fontSize: 16, color: '#000' },
  userEmail: { fontSize: 12, color: '#666' },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15 },
  menuText: { marginLeft: 10, fontSize: 16, color: '#333' },
});

export default Header;