import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';

const SplitCard = ({ item, onPress }) => {
  // Calculate total participants count
  const participantsCount = item.participants ? item.participants.length : 0;
  
  // Get total amount, defaulting to 0 if not present
  const totalAmount = item.totalAmount || item.totalSplitAmount || 0;

  return (
    <TouchableOpacity
      style={styles.splitCard}
      onPress={onPress}
    >
      <View style={styles.splitHeader}>
        <Text style={styles.splitTitle}>{item.title}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'active' ? colors.greenColor : colors.grayLinesColor }
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'active' ? 'Active' : 'Settled'}
          </Text>
        </View>
      </View>
      
      <View style={styles.splitDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={16} color={colors.fontThirdColor} />
          <Text style={styles.detailText}>{participantsCount} people</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={16} color={colors.fontThirdColor} />
          <Text style={styles.detailText}>₹{totalAmount}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.fontThirdColor} />
          <Text style={styles.detailText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  splitCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  splitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.fontMainColor,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  splitDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    color: colors.fontThirdColor,
    fontSize: 14,
  },
});

export default SplitCard; 