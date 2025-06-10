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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';
import { addParticipant, fetchSplitMembers } from '../../redux/slices/splitSlice';
import { useDispatch } from 'react-redux';

const AddParticipantModal = ({ visible, onClose, splitId, existingParticipants }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const dispatch = useDispatch();
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

      if (data.success && Array.isArray(data.data)) {
        const formattedResults = data.data
          .filter(user => user && user._id) // Filter out any invalid user objects
          .map(user => ({
            _id: user._id,
            name: user.fullName || 'Unknown User',
            email: user.email || '',
            profileImage: user.profileImage || 'https://via.placeholder.com/50',
            userName: user.userName || ''
          }));

        const filteredResults = formattedResults.filter(user => 
          !existingParticipants?.some(p => p.user?._id === user._id)
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
      onPress={async () => {
        try {
          await dispatch(addParticipant({ splitId, memberIds: [item._id] })).unwrap();
          await dispatch(fetchSplitMembers(splitId));
          onClose();
          Alert.alert(
            'Success',
            `${item.name} has been added as a participant`,
            [{ text: 'OK', onPress: onClose }]
          );
        } catch (error) {
          console.error('Error adding participant:', error);
          Alert.alert('Error', error.message || 'Failed to add participant');
        }
      }}
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

const styles = StyleSheet.create({
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
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
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.fontMainColor,
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    backgroundColor: colors.grayBackground,
    borderRadius: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultsContainer: {
    flexGrow: 1,
    paddingTop: 12,
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
});

export default AddParticipantModal; 