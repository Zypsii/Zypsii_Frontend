import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '../../context/ToastContext';
import { base_url } from '../../utils/base_url';
import {
  addExpense,
  updateExpense,
  updatePaymentStatus,
  fetchSplitMembers,
  fetchSplitBalance,
  addParticipant,
  fetchExpenses
} from '../../redux/slices/splitSlice';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import components
import AddParticipantModal from '../../components/Split/AddParticipantModal';
import AddExpenseModal from '../../components/Split/AddExpenseModal';

const { width, height } = Dimensions.get('window');

const TABS = [
  { id: 'balance', label: 'Balance', icon: 'wallet-outline' },
  { id: 'expenses', label: 'Expenses', icon: 'receipt-outline' },
  { id: 'members', label: 'Members', icon: 'people-outline' },
];

function SplitDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { split } = route.params;
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('balance');

  const {
    members = [],
    membersLoading,
    membersError,
    balance,
    balanceLoading,
    balanceError,
    expenses,
    expensesLoading,
    expensesError
  } = useSelector((state) => state.split);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading data for split:', split._id);
        await Promise.all([
          dispatch(fetchSplitMembers(split._id)),
          dispatch(fetchSplitBalance(split._id)),
          dispatch(fetchExpenses(split._id))
        ]);
      } catch (error) {
        console.error('Error loading split data:', error);
        showToast('Failed to load split details', 'error');
      }
    };

    loadData();
  }, [dispatch, split._id]);

  // Add console log to check expenses data
  useEffect(() => {
    console.log('Current expenses data:', expenses);
  }, [expenses]);

  const handleAddExpense = async (expenseData) => {
    try {
      await dispatch(addExpense({ splitId: split._id, expenseData })).unwrap();
      setShowAddExpenseModal(false);
      await dispatch(fetchExpenses(split._id));
      showToast('Expense added successfully', 'success');
    } catch (error) {
      console.error('Error adding expense:', error);
      showToast(error.message || 'Failed to add expense', 'error');
    }
  };

  const handleUpdateExpense = async (expenseId, expenseData) => {
    try {
      await dispatch(updateExpense({ splitId: split._id, expenseId, newAmount: expenseData.amount })).unwrap();
      showToast('Expense updated successfully', 'success');
    } catch (error) {
      console.error('Error updating expense:', error);
      showToast(error.message || 'Failed to update expense', 'error');
    }
  };

  const handleMarkAsPaid = async (expenseId, memberId) => {
    try {
      await dispatch(updatePaymentStatus({ 
        splitId: split._id, 
        expenseId, 
        memberId, 
        paid: true 
      })).unwrap();
      
      // Refresh both balance and expenses data to reflect the changes
      await Promise.all([
        dispatch(fetchSplitBalance(split._id)),
        dispatch(fetchExpenses(split._id))
      ]);
      showToast('Payment marked as paid successfully', 'success');
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      showToast(error.message || 'Failed to mark payment as paid', 'error');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'balance':
        return renderBalanceTab();
      case 'expenses':
        return renderExpensesTab();
      case 'members':
        return renderMembersTab();
      default:
        return renderBalanceTab();
    }
  };

  const renderBalanceTab = () => {
    // Calculate total dues per member
    const memberDues = {};
    
    // Add null checks to prevent forEach errors
    if (balance?.data && Array.isArray(balance.data)) {
      balance.data.forEach(expense => {
        if (expense && expense.memberDetails && Array.isArray(expense.memberDetails)) {
          expense.memberDetails.forEach(member => {
            if (member && member.memberId) {
              if (!memberDues[member.memberId]) {
                memberDues[member.memberId] = {
                  fullName: member.fullName || 'Unknown',
                  email: member.email || '',
                  totalDue: 0,
                  totalToReceive: 0
                };
              }
              
              // Handle different balance scenarios
              if (member.status === 'owes') {
                memberDues[member.memberId].totalDue += member.amountToPay || 0;
              } else if (member.status === 'owed') {
                memberDues[member.memberId].totalToReceive += member.amountToReceive || 0;
              }
            }
          });
        }
      });
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Total Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet" size={24} color={colors.btncolor} />
            <Text style={styles.balanceLabel}>Total Split Amount</Text>
          </View>
          <Text style={styles.balanceAmount}>
            ₹{split.totalSplitAmount?.toFixed(2) || '0.00'}
          </Text>
          {/* <View style={styles.balanceFooter}>
            <Text style={styles.balanceSubtext}>
              Split between {members.length || 0} members
            </Text>
          </View> */}
        </View>

        {/* Balance Due Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="alert-circle" size={24} color={colors.error} />
            <Text style={styles.balanceLabel}>Total Balance Due</Text>
          </View>
          <Text style={[styles.balanceAmount, { color: colors.error }]}>
            ₹{(() => {
              if (balance?.totalBalanceDueAcrossSplit !== undefined) {
                return balance.totalBalanceDueAcrossSplit.toFixed(2);
              }
              // Calculate from member details if not provided
              let totalDue = 0;
              if (balance?.data && Array.isArray(balance.data)) {
                balance.data.forEach(expense => {
                  if (expense && expense.memberDetails && Array.isArray(expense.memberDetails)) {
                    expense.memberDetails.forEach(member => {
                      if (member && member.status === 'owes') {
                        totalDue += member.amountToPay || 0;
                      }
                    });
                  }
                });
              }
              return totalDue.toFixed(2);
            })()}
          </Text>
          <View style={styles.balanceFooter}>
            <Text style={styles.balanceSubtext}>
              Across {balance?.data?.length || 0} expenses
            </Text>
          </View>
        </View>

        {/* Total Balance Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="calculator" size={20} color={colors.fontMainColor} />
            <Text style={styles.summaryTitle}>Balance Summary</Text>
          </View>
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount:</Text>
              <Text style={styles.summaryValue}>
                ₹{split.totalSplitAmount?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Due:</Text>
              <Text style={[styles.summaryValue, { color: colors.error }]}>
                ₹{(() => {
                  if (balance?.totalBalanceDueAcrossSplit !== undefined) {
                    return balance.totalBalanceDueAcrossSplit.toFixed(2);
                  }
                  let totalDue = 0;
                  if (balance?.data && Array.isArray(balance.data)) {
                    balance.data.forEach(expense => {
                      if (expense && expense.memberDetails && Array.isArray(expense.memberDetails)) {
                        expense.memberDetails.forEach(member => {
                          if (member && member.status === 'owes') {
                            totalDue += member.amountToPay || 0;
                          }
                        });
                      }
                    });
                  }
                  return totalDue.toFixed(2);
                })()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Settled:</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                ₹{(() => {
                  const totalAmount = split.totalSplitAmount || 0;
                  const totalDue = (() => {
                    if (balance?.totalBalanceDueAcrossSplit !== undefined) {
                      return balance.totalBalanceDueAcrossSplit;
                    }
                    let due = 0;
                    if (balance?.data && Array.isArray(balance.data)) {
                      balance.data.forEach(expense => {
                        if (expense && expense.memberDetails && Array.isArray(expense.memberDetails)) {
                          expense.memberDetails.forEach(member => {
                            if (member && member.status === 'owes') {
                              due += member.amountToPay || 0;
                            }
                          });
                        }
                      });
                    }
                    return due;
                  })();
                  return (totalAmount - totalDue).toFixed(2);
                })()}
              </Text>
            </View>
          </View>
        </View>

        {/* Individual Balances - Commented Out */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual Balances</Text>
          {Object.values(memberDues).length > 0 ? (
            Object.values(memberDues).map((member) => {
              const hasDebt = member.totalDue > 0;
              const hasCredit = member.totalToReceive > 0;
              
              return (
                <View key={member.email} style={styles.balanceItem}>
                  <View style={styles.balanceItemLeft}>
                    <View style={[
                      styles.balanceAvatar,
                      { backgroundColor: hasDebt ? '#ffe8e8' : '#e8f5e8' }
                    ]}>
                      <Text style={[
                        styles.balanceAvatarText,
                        { color: hasDebt ? colors.error : colors.success }
                      ]}>
                        {member.fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.balanceName}>{member.fullName}</Text>
                      <Text style={[
                        styles.balanceStatus,
                        { color: hasDebt ? colors.error : colors.success }
                      ]}>
                        {hasDebt ? 'Owes' : hasCredit ? 'Owed' : 'Settled'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.balanceAmounts}>
                    {hasDebt && (
                      <Text style={[
                        styles.balanceAmountText,
                        { color: colors.error }
                      ]}>
                        -₹{member.totalDue.toFixed(2)}
                      </Text>
                    )}
                    {hasCredit && (
                      <Text style={[
                        styles.balanceAmountText,
                        { color: colors.success }
                      ]}>
                        +₹{member.totalToReceive.toFixed(2)}
                      </Text>
                    )}
                    {!hasDebt && !hasCredit && (
                      <Text style={[
                        styles.balanceAmountText,
                        { color: colors.grayLinesColor }
                      ]}>
                        ₹0.00
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyStateCard}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.grayLinesColor} />
              <Text style={styles.emptyStateTitle}>No balances found</Text>
              <Text style={styles.emptyStateText}>All expenses have been settled</Text>
            </View>
          )}
        </View> */}

        {/* Balance Due Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Balance Due Details</Text>
          {balance?.data && balance.data.length > 0 ? (
            balance.data.map((expense) => (
              <View key={expense.expenseId} style={styles.expenseCard}>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseIconContainer}>
                    <Ionicons name="receipt" size={20} color={colors.error} />
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseTitle}>{expense.description}</Text>
                    <Text style={styles.expenseDate}>
                      {expense.category}
                    </Text>
                  </View>
                  <View style={styles.expenseAmountContainer}>
                    <Text style={[styles.expenseAmount, { color: colors.error }]}>
                      ₹{expense.totalExpenseAmount?.toFixed(2)}
                    </Text>
                    <Text style={styles.expensePerPerson}>
                      {expense.memberDetails?.length || 0} members
                    </Text>
                  </View>
                </View>
                
                <View style={styles.expenseFooter}>
                  <View style={styles.membersContainer}>
                    <Text style={styles.membersLabel}>Member Balances</Text>
                    <View style={styles.membersList}>
                      {expense.memberDetails && expense.memberDetails.map((member) => (
                        <View key={member.memberId} style={styles.memberItem}>
                          <View style={styles.memberInfo}>
                            <View style={styles.memberAvatar}>
                              <Text style={styles.memberAvatarText}>
                                {member.fullName?.charAt(0)?.toUpperCase() || 'U'}
                              </Text>
                            </View>
                            <View style={styles.memberDetails}>
                              <Text style={styles.memberName}>{member.fullName}</Text>
                              <Text style={styles.memberAmount}>
                                {member.status === 'owes' ? '-' : member.status === 'owed' ? '+' : ''}₹{Math.abs(member.balanceAmount || 0).toFixed(2)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.memberActions}>
                            <View style={[
                              styles.paymentStatus, 
                              { 
                                backgroundColor: member.status === 'owes' ? colors.error : 
                                                member.status === 'owed' ? colors.success : 
                                                colors.grayLinesColor 
                              }
                            ]}>
                              <Text style={styles.paymentStatusText}>
                                {member.status === 'owes' ? 'Owes' : 
                                 member.status === 'owed' ? 'Owed' : 
                                 'Settled'}
                              </Text>
                            </View>
                            {member.status === 'owes' && (
                              <TouchableOpacity
                                style={[styles.markAsPaidButton, { backgroundColor: colors.btncolor }]}
                                onPress={() => handleMarkAsPaid(expense.expenseId, member.memberId)}
                              >
                                <Text style={styles.markAsPaidButtonText}>Mark as Paid</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  {/* Settlement Suggestions */}
                  {expense.settlementSuggestions && expense.settlementSuggestions.length > 0 && (
                    <View style={styles.settlementContainer}>
                      <Text style={styles.settlementLabel}>Settlement Suggestions</Text>
                      <View style={styles.settlementList}>
                        {expense.settlementSuggestions.map((settlement, index) => (
                          <View key={index} style={styles.settlementItem}>
                            <Text style={styles.settlementText}>
                              {settlement.description}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.grayLinesColor} />
              <Text style={styles.emptyStateTitle}>No balances found</Text>
              <Text style={styles.emptyStateText}>All expenses have been settled</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderExpensesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Expenses</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddExpenseModal(true)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
        
        {expensesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.btncolor} />
            <Text style={styles.loadingText}>Loading expenses...</Text>
          </View>
        ) : expensesError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{expensesError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => dispatch(fetchExpenses(split._id))}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : expenses && expenses.length > 0 ? (
          expenses.map((expense) => (
            <View key={expense._id} style={styles.expenseCard}>
              <View style={styles.expenseHeader}>
                <View style={styles.expenseIconContainer}>
                  <Ionicons name="receipt" size={20} color={colors.btncolor} />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>{expense.description}</Text>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={styles.expenseAmountContainer}>
                  <Text style={styles.expenseAmount}>
                    ₹{expense.expenseTotalAmount?.toFixed(2) || '0.00'}
                  </Text>
                  <Text style={styles.expensePerPerson}>
                    ₹{(expense.expenseTotalAmount / expense.membersInExpense.length).toFixed(2)} per person
                  </Text>
                </View>
              </View>
              
              <View style={styles.expenseFooter}>
                <Text style={styles.paidByText}>
                  Paid by <Text style={styles.paidByName}>{expense.createdBy.fullName}</Text>
                </Text>
                <View style={styles.membersContainer}>
                  <Text style={styles.membersLabel}>Members ({expense.membersInExpense.length})</Text>
                  <View style={styles.membersList}>
                    {expense.membersInExpense.map((member) => (
                      <View key={member._id} style={styles.memberItem}>
                        <View style={styles.memberInfo}>
                          <View style={styles.memberAvatar}>
                            <Text style={styles.memberAvatarText}>
                              {member.memberId.fullName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.memberDetails}>
                            <Text style={styles.memberName}>{member.memberId.fullName}</Text>
                            <Text style={styles.memberAmount}>
                              ₹{member.amountNeedToPay.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.memberActions}>
                          <View style={[
                            styles.paymentStatus,
                            { backgroundColor: member.paid ? colors.success : colors.error }
                          ]}>
                            <Text style={styles.paymentStatusText}>
                              {member.paid ? 'Paid' : 'Unpaid'}
                            </Text>
                          </View>
                          {!member.paid && (
                            <TouchableOpacity
                              style={[styles.markAsPaidButton, { backgroundColor: colors.btncolor }]}
                              onPress={() => handleMarkAsPaid(expense._id, member.memberId._id)}
                            >
                              <Text style={styles.markAsPaidButtonText}>Mark as Paid</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyStateCard}>
            <Ionicons name="receipt-outline" size={48} color={colors.grayLinesColor} />
            <Text style={styles.emptyStateTitle}>No expenses yet</Text>
            <Text style={styles.emptyStateText}>Add your first expense to get started</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowAddExpenseModal(true)}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.emptyStateButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderMembersTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Group Members</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowInviteModal(true)}
          >
            <Ionicons name="person-add" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
        
        {members?.data && members.data.length > 0 ? (
          members.data.map((member, index) => (
            <View key={member._id} style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.memberId?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.memberId?.fullName || 'Unknown User'}</Text>
                </View>
                <View style={styles.memberStatus}>
                  
                  <Text style={styles.statusText}>
                    Joined {new Date(member.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
              
              
            </View>
          ))
        ) : (
          <View style={styles.emptyStateCard}>
            <Ionicons name="people-outline" size={48} color={colors.grayLinesColor} />
            <Text style={styles.emptyStateTitle}>No members yet</Text>
            <Text style={styles.emptyStateText}>Invite friends to join this split</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowInviteModal(true)}
            >
              <Ionicons name="person-add" size={20} color={colors.white} />
              <Text style={styles.emptyStateButtonText}>Add Member</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );

  if (membersLoading || balanceLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={colors.btncolor} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.btncolor} />
            <Text style={styles.loadingText}>Loading split details...</Text>
            <Text style={styles.loadingSubText}>Please wait a moment</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (membersError || balanceError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={colors.btncolor} barStyle="light-content" />
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="cloud-offline-outline" size={64} color={colors.error} />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{membersError || balanceError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                dispatch(fetchSplitMembers(split._id));
                dispatch(fetchSplitBalance(split._id));
              }}
            >
              <Ionicons name="refresh" size={20} color={colors.white} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.btncolor} barStyle="light-content" />
      
      {/* Enhanced Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{split.title}</Text>
          <Text style={styles.headerSubtitle}>
            {members.length} members • {split.expense?.length || 0} expenses
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? colors.btncolor : colors.fontSecondColor}
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.floatingActions}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowAddExpenseModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <AddExpenseModal
        visible={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onAddExpense={handleAddExpense}
        participants={members?.data}
        splitId={split._id}
      />

      <AddParticipantModal
        visible={showInviteModal}
        splitId={split._id}
        onClose={() => setShowInviteModal(false)}
        existingParticipants={members?.data}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.btncolor,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: colors.btncolor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: `${colors.btncolor}15`,
    borderWidth: 1,
    borderColor: `${colors.btncolor}30`,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.fontSecondColor,
    marginLeft: 6,
  },
  activeTabText: {
    color: colors.btncolor,
    fontWeight: '600',
  },

  // Content Styles
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },

  // Balance Tab Styles
  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.fontSecondColor,
    marginLeft: 12,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.fontMainColor,
    marginBottom: 12,
  },
  balanceFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  balanceSubtext: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.fontMainColor,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Balance Item Styles
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  balanceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  balanceAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  balanceAvatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  balanceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  balanceStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  balanceAmountText: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Expense Card Styles
  expenseCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.btncolor}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  expensePerPerson: {
    fontSize: 12,
    color: colors.fontSecondColor,
  },
  expenseFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paidByText: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  paidByName: {
    fontWeight: '600',
    color: colors.fontMainColor,
  },

  // Member Card Styles
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },

  memberStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: colors.fontSecondColor,
    fontWeight: '500',
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.fontSecondColor,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
  },

  // Empty State Styles
  emptyStateCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.fontSecondColor,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.btncolor,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Floating Action Button
  floatingActions: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.btncolor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // Loading & Error Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: colors.white,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: width * 0.8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.fontMainColor,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: colors.btncolor,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    textAlign: 'center',
    padding: 16,
  },
  membersContainer: {
    marginTop: 12,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAsPaidButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  markAsPaidButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  balanceAmounts: {
    alignItems: 'flex-end',
  },
  settlementContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  settlementLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 8,
  },
  settlementList: {
    gap: 8,
  },
  settlementItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.btncolor,
  },
  settlementText: {
    fontSize: 14,
    color: colors.fontMainColor,
    lineHeight: 20,
  },

  // Summary Card Styles
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginLeft: 8,
  },
  summaryContent: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.fontSecondColor,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
  },
});

export default SplitDetail;