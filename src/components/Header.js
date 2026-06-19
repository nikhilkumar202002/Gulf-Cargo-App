import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Modal, 
  Pressable, Image, Alert 
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
        <View style={styles.brandMark}>
          <MaterialCommunityIcons name="truck-fast-outline" size={20} color="#fff" />
        </View>
        {currentUser.name ? (
          <View style={styles.identityBlock}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.headerNameText}>{currentUser.name}</Text>
            {/* <View style={styles.branchPill}>
              <MaterialCommunityIcons name="office-building-marker-outline" size={12} color={colors.secondary} />
              <Text style={styles.headerBranchText} numberOfLines={1}>
                {currentUser.branch?.name || 'No Branch Assigned'}
              </Text>
            </View> */}
          </View>
        ) : (
          <View style={styles.identityBlock}>
            <Text style={styles.welcomeText}>Welcome</Text>
            {/* Fallback values matching your design if user data is loading */}
            <Text style={styles.headerNameText}>Gulf Cargo KSA</Text>
            <View style={styles.branchPill}>
              <MaterialCommunityIcons name="office-building-marker-outline" size={12} color={colors.secondary} />
              <Text style={styles.headerBranchText} numberOfLines={1}>Gulf Cargo KSA Riyadh</Text>
            </View>
          </View>
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
              <MaterialCommunityIcons name="account" size={23} color={colors.secondary || '#283891'} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {menuVisible && (
        <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={closeMenu}>
          <Pressable style={{ flex: 1 }} onPress={closeMenu}>
            <View style={styles.modalOverlay}>
              <Pressable onPress={e => e.stopPropagation()}>
              <View style={styles.dropdownMenu}>
                <View style={styles.menuItemHeader}>
                  <View style={styles.menuAvatar}>
                    <MaterialCommunityIcons name="account" size={20} color={colors.secondary} />
                  </View>
                  <View style={styles.menuIdentity}>
                  <Text style={styles.userName}>{currentUser.name || 'User'}</Text>
                  <Text style={styles.userEmail}>{currentUser.email}</Text>
                  <Text style={styles.userRole}>{currentUser.role?.name}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                  <MaterialCommunityIcons name="logout" size={20} color={colors.primary} />
                  <Text style={[styles.menuText, { color: colors.primary }]}>Logout</Text>
                </TouchableOpacity>
              </View>
              </Pressable>
            </View>
          </Pressable>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // Very subtle bottom border
  },
  leftContainer: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  identityBlock: {
    flex: 1,
  },
  welcomeText: {
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 1,
  },
  headerNameText: { 
    fontFamily: 'InstrumentSans-SemiBold', // Make sure this is loaded in your Expo app
    fontSize: 17, 
    fontWeight: '700', 
    color: '#111827',
  },
  branchPill: {
    alignSelf: 'flex-start',
    maxWidth: '96%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 4,
  },
  headerBranchText: { 
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 11, 
    color: colors.secondary,
    marginLeft: 4,
    fontWeight: '700',
  },
  rightContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  avatarButton: { 
    padding: 2,
    borderRadius: 22,
  },
  profileImage: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    borderWidth: 2,
    borderColor: '#ed2624', // Red border matching design
  },
  fallbackAvatar: {
    width: 42, 
    height: 42, 
    borderRadius: 21, 
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
    marginTop: 72, 
    marginRight: 16, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    width: 240, 
    paddingVertical: 8, 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  menuItemHeader: { 
    flexDirection: 'row',
    paddingHorizontal: 14, 
    paddingVertical: 10,
    alignItems: 'center',
  },
  menuAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuIdentity: {
    flex: 1,
  },
  userName: { 
    fontFamily: 'InstrumentSans-SemiBold',
    fontWeight: '700', 
    fontSize: 14, 
    color: '#111827' 
  },
  userEmail: { 
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 11, 
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
    marginBottom: 4 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 11, 
    paddingHorizontal: 14 
  },
  menuText: { 
    fontFamily: 'InstrumentSans-Regular',
    marginLeft: 10, 
    fontSize: 14, 
    color: '#374151' 
  },
});

export default Header;
