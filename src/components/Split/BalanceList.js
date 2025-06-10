import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import { formatCurrency } from '../../utils/splitCalculations';

const BalanceList = ({ balances, onMarkAsPaid }) => {
  const [paidBalances, setPaidBalances] = useState({});

  const handleMarkAsPaid = (balanceId) => {
    Alert.alert(
      'Mark as Paid',
      'Are you sure you want to mark this balance as paid?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark as Paid',
          onPress: () => {
            setPaidBalances(prev => ({ ...prev, [balanceId]: true }));
            if (onMarkAsPaid) {
              onMarkAsPaid(balanceId);
            }
          },
        },
      ]
    );
  };

  const renderBalanceItem = (balance) => {
    const isPaid = paidBalances[balance.id];
    const statusColor = isPaid ? colors.success : colors.error;
    const isOwedToYou = balance.to.name === 'You'; // Assuming 'You' is the current user

    return (
      <View key={balance.id} style={styles.balanceItem}>
        <View style={styles.balanceHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatarContainer, isOwedToYou && styles.owedToYouContainer]}>
              <Text style={styles.avatarText}>
                {balance.from.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{balance.from.name}</Text>
              <Text style={styles.balanceLabel}>
                {isOwedToYou ? 'owes you' : 'owes'}
              </Text>
            </View>
          </View>
          <View style={styles.userInfo}>
            <View style={[styles.avatarContainer, isOwedToYou && styles.owedToYouContainer]}>
              <Text style={styles.avatarText}>
                {balance.to.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{balance.to.name}</Text>
              <Text style={styles.balanceLabel}>
                {isOwedToYou ? 'you will receive' : 'gets back'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.balanceDetails}>
          <Text style={[styles.amount, { color: statusColor }]}>
            {formatCurrency(balance.amount)}
          </Text>
          {!isPaid && (
            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: colors.Zypsii_color }]}
              onPress={() => handleMarkAsPaid(balance.id)}
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
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {balances.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.fontSecondColor} />
          <Text style={styles.emptyStateText}>All balances are settled!</Text>
        </View>
      ) : (
        balances.map(renderBalanceItem)
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  balanceItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
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
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.fontSecondColor,
  },
  balanceDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.grayLinesColor,
    paddingTop: 16,
    alignItems: 'center',
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  payButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  paidStatus: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  paidStatusText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    marginTop: 16,
  },
  owedToYouContainer: {
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.Zypsii_color,
  },
});

export default BalanceList; 