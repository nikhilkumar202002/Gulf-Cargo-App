import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Modal, 
  TouchableWithoutFeedback, Image, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import colors from '../styles/colors';

const Header = () => {
  const { userData } = useUser();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  // The API response puts data inside a "user" object.
  // We try to access userData.user first. If that doesn't exist, we fallback to userData.
  const currentUser = userData?.user || userData || {};

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
        {currentUser.name ? (
          <>
            <Text style={styles.headerNameText}>{currentUser.name}</Text>
            <Text style={styles.headerBranchText}>
              {currentUser.branch?.name || 'No Branch Assigned'}
            </Text>
          </>
        ) : (
          <>
             {/* Fallback values matching your design if user data is loading */}
            <Text style={styles.headerNameText}>Gulf Cargo KSA</Text>
            <Text style={styles.headerBranchText}>Gulf Cargo KSA Riyadh</Text>
          </>
        )}
      </View>

      {/* Right Content */}
      <View style={styles.rightContainer}>
        <TouchableOpacity onPress={toggleMenu} style={styles.avatarButton} activeOpacity={0.8}>
          {currentUser.profile_pic ? (
            <Image 
              source={{ uri: currentUser.profile_pic }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.fallbackAvatar}>
              <MaterialCommunityIcons name="account" size={28} color={colors.secondary || '#283891'} />
            </View>
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
    paddingHorizontal: 24, // Slightly increased for a cleaner look
    paddingTop:35, // Adjusted for typical mobile status bar
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // Very subtle bottom border
  },
  leftContainer: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  headerNameText: { 
    fontFamily: 'InstrumentSans-SemiBold', // Make sure this is loaded in your Expo app
    fontSize: 22, 
    fontWeight: '600', 
    color: '#283891', // Dark blue from your design
    letterSpacing: -0.3,
  },
  headerBranchText: { 
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14, 
    color: '#6B7280', // Clean gray
    marginTop: 2,
    fontWeight: '400',
  },
  rightContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  avatarButton: { 
    padding: 2 
  },
  profileImage: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    borderWidth: 2, 
    borderColor: '#ed2624', // Red border matching design
  },
  fallbackAvatar: {
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    borderWidth: 2, 
    borderColor: '#ed2624', // Red border matching design
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.1)', 
    justifyContent: 'flex-start', 
    alignItems: 'flex-end' 
  },
  dropdownMenu: { 
    marginTop: 90, 
    marginRight: 24, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    width: 220, 
    paddingVertical: 10, 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  menuItemHeader: { 
    paddingHorizontal: 16, 
    paddingBottom: 12 
  },
  userName: { 
    fontFamily: 'InstrumentSans-SemiBold',
    fontWeight: '600', 
    fontSize: 16, 
    color: '#111827' 
  },
  userEmail: { 
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 13, 
    color: '#6B7280',
    marginTop: 2
  },
  userRole: { 
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 11, 
    color: colors.primary, 
    fontWeight: '600', 
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }, 
  divider: { 
    height: 1, 
    backgroundColor: '#F3F4F6', 
    marginBottom: 5 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 16 
  },
  menuText: { 
    fontFamily: 'InstrumentSans-Regular',
    marginLeft: 12, 
    fontSize: 15, 
    color: '#374151' 
  },
});

export default Header;