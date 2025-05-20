import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';

// AddParticipantModal Component
const AddParticipantModal = ({ visible, onClose, onAddParticipant, existingParticipants }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${base_url}/user/getProfile?search=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Format the data to match our UI needs
        const formattedResults = data.data.map(user => ({
          _id: user._id,
          name: user.fullName,
          email: user.email,
          profileImage: user.profileImage || 'https://via.placeholder.com/50',
          userName: user.userName
        }));

        // Filter out users who are already participants
        const filteredResults = formattedResults.filter(user => 
          !existingParticipants.some(p => p.user._id === user._id)
        );
        
        setSearchResults(filteredResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);



  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItemContainer}
      onPress={() => onAddParticipant(item)}
    >
      <View style={styles.userInfoWrapper}>
        <View style={styles.userAvatarContainer}>
          <Text style={styles.userAvatarText}>
            {item.name ? item.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.userDetailsContainer}>
          <Text style={styles.userNameText}>{item.name || 'Unknown User'}</Text>
          <Text style={styles.userEmailText}>{item.email}</Text>
        </View>
      </View>
      <View style={styles.addIconContainer}>
        <Ionicons name="add-circle-outline" size={24} color={colors.Zypsii_color} />
      </View>
    </TouchableOpacity>
  );

  
 


  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderWithSearch}>
              <View style={styles.modalHeaderTop}>
                <Text style={styles.modalTitle}>Add Participant</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.fontMainColor} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchWrapper}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={20} color={colors.fontSecondColor} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInputField}
                    placeholder="Search users..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={colors.fontSecondColor}
                    autoFocus={true}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity 
                      onPress={() => setSearchQuery('')}
                      style={styles.clearSearchButton}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.fontSecondColor} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.Zypsii_color} />
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderUserItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.searchResultsContainer}
                ListEmptyComponent={
                  <View style={styles.emptyResultsContainer}>
                    <Text style={styles.emptyResultsText}>
                      {searchQuery ? 'No users found' : 'Start typing to search users'}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// Add this component at the top of the file, before AddExpenseModal
const SelectPayerModal = ({ visible, onClose, participants, selectedPayer, onSelectPayer }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.fontMainColor} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Who paid?</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <ScrollView style={styles.modalBody}>
            {participants.map((participant) => (
              <TouchableOpacity
                key={participant.user?._id}
                style={styles.payerSelectItem}
                onPress={() => onSelectPayer(participant.user?._id)}
              >
                <View style={styles.payerInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {participant.user?.name ? participant.user.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <Text style={styles.payerName}>
                    {participant.user?.name || 'Unknown User'}
                  </Text>
                </View>
                <View style={[
                  styles.checkbox,
                  selectedPayer === participant.user?._id && styles.checkboxSelected
                ]}>
                  {selectedPayer === participant.user?._id && (
                    <Ionicons name="checkmark" size={18} color={colors.white} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const AddExpenseModal = ({ visible, onClose, onAddExpense, participants }) => {
  const [step, setStep] = useState(1);
  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitAmounts, setSplitAmounts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isPayerModalVisible, setIsPayerModalVisible] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState(
    participants.reduce((acc, p) => ({ ...acc, [p.user?._id]: true }), {})
  );

  const categories = [
    'Food & Dining',
    'Transportation',
    'Accommodation',
    'Entertainment',
    'Shopping',
    'Other'
  ];

  useEffect(() => {
    if (participants && totalAmount) {
      const selectedIds = Object.entries(selectedParticipants)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);
      const selectedCount = selectedIds.length;
      if (selectedCount > 0) {
        const total = Math.floor(parseFloat(totalAmount));
        const baseShare = Math.floor(total / selectedCount);
        let remainder = total - (baseShare * selectedCount);

        const newSplitAmounts = {};
        participants.forEach((participant, idx) => {
          if (selectedParticipants[participant.user?._id]) {
            // Distribute the remainder to the first 'remainder' users
            let share = baseShare;
            if (remainder > 0) {
              share += 1;
              remainder -= 1;
            }
            newSplitAmounts[participant.user?._id] = {
              value: share.toString(),
              isManuallyEdited: false
            };
          } else {
            newSplitAmounts[participant.user?._id] = {
              value: '0',
              isManuallyEdited: false
            };
          }
        });
        setSplitAmounts(newSplitAmounts);
      }
    }
  }, [participants, totalAmount, selectedParticipants]);

  const resetForm = () => {
    setStep(1);
    setTotalAmount('');
    setDescription('');
    setCategory('');
    setPaidBy('');
    setSplitAmounts({});
    setIsSubmitting(false);
    setErrors({});
  };

  const handleNext = () => {
    if (step === 1) {
      if (!description.trim()) {
        setErrors(prev => ({ ...prev, description: 'Please enter a description' }));
        return;
      }
      if (!category) {
        setErrors(prev => ({ ...prev, category: 'Please select a category' }));
        return;
      }
      setErrors({});
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      handleClose();
    }
  };

  const handleSplitEqually = () => {
    if (!totalAmount || isNaN(parseFloat(totalAmount))) return;

    const selectedCount = Object.values(selectedParticipants).filter(Boolean).length;
    if (selectedCount > 0) {
      const totalAmountNum = Math.floor(parseFloat(totalAmount));
      const baseShare = Math.floor(totalAmountNum / selectedCount);
      const remainder = totalAmountNum - (baseShare * selectedCount);
      
      const newSplitAmounts = {};
      let remainingAmount = remainder;

      Object.entries(selectedParticipants).forEach(([userId, isSelected], index) => {
        if (isSelected) {
          // Add 1 to the base share for the first 'remainder' number of participants
          let share = baseShare;
          if (remainingAmount > 0) {
            share += 1;
            remainingAmount -= 1;
          }
          newSplitAmounts[userId] = {
            value: share.toString(),
            isManuallyEdited: false
          };
        } else {
          newSplitAmounts[userId] = {
            value: '0',
            isManuallyEdited: false
          };
        }
      });

      setSplitAmounts(newSplitAmounts);
    }
  };

  const handleAmountChange = (value) => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanedValue.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setTotalAmount(cleanedValue);
    setErrors(prev => ({ ...prev, amount: validateAmount(cleanedValue) }));
  };

  const validateAmount = (value) => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue) || numValue <= 0) {
      return 'Please enter a valid amount';
    }
    return null;
  };

  const handleSubmit = async () => {
    try {
      if (!paidBy) {
        setErrors(prev => ({ ...prev, paidBy: 'Please select who paid' }));
        return;
      }

      if (!totalAmount || isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
        setErrors(prev => ({ ...prev, amount: 'Please enter a valid amount' }));
        return;
      }

      setIsSubmitting(true);
      
      const expenseData = {
        description: description.trim(),
        amount: parseFloat(totalAmount),
        category,
        paidBy: paidBy,
        splitAmounts: splitAmounts,
        date: new Date().toISOString()
      };

      await onAddExpense(expenseData);
      handleClose();
    } catch (error) {
      console.error('Error submitting expense:', error);
      Alert.alert('Error', error.message || 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSplitAmountChange = (userId, value) => {
    // Clean the input value to only allow numbers and decimal point
    const newAmount = value.replace(/[^0-9.]/g, '');
    const newAmountNum = parseFloat(newAmount || '0');
    const totalAmountNum = parseFloat(totalAmount);

    // Validate the input amount
    if (newAmountNum > totalAmountNum) {
      Alert.alert('Invalid Amount', 'Amount cannot be greater than total expense');
      return;
    }

    // Get other selected participants (excluding the current one and any manually edited users)
    const otherSelectedParticipants = Object.entries(selectedParticipants)
      .filter(([id, isSelected]) => {
        // Only include users who are selected AND haven't been manually edited
        return isSelected && id !== userId && !splitAmounts[id]?.isManuallyEdited;
      })
      .map(([id]) => id);

    const newSplitAmounts = { ...splitAmounts };

    // Mark this user's amount as manually edited
    newSplitAmounts[userId] = {
      value: newAmount,
      isManuallyEdited: true
    };

    // Calculate sum of all manually edited amounts
    const manuallyEditedTotal = Object.entries(newSplitAmounts)
      .filter(([id, amount]) => amount?.isManuallyEdited)
      .reduce((sum, [_, amount]) => sum + parseFloat(amount.value || 0), 0);

    const remainingAmount = totalAmountNum - manuallyEditedTotal;

    if (manuallyEditedTotal >= totalAmountNum) {
      // If manually entered amounts exceed or equal total, set all others to 0
      otherSelectedParticipants.forEach(participantId => {
        newSplitAmounts[participantId] = {
          value: '0',
          isManuallyEdited: false
        };
      });
    } else {
      // Split remaining amount equally among other participants (excluding manually edited users)
      if (otherSelectedParticipants.length > 0) {
        const sharePerParticipant = Math.max(0, (remainingAmount / otherSelectedParticipants.length).toFixed(2));
        let totalDistributed = 0;
        otherSelectedParticipants.forEach((participantId, index) => {
          if (index === otherSelectedParticipants.length - 1) {
            // Last participant gets the remaining amount to ensure total matches
            const lastAmount = Math.max(0, (remainingAmount - totalDistributed).toFixed(2));
            newSplitAmounts[participantId] = {
              value: lastAmount,
              isManuallyEdited: false
            };
          } else {
            newSplitAmounts[participantId] = {
              value: sharePerParticipant,
              isManuallyEdited: false
            };
            totalDistributed += parseFloat(sharePerParticipant);
          }
        });
      }
    }

    // Update the state with new split amounts
    setSplitAmounts(newSplitAmounts);
  };

  const handleSelectPayer = (userId) => {
    setPaidBy(userId);
    setIsPayerModalVisible(false);
    setErrors(prev => ({ ...prev, paidBy: null }));
  };

  const handleParticipantToggle = (userId) => {
    setSelectedParticipants(prev => {
      const newSelected = { ...prev, [userId]: !prev[userId] };
      // Recalculate splits after selection change
      if (totalAmount) {
        const selectedIds = Object.entries(newSelected)
          .filter(([_, isSelected]) => isSelected)
          .map(([id]) => id);
        const selectedCount = selectedIds.length;
        if (selectedCount > 0) {
          const equalShare = (parseFloat(totalAmount) / selectedCount).toFixed(2);
          const newSplitAmounts = {};
          participants.forEach(participant => {
            if (newSelected[participant.user?._id]) {
              newSplitAmounts[participant.user?._id] = {
                value: equalShare,
                isManuallyEdited: false
              };
            } else {
              newSplitAmounts[participant.user?._id] = {
                value: '0',
                isManuallyEdited: false
              };
            }
          });
          setSplitAmounts(newSplitAmounts);
        }
      }
      return newSelected;
    });
  };

  const renderStep1 = () => (
    <View style={styles.step1Container}>
      <ScrollView style={styles.modalBody}>
        <TextInput
          style={styles.descriptionInput}
          placeholder="What is this expense for?"
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            setErrors(prev => ({ ...prev, description: null }));
          }}
          placeholderTextColor={colors.fontSecondColor}
        />
        {errors.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}

        <View style={styles.categoryContainer}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonActive
                ]}
                onPress={() => {
                  setCategory(cat);
                  setErrors(prev => ({ ...prev, category: null }));
                }}
              >
                <Text style={[
                  styles.categoryButtonText,
                  category === cat && styles.categoryButtonTextActive
                ]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.step2Container}>
      <ScrollView style={styles.modalBody}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>₹</Text>
          <TextInput
            style={styles.amountInput}
            value={totalAmount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.fontSecondColor}
          />
        </View>
        {errors.amount && (
          <Text style={styles.errorText}>{errors.amount}</Text>
        )}

        <TouchableOpacity
          style={styles.paidByButton}
          onPress={() => setIsPayerModalVisible(true)}
        >
          <View style={styles.paidByContent}>
            <View style={styles.paidByLeft}>
              <Text style={styles.paidByLabel}>Paid by</Text>
              <Text style={[styles.paidByName, { color: colors.fontMainColor }]}>
                {paidBy ? participants.find(p => p.user?._id === paidBy)?.user?.name : 'Select payer'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.fontMainColor} />
          </View>
        </TouchableOpacity>
        {errors.paidBy && (
          <Text style={styles.errorText}>{errors.paidBy}</Text>
        )}

        <View style={styles.splitListContainer}>
          <View style={styles.splitListHeader}>
            <Text style={styles.splitListTitle}>
              {`${Object.values(selectedParticipants).filter(Boolean).length} Selected`}
            </Text>
            <TouchableOpacity onPress={handleSplitEqually} style={styles.splitEquallyButton}>
              <Ionicons name="refresh" size={20} color={colors.Zypsii_color} />
              <Text style={styles.splitEquallyText}>Split Equally</Text>
            </TouchableOpacity>
          </View>

          {participants.map((participant) => (
            <View key={participant.user?._id || Math.random()} style={styles.splitListItem}>
              <TouchableOpacity 
                style={styles.participantCheckbox}
                onPress={() => handleParticipantToggle(participant.user?._id)}
              >
                <View style={[
                  styles.checkbox,
                  selectedParticipants[participant.user?._id] && styles.checkboxSelected
                ]}>
                  {selectedParticipants[participant.user?._id] && (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  )}
                </View>
                <View style={styles.participantInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {participant.user?.name ? participant.user.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <Text style={styles.participantName}>{participant.user?.name || 'Unknown User'}</Text>
                </View>
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.splitAmountInput,
                  !selectedParticipants[participant.user?._id] && styles.splitAmountInputDisabled
                ]}
                value={splitAmounts[participant.user?._id]?.value?.toString() || ''}
                onChangeText={(value) => handleSplitAmountChange(participant.user?._id, value)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.fontSecondColor}
                editable={selectedParticipants[participant.user?._id]}
              />
            </View>
          ))}
        </View>

        <SelectPayerModal
          visible={isPayerModalVisible}
          onClose={() => setIsPayerModalVisible(false)}
          participants={participants}
          selectedPayer={paidBy}
          onSelectPayer={handleSelectPayer}
        />
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit</Text>
              <Ionicons name="checkmark" size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
              <Ionicons name={step === 1 ? "close" : "arrow-back"} size={24} color={colors.fontMainColor} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {step === 1 ? 'Add Expense Details' : 'Split Amount'}
            </Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {step === 1 ? renderStep1() : renderStep2()}
        </View>
      </View>
    </Modal>
  );
};

function SplitDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { splitId } = route.params;

  // State for tabs
  const [activeTab, setActiveTab] = useState('participants');
  const [split, setSplit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddParticipantModalVisible, setIsAddParticipantModalVisible] = useState(false);
  const [isAddExpenseModalVisible, setIsAddExpenseModalVisible] = useState(false);

  // State for expense editing
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editedAmount, setEditedAmount] = useState('');
  const [isUpdatingExpense, setIsUpdatingExpense] = useState(false);

  // State for invite modal
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  useEffect(() => {
    fetchSplitDetails();
  }, [splitId]);

  const fetchSplitDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(`${base_url}/api/splits/${splitId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSplit(response.data);
      console.log(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching split details:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch split details');
      setLoading(false);
    }
  };

  const handleUpdateExpense = async (expenseId, newAmount) => {
    try {
      if (!newAmount || isNaN(parseFloat(newAmount)) || parseFloat(newAmount) <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      setIsUpdatingExpense(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.put(
        `${base_url}/api/splits/${splitId}/expenses/${expenseId}`,
        {
          newAmount: parseFloat(newAmount)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setSplit(response.data);
        setEditingExpenseId(null);
        setEditedAmount('');
        Alert.alert('Success', 'Expense amount updated successfully');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update expense');
    } finally {
      setIsUpdatingExpense(false);
    }
  };

  const renderExpenseItem = ({ item }) => {
    // If paidBy is an object, use it. If it's an ID, find the user in participants.
    let paidByUser = item.paidBy;
    if (typeof paidByUser === 'string' && split && split.participants) {
      const found = split.participants.find(p => p.user?._id === paidByUser);
      paidByUser = found ? found.user : null;
    }
    
    // Format date properly
    const expenseDate = item.date ? new Date(item.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : 'No date';

    // Defensive checks for amount and description
    const safeAmount = (item.amount !== undefined && item.amount !== null && !isNaN(Number(item.amount))) ? parseFloat(item.amount).toFixed(2) : '0.00';
    const safeDescription = item.description && item.description.trim() ? item.description : 'No description';

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
                  onChangeText={setEditedAmount}
                  keyboardType="numeric"
                  autoFocus
                  placeholder="Enter amount"
                  placeholderTextColor={colors.fontSecondColor}
                />
                <View style={styles.amountEditButtons}>
                  {isUpdatingExpense ? (
                    <ActivityIndicator size="small" color={colors.Zypsii_color} />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.amountEditButton, styles.saveButton]}
                        onPress={() => handleUpdateExpense(item._id, editedAmount)}
                      >
                        <Ionicons name="checkmark" size={20} color={colors.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.amountEditButton, styles.cancelButton]}
                        onPress={() => {
                          setEditingExpenseId(null);
                          setEditedAmount('');
                        }}
                      >
                        <Ionicons name="close" size={20} color={colors.white} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => {
                  setEditingExpenseId(item._id);
                  setEditedAmount(item.amount ? item.amount.toString() : '');
                }}
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
                  {paidByUser?.name ? paidByUser.name.charAt(0).toUpperCase() : 
                   paidByUser?.email ? paidByUser.email.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
              <View style={styles.paidByTextContainer}>
                <Text style={styles.paidByLabel}>Paid by</Text>
                <Text style={[styles.paidByEmail, { color: colors.Zypsii_color }]} numberOfLines={1}>
                  {paidByUser?.name || paidByUser?.email || 'Unknown user'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderParticipantItem = ({ item }) => (
    <View style={styles.participantItem}>
      <View style={styles.participantInfo}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.user?.email ? item.user.email[0].toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.participantDetails}>
          <Text style={styles.participantName}>{item.user?.email || 'Unknown User'}</Text>
          <Text style={styles.participantContact}>Amount: ₹{item.amount || 0}</Text>
          <Text style={[
            styles.paymentStatus,
            { color: item.paid ? colors.greenColor : colors.error }
          ]}>
            {item.paid ? 'Paid' : 'Pending'}
          </Text>
        </View>
      </View>
      {!item.paid && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => handleMarkAsPaid(item._id)}
        >
          <Text style={styles.payButtonText}>Mark as Paid</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  

  const handleAddExpense = async (expenseData) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      // Validate expense data
      if (!expenseData.description || !expenseData.description.trim()) {
        throw new Error('Description is required');
      }

      if (!expenseData.amount || isNaN(expenseData.amount) || expenseData.amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (!expenseData.category || !expenseData.category.trim()) {
        throw new Error('Category is required');
      }

      // Format the data
      const formattedExpenseData = {
        ...expenseData,
        amount: parseFloat(expenseData.amount),
        description: expenseData.description.trim(),
        category: expenseData.category.trim(),
        date: new Date().toISOString(), // Ensure proper date format
        splitId: splitId
      };

      const response = await axios.post(
        `${base_url}/api/splits/${splitId}/expenses`,
        formattedExpenseData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        // Update the split details in state
        await fetchSplitDetails();
        setSplit(response.data);
        Alert.alert('Success', 'Expense added successfully');
      } else {
        throw new Error('Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      let errorMessage = 'Failed to add expense';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Error',
        errorMessage
      );
      throw error;
    }
  };

  const handleMarkAsPaid = async (participantId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await axios.put(`${base_url}/api/splits/${splitId}/participants/paid`, {
        participantId: participantId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchSplitDetails(); // Refresh the data
      Alert.alert('Success', 'Payment marked as completed');
    } catch (error) {
      console.error('Error marking payment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark payment');
    }
  };

  const handleInviteFriend = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter email');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      await axios.post(`${base_url}/api/splits/${splitId}/participants`, {
        email: inviteEmail.trim(),
        amount: split.totalAmount / (split.participants.length + 1)
        }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setInviteEmail('');
      setIsInviteModalVisible(false);
      fetchSplitDetails(); 
      Alert.alert('Success', 'Friend has been invited to the split');
    } catch (error) {
      console.error('Error inviting friend:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to invite friend');
    }
  };

  const handleAddParticipant = async (user) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await axios.post(`${base_url}/api/splits/${splitId}/participants`, {
        userId: user._id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setIsAddParticipantModalVisible(false);
      fetchSplitDetails(); 
      Alert.alert('Success', 'Participant added successfully');
    } catch (error) {
      console.error('Error adding participant:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add participant');
    }
  };

  if (loading || !split) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Debug logs to inspect data
  console.log('Split data:', split);
  console.log('Expenses:', split?.expenses);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{split.title}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddParticipantModalVisible(true)}
          >
            <Ionicons name="person-add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Total Expenses</Text>
        <Text style={styles.totalAmount}>₹{split.totalAmount}</Text>
        <Text style={styles.participantsText}>{split.participants.length} participants</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'participants' && styles.activeTab]}
          onPress={() => setActiveTab('participants')}
        >
          <Ionicons 
            name="people-outline" 
            size={20} 
            color={activeTab === 'participants' ? colors.btncolor : colors.fontSecondColor} 
          />
          <Text style={[styles.tabText, activeTab === 'participants' && styles.activeTabText]}>
            Participants
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Ionicons 
            name="receipt-outline" 
            size={20} 
            color={activeTab === 'expenses' ? colors.btncolor : colors.fontSecondColor} 
          />
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Expenses
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'expenses' ? (
        <>
          <FlatList
            data={split.expenses}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No expenses added yet</Text>
              </View>
            }
          />
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setIsAddExpenseModalVisible(true)}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </>
      ) : (
        <FlatList
          data={split.participants}
          renderItem={renderParticipantItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <AddParticipantModal
        visible={isAddParticipantModalVisible}
        onClose={() => setIsAddParticipantModalVisible(false)}
        onAddParticipant={handleAddParticipant}
        existingParticipants={split?.participants || []}
      />

      <Modal
        visible={isInviteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsInviteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite Friend</Text>
            <TextInput
              style={styles.input}
              placeholder="Friend's Email"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsInviteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.inviteButton]}
                onPress={handleInviteFriend}
              >
                <Text style={styles.inviteButtonText}>Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AddExpenseModal
        visible={isAddExpenseModalVisible}
        onClose={() => setIsAddExpenseModalVisible(false)}
        onAddExpense={handleAddExpense}
        participants={split?.participants || []}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    backgroundColor: colors.grayBackground,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    backgroundColor: colors.btncolor,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: colors.grayBackground,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    color: colors.fontSecondColor,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  participantsText: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: 8,
  },
  activeTab: {
    borderBottomColor: colors.btncolor,
    backgroundColor: colors.grayBackground,
    borderRadius: 8,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  activeTabText: {
    color: colors.btncolor,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    borderRadius: 8,
    marginBottom: 8,
  },
  participantInfo: {
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  participantContact: {
    fontSize: 12,
    color: colors.fontSecondColor,
  },
  removeButton: {
    padding: 8,
  },
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  closeButton: {
    padding: 8,
    backgroundColor: colors.grayBackground,
    borderRadius: 8,
  },
  submitButton: {
    padding: 8,
  },
  submitButtonText: {
    color: colors.Zypsii_color,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.fontMainColor,
    textAlign: 'center',
    flex: 1,
  },
  modalBody: {
    flex: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  amountLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: colors.fontMainColor,
  },
  descriptionInput: {
    padding: 16,
    fontSize: 16,
    color: colors.fontMainColor,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  paidByContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  sectionLabel: {
    fontSize: 14,
    color: colors.fontSecondColor,
    marginBottom: 8,
  },
  paidBySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paidByText: {
    fontSize: 16,
    color: colors.fontMainColor,
  },
  splitOptionsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  splitTypeButtons: {
    flexDirection: 'row',
    backgroundColor: colors.grayBackground,
    borderRadius: 8,
    padding: 4,
  },
  splitTypeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  splitTypeButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  splitTypeText: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  splitTypeTextActive: {
    color: colors.fontMainColor,
    fontWeight: '600',
  },
  splitListContainer: {
    padding: 16,
  },
  splitListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  splitListTitle: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  splitEquallyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitEquallyText: {
    marginLeft: 4,
    color: colors.Zypsii_color,
    fontWeight: '600',
  },
  splitListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantInfo: {
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
    fontSize: 16,
    fontWeight: '600',
  },
  participantName: {
    fontSize: 16,
    color: colors.fontMainColor,
  },
  splitAmountInput: {
    width: 80,
    textAlign: 'right',
    fontSize: 16,
    color: colors.fontMainColor,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    borderRadius: 8,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: colors.grayBackground,
  },
  inviteButton: {
    backgroundColor: colors.btncolor,
  },
  cancelButtonText: {
    color: colors.fontMainColor,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  inviteButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  payButton: {
    backgroundColor: colors.btncolor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  payButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  searchWrapper: {
    paddingHorizontal: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
  },
  searchIcon: {
    marginRight: 12,
    color: colors.fontSecondColor,
  },
  searchInputField: {
    flex: 1,
    fontSize: 16,
    color: colors.fontMainColor,
    height: '100%',
    paddingVertical: 8,
  },
  clearSearchButton: {
    padding: 8,
    backgroundColor: colors.grayBackground,
    borderRadius: 12,
  },
  userItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
    backgroundColor: colors.white,
  },
  userInfoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.Zypsii_color,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  userAvatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  userDetailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  userEmailText: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  addIconContainer: {
    padding: 10,
    backgroundColor: colors.grayBackground,
    borderRadius: 12,
  },
  searchResultsContainer: {
    flexGrow: 1,
    paddingTop: 12,
  },
  emptyResultsContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResultsText: {
    fontSize: 16,
    color: colors.fontSecondColor,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalHeaderWithSearch: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
    paddingBottom: 16,
  },
  modalHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  categoryError: {
    marginTop: 8,
    marginBottom: 4,
    color: colors.error,
    fontSize: 12,
    textAlign: 'center',
  },
  paidByError: {
    color: colors.error,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
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
  categoryContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.grayBackground,
    minWidth: '30%',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: colors.Zypsii_color,
  },
  categoryButtonText: {
    color: colors.fontMainColor,
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  step1Container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  bottomButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grayLinesColor,
    backgroundColor: colors.white,
  },
  nextButton: {
    backgroundColor: colors.Zypsii_color,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 70, // Match the width of the submit button
  },
  paidByButton: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  paidByContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paidByLeft: {
    flex: 1,
  },
  paidByLabel: {
    fontSize: 14,
    color: colors.fontSecondColor,
    marginBottom: 4,
  },
  paidByName: {
    fontSize: 16,
    color: colors.fontMainColor,
    fontWeight: '500',
  },
  payerSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  payerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  payerName: {
    fontSize: 16,
    color: colors.fontMainColor,
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
  step2Container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  submitButton: {
    backgroundColor: colors.Zypsii_color,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  participantCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  splitAmountInputDisabled: {
    backgroundColor: colors.grayBackground,
    color: colors.fontSecondColor,
  },
});

export default SplitDetail;