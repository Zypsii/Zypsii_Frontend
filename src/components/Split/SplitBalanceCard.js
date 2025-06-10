import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../utils';
import { formatCurrency } from '../../utils/splitCalculations';

const SplitBalanceCard = ({ balance, onMarkAsPaid, isPaid }) => {
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
      <View style={styles.header}>
        <Text style={styles.name}>{balance.name}</Text>
        <Text style={[styles.status, { color: getStatusColor(balance.status) }]}>
          {balance.status === 'getBack' ? 'Gets Back' : balance.status === 'owe' ? 'Owes' : 'Settled'}
        </Text>
      </View>
      
      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>Paid:</Text>
          <Text style={styles.value}>{formatCurrency(balance.paid)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Share:</Text>
          <Text style={styles.value}>{formatCurrency(balance.share)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Balance:</Text>
          <Text style={[styles.value, { color: getStatusColor(balance.status) }]}>
            {formatCurrency(Math.abs(balance.balance))}
          </Text>
        </View>
      </View>

      {balance.status === 'owe' && !isPaid && (
        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: colors.btncolor }]}
          onPress={() => onMarkAsPaid(balance.userId)}
        >
          <Text style={styles.payButtonText}>Mark as Paid</Text>
        </TouchableOpacity>
      )}

      {isPaid && (
        <View style={[styles.paidStatus, { backgroundColor: colors.success }]}>
          <Text style={styles.paidStatusText}>Payment Completed</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.fontSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.fontMainColor,
  },
  payButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  payButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  paidStatus: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  paidStatusText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SplitBalanceCard; 