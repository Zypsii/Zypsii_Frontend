import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import SelectPayerModal from './SelectPayerModal';
import { useToast } from '../../context/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddExpenseModal = ({ visible, onClose, onAddExpense, participants, splitId }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitAmounts, setSplitAmounts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isPayerModalVisible, setIsPayerModalVisible] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState({});

  const categories = [
    'Food',
    'Transportation',
    'Accommodation',
    'Entertainment',
    'Shopping',
    'Other'
  ];

  // Initialize all participants as selected when modal opens or participants change
  useEffect(() => {
    if (participants && participants.length > 0) {
      const initialSelected = {};
      participants.forEach(participant => {
        if (participant?.memberId?._id) {
          initialSelected[participant.memberId._id] = true;
        }
      });
      setSelectedParticipants(initialSelected);
    }
  }, [participants, visible]);

  useEffect(() => {
    if (participants?.length && totalAmount) {
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
          if (selectedParticipants[participant.memberId?._id]) {
            let share = baseShare;
            if (remainder > 0) {
              share += 1;
              remainder -= 1;
            }
            newSplitAmounts[participant.memberId?._id] = {
              value: share.toString(),
              isManuallyEdited: false
            };
          } else {
            newSplitAmounts[participant.memberId?._id] = {
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
    // Reset selected participants to include all members
    if (participants && participants.length > 0) {
      const initialSelected = {};
      participants.forEach(participant => {
        if (participant?.memberId?._id) {
          initialSelected[participant.memberId._id] = true;
        }
      });
      setSelectedParticipants(initialSelected);
    }
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
      let payerId = paidBy;
      let loginUserId = null;
      // Get the logged-in user from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (!payerId) payerId = user?._id;
        loginUserId = user?._id;
      }
      if (!payerId) {
        setErrors(prev => ({ ...prev, paidBy: 'Please select who paid' }));
        return;
      }

      if (!totalAmount || isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
        setErrors(prev => ({ ...prev, amount: 'Please enter a valid amount' }));
        return;
      }

      setIsSubmitting(true);
      
      // Format members with their amounts
      const membersInExpenseAndAmount = Object.entries(selectedParticipants)
        .filter(([_, isSelected]) => isSelected)
        .map(([memberId]) => ({
          memberId,
          amountNeedToPay: parseFloat(splitAmounts[memberId]?.value || '0'),
          paid: memberId === payerId || memberId === loginUserId,
          paidAt: memberId === payerId || memberId === loginUserId ? Date.now() : null
        }));

      const expenseData = {
        splitId,
        category: category.trim(),
        description: description.trim(),
        expenseTotalAmount: parseFloat(totalAmount),
        membersInExpenseAndAmount
      };

      console.log('\n\nwhat is the expenseData:',expenseData)
      await onAddExpense(expenseData);
      handleClose();
    } catch (error) {
      console.error('Error submitting expense:', error);
      showToast(error.message || 'Failed to add expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSplitAmountChange = (userId, value) => {
    const newAmount = value.replace(/[^0-9.]/g, '');
    const newAmountNum = parseFloat(newAmount || '0');
    const totalAmountNum = parseFloat(totalAmount);

    if (newAmountNum > totalAmountNum) {
      showToast('Amount cannot be greater than total expense', 'error');
      return;
    }

    const otherSelectedParticipants = Object.entries(selectedParticipants)
      .filter(([id, isSelected]) => {
        return isSelected && id !== userId && !splitAmounts[id]?.isManuallyEdited;
      })
      .map(([id]) => id);

    const newSplitAmounts = { ...splitAmounts };

    newSplitAmounts[userId] = {
      value: newAmount,
      isManuallyEdited: true
    };

    const manuallyEditedTotal = Object.entries(newSplitAmounts)
      .filter(([id, amount]) => amount?.isManuallyEdited)
      .reduce((sum, [_, amount]) => sum + parseFloat(amount.value || 0), 0);

    const remainingAmount = totalAmountNum - manuallyEditedTotal;

    if (manuallyEditedTotal >= totalAmountNum) {
      otherSelectedParticipants.forEach(participantId => {
        newSplitAmounts[participantId] = {
          value: '0',
          isManuallyEdited: false
        };
      });
    } else {
      if (otherSelectedParticipants.length > 0) {
        const sharePerParticipant = Math.max(0, (remainingAmount / otherSelectedParticipants.length).toFixed(2));
        let totalDistributed = 0;
        otherSelectedParticipants.forEach((participantId, index) => {
          if (index === otherSelectedParticipants.length - 1) {
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
      if (totalAmount) {
        const selectedIds = Object.entries(newSelected)
          .filter(([_, isSelected]) => isSelected)
          .map(([id]) => id);
        const selectedCount = selectedIds.length;
        if (selectedCount > 0) {
          const equalShare = (parseFloat(totalAmount) / selectedCount).toFixed(2);
          const newSplitAmounts = {};
          participants.forEach(participant => {
            if (newSelected[participant.memberId?._id]) {
              newSplitAmounts[participant.memberId?._id] = {
                value: equalShare,
                isManuallyEdited: false
              };
            } else {
              newSplitAmounts[participant.memberId?._id] = {
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

  const handleSelectAll = () => {
    const allSelected = {};
    participants.forEach(participant => {
      if (participant?.memberId?._id) {
        allSelected[participant.memberId._id] = true;
      }
    });
    setSelectedParticipants(allSelected);
    
    // Recalculate split amounts if total amount is set
    if (totalAmount) {
      const selectedCount = participants.length;
      if (selectedCount > 0) {
        const equalShare = (parseFloat(totalAmount) / selectedCount).toFixed(2);
        const newSplitAmounts = {};
        participants.forEach(participant => {
          newSplitAmounts[participant.memberId?._id] = {
            value: equalShare,
            isManuallyEdited: false
          };
        });
        setSplitAmounts(newSplitAmounts);
      }
    }
  };

  const isAllSelected = participants && participants.length > 0 && 
    Object.values(selectedParticipants).filter(Boolean).length === participants.length;

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
                {paidBy ? (
                  participants.find(p => p.memberId?._id === paidBy)?.memberId?.fullName || 'User'
                ) : 'Select payer'}
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
            <View style={styles.splitListHeaderLeft}>
              <Text style={styles.splitListTitle}>
                {`${Object.values(selectedParticipants).filter(Boolean).length} of ${participants?.length || 0} Selected`}
              </Text>
             
            </View>
            <View style={styles.splitListHeaderRight}>
              <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllButton}>
                <Ionicons name="checkmark-circle" size={20} color={colors.Zypsii_color} />
                <Text style={styles.selectAllText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSplitEqually} style={styles.splitEquallyButton}>
                <Ionicons name="refresh" size={20} color={colors.Zypsii_color} />
                <Text style={styles.splitEquallyText}>Split Equally</Text>
              </TouchableOpacity>
            </View>
          </View>

          {participants?.map((participant) => (
            <View key={participant.memberId?._id} style={styles.splitListItem}>
              <TouchableOpacity
                style={styles.participantCheckbox}
                onPress={() => handleParticipantToggle(participant.memberId?._id)}
              >
                <View style={[
                  styles.checkbox,
                  selectedParticipants[participant.memberId?._id] && styles.checkboxSelected
                ]}>
                  {selectedParticipants[participant.memberId?._id] && (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  )}
                </View>
                <View style={styles.participantInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {participant.memberId?.fullName ? participant.memberId.fullName.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <Text style={styles.participantName}>
                    {participant.memberId?.fullName || 'User'}
                  </Text>
                </View>
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.splitAmountInput,
                  !selectedParticipants[participant.memberId?._id] && styles.splitAmountInputDisabled
                ]}
                value={splitAmounts[participant.memberId?._id]?.value?.toString() || ''}
                onChangeText={(value) => handleSplitAmountChange(participant.memberId?._id, value)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.fontSecondColor}
                editable={selectedParticipants[participant.memberId?._id]}
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

const styles = StyleSheet.create({
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
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.fontMainColor,
    textAlign: 'center',
    flex: 1,
  },
  headerPlaceholder: {
    width: 70,
  },
  modalBody: {
    flex: 1,
  },
  step1Container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  step2Container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  descriptionInput: {
    padding: 16,
    fontSize: 16,
    color: colors.fontMainColor,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  categoryContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  sectionLabel: {
    fontSize: 14,
    color: colors.fontSecondColor,
    marginBottom: 8,
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
  paidByEmail: {
    fontSize: 12,
    color: colors.fontSecondColor,
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
  splitListHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitListTitle: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  allSelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  allSelectedText: {
    fontSize: 12,
    color: colors.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  splitListHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: `${colors.Zypsii_color}15`,
  },
  selectAllText: {
    color: colors.Zypsii_color,
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
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
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
  },
  participantCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.grayLinesColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: colors.Zypsii_color,
    borderColor: colors.Zypsii_color,
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
  userIdText: {
    fontSize: 12,
    color: colors.fontSecondColor,
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
  splitAmountInputDisabled: {
    backgroundColor: colors.grayBackground,
    color: colors.fontSecondColor,
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
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default AddExpenseModal; 