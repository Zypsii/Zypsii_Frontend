import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../utils';

const EmptySplitList = ({ onCreatePress }) => {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No splits created yet</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={onCreatePress}
      >
        <Text style={styles.createButtonText}>Create New Split</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.fontThirdColor,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: colors.Zypsii_color,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmptySplitList; 