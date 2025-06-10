import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';

const ExpenseItem = ({ 
  item, 
  editingExpenseId, 
  editedAmount, 
  isUpdatingExpense,
  onEditPress,
  onUpdateExpense,
  onCancelEdit 
}) => {
  // Format date properly
  const expenseDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : 'No date';

  // Defensive checks for amount and description
  const safeAmount = (item.expenseTotalAmount !== undefined && item.expenseTotalAmount !== null && !isNaN(Number(item.expenseTotalAmount))) 
    ? parseFloat(item.expenseTotalAmount).toFixed(2) 
    : '0.00';
  const safeDescription = item.description && item.description.trim() ? item.description : 'No description';

  // Calculate paid and unpaid members
  const paidMembers = item.membersInExpense?.filter(member => member.paid) || [];
  const unpaidMembers = item.membersInExpense?.filter(member => !member.paid) || [];

  return (
    <View style={styles.expenseItem}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseMainInfo}>
          <Text style={styles.expenseDescription} numberOfLines={2}>
            {safeDescription}
          </Text>
          {editingExpenseId === item._id ? (
            <View style={styles.amountEditContainer}>
              <TextInput
                style={styles.amountInput}
                value={editedAmount}
                onChangeText={onEditPress}
                keyboardType="numeric"
                autoFocus
                placeholder="Enter amount"
                placeholderTextColor={colors.fontSecondColor}
              />
              <View style={styles.amountEditButtons}>
                {isUpdatingExpense ? (
                  <ActivityIndicator size="small" color={colors.Zypsii_color} />
                ) : (
                  <React.Fragment key="edit-buttons">
                    <TouchableOpacity
                      style={[styles.amountEditButton, styles.saveButton]}
                      onPress={() => onUpdateExpense(item._id, editedAmount)}
                    >
                      <Ionicons name="checkmark" size={20} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.amountEditButton, styles.cancelButton]}
                      onPress={onCancelEdit}
                    >
                      <Ionicons name="close" size={20} color={colors.white} />
                    </TouchableOpacity>
                  </React.Fragment>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => onEditPress(item._id, item.expenseTotalAmount ? item.expenseTotalAmount.toString() : '')}
            >
              <Text style={styles.expenseAmount}>₹{safeAmount}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.expenseDetails}>
        <View style={styles.expenseDetailRow}>
          <View style={styles.expenseDetailItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.fontSecondColor} />
            <Text style={styles.expenseDetailText}>{expenseDate}</Text>
          </View>
          <View style={styles.expenseDetailItem}>
            <Ionicons name="pricetag-outline" size={16} color={colors.fontSecondColor} />
            <Text style={styles.expenseDetailText}>{item.category || 'Other'}</Text>
          </View>
        </View>

        <View style={styles.paidByContainer}>
          <View style={styles.paidByInfo}>
            <View style={styles.paidByAvatar}>
              <Text style={styles.paidByAvatarText}>
                {item.createdBy?.fullName ? item.createdBy.fullName.charAt(0).toUpperCase() : 
                 item.createdBy?.email ? item.createdBy.email.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.paidByTextContainer}>
              <Text style={styles.paidByLabel}>Created by</Text>
              <Text style={[styles.paidByEmail, { color: colors.Zypsii_color }]} numberOfLines={1}>
                {item.createdBy?.fullName || item.createdBy?.email || 'Unknown user'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.membersContainer}>
          <Text style={styles.membersLabel}>Members ({item.membersInExpense?.length || 0})</Text>
          <View style={styles.membersList}>
            {item.membersInExpense?.map((member, index) => (
              <View key={member._id || index} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.memberId?.fullName ? member.memberId.fullName.charAt(0).toUpperCase() : 
                       member.memberId?.email ? member.memberId.email.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>
                      {member.memberId?.fullName || member.memberId?.email?.split('@')[0] || 'User'}
                    </Text>
                    <Text style={styles.memberAmount}>
                      ₹{member.amountNeedToPay?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.paymentStatus,
                  { backgroundColor: member.paid ? colors.success : colors.error }
                ]}>
                  <Text style={styles.paymentStatusText}>
                    {member.paid ? 'Paid' : 'Unpaid'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  expenseItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
  },
  expenseHeader: {
    marginBottom: 12,
  },
  expenseMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    flex: 1,
    marginRight: 12,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.Zypsii_color,
  },
  expenseDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.grayBackground,
    paddingTop: 12,
    gap: 12,
  },
  expenseDetailRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
  },
  expenseDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expenseDetailText: {
    fontSize: 13,
    color: colors.fontSecondColor,
  },
  paidByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paidByInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paidByAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.Zypsii_color,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paidByAvatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  paidByTextContainer: {
    justifyContent: 'center',
  },
  paidByLabel: {
    fontSize: 12,
    color: colors.fontSecondColor,
    marginBottom: 2,
  },
  paidByEmail: {
    fontSize: 13,
    color: colors.Zypsii_color,
    fontWeight: '500',
  },
  membersContainer: {
    marginTop: 8,
  },
  membersLabel: {
    fontSize: 14,
    color: colors.fontSecondColor,
    marginBottom: 8,
  },
  membersList: {
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.grayBackground,
    padding: 8,
    borderRadius: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.Zypsii_color,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  memberAvatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    color: colors.fontMainColor,
    marginBottom: 2,
  },
  memberAmount: {
    fontSize: 12,
    color: colors.fontSecondColor,
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paymentStatusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  amountEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  amountEditButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.Zypsii_color,
  },
  cancelButton: {
    backgroundColor: colors.error,
  },
  amountInput: {
    width: 80,
    textAlign: 'right',
    fontSize: 16,
    color: colors.fontMainColor,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    borderRadius: 8,
  },
});

export default ExpenseItem; 