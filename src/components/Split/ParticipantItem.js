import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils';
import { formatCurrency } from '../../utils/splitCalculations';

const ParticipantItem = ({ item, balance }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'getBack':
        return colors.success;
      case 'owe':
        return colors.error;
      default:
        return colors.fontMainColor;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {item.user.fullName ? item.user.fullName[0].toUpperCase() : item.user.email[0].toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.name}>
          {item.user.fullName || item.user.email}
        </Text>
        <Text style={styles.email}>{item.user.email}</Text>
      </View>

      {balance && balance.status !== 'settled' && (
        <View style={styles.balanceContainer}>
          <Text style={[styles.balance, { color: getStatusColor(balance.status) }]}>
            {balance.status === 'getBack' ? '+' : '-'}
            {formatCurrency(Math.abs(balance.balance))}
          </Text>
          <Text style={[styles.status, { color: getStatusColor(balance.status) }]}>
            {balance.status === 'getBack' ? 'Gets Back' : 'Owes'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.fontSecondary,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ParticipantItem; 