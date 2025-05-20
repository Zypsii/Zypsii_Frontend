import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';

function CreateSplit() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [tempSelectedUsers, setTempSelectedUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allSearchResults, setAllSearchResults] = useState([]);
  const RESULTS_PER_PAGE = 6;

  // Fetch creator info on mount
  useEffect(() => {
    (async () => {
      const user = JSON.parse(await AsyncStorage.getItem('user'));
      setUserInfo(user);
      if (user) {
        setSelectedUsers([{ _id: user._id, email: user.email, fullName: user.fullName }]);
      }
    })();
  }, []);

  // Search users API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setAllSearchResults([]);
      setPage(1);
      setHasMore(true);
      return;
    }
    setSearching(true);
    (async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const response = await fetch(`${base_url}/user/getProfile?search=${encodeURIComponent(searchQuery)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success && data.data) {
          // Filter out users who are already in selectedUsers
          const filtered = data.data.filter(u => 
            !selectedUsers.some(su => su._id === u._id)
          );
          setAllSearchResults(filtered);
          setSearchResults(filtered.slice(0, RESULTS_PER_PAGE));
          setHasMore(filtered.length > RESULTS_PER_PAGE);
          setPage(1);
        } else {
          setSearchResults([]);
          setAllSearchResults([]);
          setHasMore(false);
        }
      } catch (e) {
        setSearchResults([]);
        setAllSearchResults([]);
        setHasMore(false);
      } finally {
        setSearching(false);
      }
    })();
  }, [searchQuery, selectedUsers]);

  const loadMoreResults = () => {
    if (!hasMore) return;
    
    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * RESULTS_PER_PAGE;
    const endIndex = startIndex + RESULTS_PER_PAGE;
    const newResults = allSearchResults.slice(startIndex, endIndex);
    
    setSearchResults(prev => [...prev, ...newResults]);
    setPage(nextPage);
    setHasMore(endIndex < allSearchResults.length);
  };

  const handleToggleUser = (user) => {
    // Check if user is already in selectedUsers
    if (selectedUsers.some(su => su._id === user._id)) {
      return; // Skip if already selected
    }
    
    setTempSelectedUsers(prev => {
      const isSelected = prev.some(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAddSelectedUsers = () => {
    if (tempSelectedUsers.length > 0) {
      // Filter out any users that might have been added to selectedUsers since temp selection
      const newUsers = tempSelectedUsers.filter(user => 
        !selectedUsers.some(su => su._id === user._id)
      );
      
      if (newUsers.length > 0) {
        setSelectedUsers(prev => [...prev, ...newUsers]);
      }
      
      setTempSelectedUsers([]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleRemoveUser = (userId) => {
    // Prevent removing the creator
    if (userInfo && userId === userInfo._id) return;
    setSelectedUsers(prev => prev.filter(u => u._id !== userId));
  };

  const handleCreateSplit = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please add at least one member');
      return;
    }
    const accessToken = await AsyncStorage.getItem('accessToken');
    setLoading(true);
    try {
      // Prepare participants array
      const participants = selectedUsers.map(u => ({
        user: { _id: u._id, email: u.email },
        amount: 0,
        paid: false
      }));
      const splitData = {
        title,
        totalAmount: 0,
        participants
      };
      const response = await axios.post(`${base_url}/api/splits`, splitData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      Alert.alert('Success', 'Split created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('SplitDashboard'),
        },
      ]);
    } catch (error) {
      console.error('Error creating split:', error);
      Alert.alert('Error', error.message || error.response?.data?.message || 'Failed to create split');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.fontMainColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Split</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter split title"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Search and select members */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Add Members</Text>
          <TextInput
            style={styles.input}
            placeholder="Search users by name or email"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searching && <ActivityIndicator size="small" color={colors.Zypsii_color} style={{ marginTop: 8 }} />}
          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              {searchResults.map(user => {
                const isAlreadySelected = selectedUsers.some(su => su._id === user._id);
                return (
                  <TouchableOpacity 
                    key={user._id} 
                    style={[
                      styles.searchResultItem,
                      isAlreadySelected && styles.searchResultItemDisabled
                    ]} 
                    onPress={() => handleToggleUser(user)}
                    disabled={isAlreadySelected}
                  >
                    <View style={styles.userInfoContainer}>
                      <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{user.fullName || user.email}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>
                    </View>
                    <View style={styles.checkboxContainer}>
                      {isAlreadySelected ? (
                        <View style={styles.alreadySelectedBadge}>
                          <Text style={styles.alreadySelectedText}>Added</Text>
                        </View>
                      ) : (
                        <View style={[
                          styles.checkbox,
                          tempSelectedUsers.some(u => u._id === user._id) && styles.checkboxSelected
                        ]}>
                          {tempSelectedUsers.some(u => u._id === user._id) && (
                            <Ionicons name="checkmark" size={16} color={colors.white} />
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {hasMore && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={loadMoreResults}
                >
                  <Text style={styles.loadMoreText}>Load More</Text>
                </TouchableOpacity>
              )}
              {tempSelectedUsers.length > 0 && (
                <TouchableOpacity
                  style={styles.addSelectedButton}
                  onPress={handleAddSelectedUsers}
                >
                  <Text style={styles.addSelectedButtonText}>
                    Add Selected ({tempSelectedUsers.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Selected members */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Selected Members</Text>
          {selectedUsers.map(user => (
            <View key={user._id} style={styles.selectedUserItem}>
              <View style={styles.userInfoContainer}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.fullName || user.email}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              </View>
              {(!userInfo || user._id !== userInfo._id) && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveUser(user._id)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.disabledButton]}
          onPress={handleCreateSplit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.createButtonText}>Create Split</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.themeBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.fontMainColor,
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.fontMainColor,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
  },
  createButton: {
    backgroundColor: colors.Zypsii_color,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  searchResultsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLinesColor,
  },
  searchResultItemDisabled: {
    opacity: 0.7,
    backgroundColor: colors.grayBackground,
  },
  userInfoContainer: {
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
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.fontMainColor,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: colors.fontSecondColor,
  },
  checkboxContainer: {
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
  addSelectedButton: {
    backgroundColor: colors.Zypsii_color,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.grayLinesColor,
  },
  addSelectedButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  selectedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.grayBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
  },
  alreadySelectedBadge: {
    backgroundColor: colors.grayBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alreadySelectedText: {
    color: colors.fontSecondColor,
    fontSize: 12,
    fontWeight: '500',
  },
  loadMoreButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.grayLinesColor,
    backgroundColor: colors.grayBackground,
  },
  loadMoreText: {
    color: colors.Zypsii_color,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CreateSplit; 