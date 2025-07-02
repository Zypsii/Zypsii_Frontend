import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';

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
            {participants?.map((participant) => (
              <TouchableOpacity
                key={participant.memberId?._id}
                style={styles.payerSelectItem}
                onPress={() => onSelectPayer(participant.memberId?._id)}
              >
                <View style={styles.payerInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {participant.memberId?.fullName
                        ? participant.memberId.fullName.charAt(0).toUpperCase()
                        : participant.memberId?.email
                        ? participant.memberId.email.charAt(0).toUpperCase()
                        : '?'}
                    </Text>
                  </View>
                  <View style={styles.payerDetails}>
                    <Text style={styles.payerName}>
                      {participant.memberId?.fullName || 'User'}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.checkbox,
                  selectedPayer === participant.memberId?._id && styles.checkboxSelected
                ]}>
                  {selectedPayer === participant.memberId?._id && (
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
    fontWeight: 'bold',
  },
  payerDetails: {
    flex: 1,
  },
  payerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.fontMainColor,
    marginBottom: 4,
  },
  payerEmail: {
    fontSize: 12,
    color: colors.fontSecondColor,
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
});

export default SelectPayerModal; 