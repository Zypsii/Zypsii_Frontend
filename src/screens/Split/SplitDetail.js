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

const AddExpenseModal = ({ visible, onClose, onAddExpense, participants }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paidBy, setPaidBy] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Category, 3: Paid By
  const [errors, setErrors] = useState({});

  const predefinedCategories = [
    'Food & Dining',
    'Transportation',
    'Accommodation',
    'Entertainment',
    'Shopping',
    'Other'
  ];

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('');
    setIsCustomCategory(false);
    setPaidBy('');
    setCurrentStep(1);
    setIsSubmitting(false);
    setErrors({});
  };

  const validateAmount = (value) => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue) || numValue <= 0) {
      return 'Please enter a valid amount';
    }
    return null;
  };

  const validateDescription = (value) => {
    if (!value || !value.trim()) {
      return 'Description is required';
    }
    if (value.trim().length < 3) {
      return 'Description must be at least 3 characters';
    }
    return null;
  };

  const handleAmountChange = (value) => {
    // Remove any non-numeric characters except decimal point
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanedValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setAmount(cleanedValue);
    setErrors(prev => ({ ...prev, amount: validateAmount(cleanedValue) }));
  };

  const handleDescriptionChange = (value) => {
    setDescription(value);
    setErrors(prev => ({ ...prev, description: validateDescription(value) }));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      const amountError = validateAmount(amount);
      const descriptionError = validateDescription(description);
      
      if (amountError || descriptionError) {
        setErrors({
          amount: amountError,
          description: descriptionError
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!category.trim()) {
        setErrors(prev => ({ ...prev, category: 'Please select or enter a category' }));
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!paidBy) {
        setErrors(prev => ({ ...prev, paidBy: 'Please select who paid' }));
        return;
      }

      setIsSubmitting(true);
      
      const expenseData = {
        description: description.trim(),
        amount: parseFloat(amount),
        category: isCustomCategory ? category.trim() : category,
        paidBy: paidBy,
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

  const renderBasicInfoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Add Expense Details</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.input, errors.description && styles.inputError]}
          placeholder="What was this expense for?"
          value={description}
          onChangeText={handleDescriptionChange}
          placeholderTextColor={colors.fontSecondColor}
          editable={!isSubmitting}
        />
        {errors.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Amount (₹)</Text>
        <TextInput
          style={[styles.input, errors.amount && styles.inputError]}
          placeholder="0.00"
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
          placeholderTextColor={colors.fontSecondColor}
          editable={!isSubmitting}
        />
        {errors.amount && (
          <Text style={styles.errorText}>{errors.amount}</Text>
        )}
      </View>
      <View style={styles.navigationButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.navigationButton,
            styles.nextButton,
            (!description || !amount) && styles.disabledButton
          ]}
          onPress={handleNextStep}
          disabled={!description || !amount || isSubmitting}
        >
          <Text style={styles.buttonText}>Next</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Category</Text>
      <View style={styles.categoryToggleContainer}>
        <TouchableOpacity
          style={[
            styles.categoryToggleButton,
            !isCustomCategory && styles.categoryToggleButtonActive
          ]}
          onPress={() => setIsCustomCategory(false)}
        >
          <Text style={[
            styles.categoryToggleText,
            !isCustomCategory && styles.categoryToggleTextActive
          ]}>Predefined</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.categoryToggleButton,
            isCustomCategory && styles.categoryToggleButtonActive
          ]}
          onPress={() => setIsCustomCategory(true)}
        >
          <Text style={[
            styles.categoryToggleText,
            isCustomCategory && styles.categoryToggleTextActive
          ]}>Custom</Text>
        </TouchableOpacity>
      </View>

      {!isCustomCategory ? (
        <ScrollView style={styles.categoriesScrollView}>
          <View style={styles.predefinedCategoriesContainer}>
            {predefinedCategories.map((cat, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryOption,
                  category === cat && styles.selectedCategory
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[
                  styles.categoryText,
                  category === cat && styles.selectedCategoryText
                ]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Custom Category</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter category name"
            value={category}
            onChangeText={setCategory}
            placeholderTextColor={colors.fontSecondColor}
            editable={!isSubmitting}
          />
        </View>
      )}

      <View style={styles.navigationButtonsContainer}>
        <TouchableOpacity
          style={[styles.navigationButton, styles.backButton]}
          onPress={() => setCurrentStep(currentStep - 1)}
        >
          <Ionicons name="arrow-back" size={20} color={colors.fontMainColor} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navigationButton, styles.nextButton]}
          onPress={handleNextStep}
          disabled={!category}
        >
          <Text style={styles.buttonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPaidByStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Who paid for this expense?</Text>
      <ScrollView style={styles.participantList}>
        {participants.map((participant) => (
          <TouchableOpacity
            key={participant.user._id}
            style={[
              styles.participantItem,
              paidBy === participant.user._id && styles.selectedParticipant
            ]}
            onPress={() => setPaidBy(participant.user._id)}
          >
            <View style={styles.participantAvatar}>
              <Text style={styles.avatarText}>
                {participant.user.name ? participant.user.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{participant.user.name}</Text>
              <Text style={styles.participantEmail}>{participant.user.email}</Text>
            </View>
            {paidBy === participant.user._id && (
              <Ionicons name="checkmark-circle" size={24} color={colors.Zypsii_color} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.navigationButtonsContainer}>
        <TouchableOpacity
          style={[styles.navigationButton, styles.backButton]}
          onPress={() => setCurrentStep(currentStep - 1)}
        >
          <Ionicons name="arrow-back" size={20} color={colors.fontMainColor} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navigationButton, styles.submitButton]}
          onPress={handleSubmit}
          disabled={!paidBy || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.buttonText}>Submit</Text>
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
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.fontMainColor} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.progressContainer}>
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressStep,
                  currentStep >= step && styles.progressStepActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.modalBody}>
            {currentStep === 1 && renderBasicInfoStep()}
            {currentStep === 2 && renderCategoryStep()}
            {currentStep === 3 && renderPaidByStep()}
          </View>
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
    // Get paidBy user directly from the expense since it's now populated
    const paidByUser = item.paidBy;
    
    // Format date properly
    const expenseDate = item.date ? new Date(item.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : 'No date';

    return (
      <View style={styles.expenseItem}>
        <View style={styles.expenseHeader}>
          <View style={styles.expenseMainInfo}>
            <Text style={styles.expenseDescription} numberOfLines={2}>
              {item.description || 'No description'}
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
                  setEditedAmount(item.amount.toString());
                }}
              >
                <Text style={styles.expenseAmount}>₹{parseFloat(item.amount).toFixed(2)}</Text>
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
                <Text style={styles.paidByEmail} numberOfLines={1}>
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
          <Text style={styles.avatarText}>{item.user.email[0].toUpperCase()}</Text>
        </View>
        <View style={styles.participantDetails}>
          <Text style={styles.participantName}>{item.user.email}</Text>
          <Text style={styles.participantContact}>Amount: ₹{item.amount}</Text>
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
      fetchSplitDetails(); // Refresh the data
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
      fetchSplitDetails(); // Refresh the data
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.fontMainColor,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.btncolor,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: colors.fontMainColor,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.fontMainColor,
  },
  modalBody: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  progressStep: {
    width: 50,
    height: 4,
    backgroundColor: colors.grayBackground,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: colors.Zypsii_color,
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.fontMainColor,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.fontMainColor,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.fontMainColor,
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    gap: 8,
  },
  backButton: {
    backgroundColor: colors.grayBackground,
    marginRight: 8,
  },
  nextButton: {
    backgroundColor: colors.Zypsii_color,
  },
  submitButton: {
    backgroundColor: colors.Zypsii_color,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  backButtonText: {
    color: colors.fontMainColor,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.grayBackground,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  categoryToggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  categoryToggleButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryToggleText: {
    fontSize: 14,
    color: colors.fontSecondColor,
    fontWeight: '500',
  },
  categoryToggleTextActive: {
    color: colors.Zypsii_color,
    fontWeight: '600',
  },
  categoriesScrollView: {
    flex: 1,
    marginBottom: 16,
  },
  predefinedCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 16,
  },
  categoryOption: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedCategory: {
    backgroundColor: colors.Zypsii_color,
    borderColor: colors.Zypsii_color,
  },
  categoryText: {
    fontSize: 14,
    color: colors.fontMainColor,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: colors.white,
    fontWeight: '600',
  },
  participantList: {
    flex: 1,
    marginBottom: 16,
  },
  selectedParticipant: {
    borderColor: colors.Zypsii_color,
    backgroundColor: `${colors.Zypsii_color}10`,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.Zypsii_color,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: 12,
    color: colors.fontSecondColor,
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
    paddingHorizontal: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputField: {
    flex: 1,
    fontSize: 16,
    color: colors.fontMainColor,
    height: '100%',
    paddingVertical: 8,
  },
  clearSearchButton: {
    padding: 4,
  },
  closeButton: {
    padding: 8,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.Zypsii_color,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  userEmailText: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  addIconContainer: {
    padding: 8,
  },
  searchResultsContainer: {
    flexGrow: 1,
    paddingTop: 8,
  },
  emptyResultsContainer: {
    flex: 1,
    padding: 24,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBackground,
    paddingBottom: 12,
  },
  modalHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  amountInput: {
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 100,
    color: colors.fontMainColor,
    fontSize: 16,
    fontWeight: '600',
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
});

export default SplitDetail; 