import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';

const UserSearchResult = ({ user, isSelected, isAlreadySelected, onToggle }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.searchResultItem,
        isAlreadySelected && styles.searchResultItemDisabled
      ]} 
      onPress={() => onToggle(user)}
      disabled={isAlreadySelected}
    >
      <View style={styles.userInfoContainer}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.fullName || user.email}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </View>
      <View style={styles.checkboxContainer}>
        {isAlreadySelected ? (
          <View style={styles.alreadySelectedBadge}>
            <Text style={styles.alreadySelectedText}>Added</Text>
          </View>
        ) : (
          <View style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected
          ]}>
            {isSelected && (
              <Ionicons name="checkmark" size={16} color={colors.white} />
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  searchResultItemDisabled: {
    opacity: 0.7,
    backgroundColor: colors.grayBackground,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.Zypsii_color,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.fontMainColor,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  checkboxContainer: {
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.grayLinesColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.Zypsii_color,
    borderColor: colors.Zypsii_color,
  },
  alreadySelectedBadge: {
    backgroundColor: colors.grayBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alreadySelectedText: {
    color: colors.fontSecondColor,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default UserSearchResult; 