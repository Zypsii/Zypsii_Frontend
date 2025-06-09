import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
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
import { base_url } from '../../utils/base_url';
import {
  addExpense,
  updateExpense,
  fetchSplitMembers,
  fetchSplitBalance,
  addParticipant
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
    balanceError
  } = useSelector((state) => state.split);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(fetchSplitMembers(split._id)),
          dispatch(fetchSplitBalance(split._id))
        ]);
      } catch (error) {
        console.error('Error loading split data:', error);
        Alert.alert('Error', 'Failed to load split details');
      }
    };

    loadData();
  }, [dispatch, split._id]);

  const handleAddExpense = async (expenseData) => {
    try {
      await dispatch(addExpense({ splitId: split._id, expenseData })).unwrap();
      setShowAddExpenseModal(false);
      Alert.alert('Success', 'Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', error.message || 'Failed to add expense');
    }
  };

  const handleUpdateExpense = async (expenseId, expenseData) => {
    try {
      await dispatch(updateExpense({ splitId: split._id, expenseId, newAmount: expenseData.amount })).unwrap();
      Alert.alert('Success', 'Expense updated successfully');
    } catch (error) {
      console.error('Error updating expense:', error);
      Alert.alert('Error', error.message || 'Failed to update expense');
    }
  };

  const handleInviteFriend = async (email) => {
    try {
      // First search for the user by email
      const token = await AsyncStorage.getItem('accessToken');
      const searchResponse = await axios.get(
        `${base_url}/user/getProfile?search=${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!searchResponse.data.success || !searchResponse.data.data || searchResponse.data.data.length === 0) {
        throw new Error('User not found with this email');
      }

      const user = searchResponse.data.data[0];
      console.log(user);
      console.log(split._id);
      await dispatch(addParticipant({ splitId: split._id, memberIds: [user._id] })).unwrap();
      setShowInviteModal(false);
      Alert.alert('Success', 'Member added successfully');
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Error', error.message || 'Failed to add member');
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

  const renderBalanceTab = () => (
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
        <View style={styles.balanceFooter}>
          <Text style={styles.balanceSubtext}>
            Split between {members.length || 0} members
          </Text>
        </View>
      </View>

      {/* Individual Balances */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Individual Balances</Text>
        {members && members.length > 0 ? (
          members.map((member, index) => {
            const memberBalance = member.balance || 0;
            const isPositive = memberBalance > 0;
            const isZero = memberBalance === 0;
            
            return (
              <View key={member._id} style={styles.balanceItem}>
                <View style={styles.balanceItemLeft}>
                  <View style={[
                    styles.balanceAvatar,
                    { backgroundColor: isPositive ? '#e8f5e8' : isZero ? '#f5f5f5' : '#ffe8e8' }
                  ]}>
                    <Text style={[
                      styles.balanceAvatarText,
                      { color: isPositive ? '#2e7d32' : isZero ? '#757575' : '#d32f2f' }
                    ]}>
                      {member.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.balanceName}>{member.name}</Text>
                    <Text style={[
                      styles.balanceStatus,
                      { color: isPositive ? '#2e7d32' : isZero ? '#757575' : '#d32f2f' }
                    ]}>
                      {isPositive ? 'Gets back' : isZero ? 'Settled' : 'Owes'}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.balanceAmountText,
                  { color: isPositive ? '#2e7d32' : isZero ? '#757575' : '#d32f2f' }
                ]}>
                  ₹{Math.abs(memberBalance).toFixed(2)}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyStateCard}>
            <Ionicons name="people-outline" size={48} color={colors.grayLinesColor} />
            <Text style={styles.emptyStateTitle}>No members found</Text>
            <Text style={styles.emptyStateText}>Add members to see balance details</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

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
        
        {split.expense && split.expense.length > 0 ? (
          split.expense.map((expense, index) => (
            <View key={expense._id} style={styles.expenseCard}>
              <View style={styles.expenseHeader}>
                <View style={styles.expenseIconContainer}>
                  <Ionicons name="receipt" size={20} color={colors.btncolor} />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>{expense.title}</Text>
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
                    ₹{expense.amount?.toFixed(2) || '0.00'}
                  </Text>
                  <Text style={styles.expensePerPerson}>
                    ₹{((expense.amount || 0) / (members.length || 1)).toFixed(2)} per person
                  </Text>
                </View>
              </View>
              
              {expense.paidBy && (
                <View style={styles.expenseFooter}>
                  <Text style={styles.paidByText}>
                    Paid by <Text style={styles.paidByName}>{expense.paidBy.name || 'Unknown'}</Text>
                  </Text>
                </View>
              )}
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
                  <Text style={styles.memberEmail}>{member.memberId?.email || 'No email'}</Text>
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
        onSubmit={handleAddExpense}
        participants={members?.data}
      />

      <AddParticipantModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteFriend={handleInviteFriend}
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
  memberEmail: {
    fontSize: 14,
    color: colors.fontSecondColor,
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
});

export default SplitDetail;