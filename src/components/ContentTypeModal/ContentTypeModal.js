import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { useNavigation } from '@react-navigation/native';

const ContentTypeModal = ({ visible, onClose, onSelectType }) => {
  const navigation = useNavigation();

  const handleCancel = () => {
    onClose();
    navigation.goBack();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose Content Type</Text>
          
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => {
              onSelectType('reel');
              navigation.navigate('ShortsUpload');
            }}
          >
            <Ionicons name="videocam" size={24} color={colors.btncolor} />
            <Text style={styles.optionText}>Create Reel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => onSelectType('post')}
          >
            <Ionicons name="image" size={24} color={colors.btncolor} />
            <Text style={styles.optionText}>Create Post</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.btncolor,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },
  cancelButton: {
    marginTop: 10,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.btncolor,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ContentTypeModal; 