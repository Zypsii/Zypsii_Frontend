import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';

const SelectedUserItem = ({ user, isCreator, onRemove }) => {
  return (
    <View style={styles.selectedUserItem}>
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
      {!isCreator && (
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => onRemove(user._id)}
        >
          <Ionicons name="close-circle" size={24} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  selectedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.grayBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
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
  removeButton: {
    padding: 4,
  },
});

export default SelectedUserItem; 