import React, { useEffect, useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  createSplit,
  searchUsers,
  setSearchQuery,
  setUserInfo,
  toggleTempSelectedUser,
  clearTempSelectedUsers,
  loadMoreSearchResults,
  removeSelectedUser,
  addSelectedUser
} from '../../redux/slices/splitSlice';
import UserSearchResult from '../../components/Split/UserSearchResult';
import SelectedUserItem from '../../components/Split/SelectedUserItem';
import SearchResultsContainer from '../../components/Split/SearchResultsContainer';

function CreateSplit() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    createSplitLoading,
    searchResults,
    searching,
    hasMoreResults,
    userInfo,
    selectedUsers,
    tempSelectedUsers
  } = useSelector((state) => state.split);

  useEffect(() => {
    (async () => {
      const user = JSON.parse(await AsyncStorage.getItem('user'));
      dispatch(setUserInfo(user));
    })();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    dispatch(setSearchQuery(query));
    if (query.trim()) {
      dispatch(searchUsers({ searchQuery: query, selectedUsers }));
    }
  };

  const handleToggleUser = (user) => {
    dispatch(toggleTempSelectedUser(user));
  };

  const handleAddSelectedUsers = () => {
    if (tempSelectedUsers.length > 0) {
      const newUsers = tempSelectedUsers.filter(user => 
        !selectedUsers.some(su => su._id === user._id)
      );
      
      if (newUsers.length > 0) {
        newUsers.forEach(user => dispatch(addSelectedUser(user)));
      }
      
      dispatch(clearTempSelectedUsers());
      dispatch(setSearchQuery(''));
      setSearchQuery('');
    }
  };

  const handleRemoveUser = (userId) => {
    dispatch(removeSelectedUser(userId));
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

    try {
      const result = await dispatch(createSplit({ title, participants: selectedUsers })).unwrap();
      Alert.alert('Success', 'Split created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('SplitDashboard'),
        },
      ]);
    } catch (error) {
      console.error('Error creating split:', error);
      Alert.alert('Error', error.message || 'Failed to create split');
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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Add Members</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="person-add" size={24} color={colors.grayLinesColor} style={styles.searchIcon} />
            <TextInput
              style={[styles.input, styles.searchInput]}
              placeholder="Search users by name or email"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
          {searching && <ActivityIndicator size="small" color={colors.Zypsii_color} style={{ marginTop: 8 }} />}
          {searchResults.length > 0 && (
            <SearchResultsContainer
              searchResults={searchResults}
              tempSelectedUsers={tempSelectedUsers}
              selectedUsers={selectedUsers}
              hasMore={hasMoreResults}
              onToggleUser={handleToggleUser}
              onLoadMore={() => dispatch(loadMoreSearchResults())}
              onAddSelected={handleAddSelectedUsers}
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Selected Members</Text>
          {selectedUsers.map(user => (
            <SelectedUserItem
              key={user._id}
              user={user}
              isCreator={userInfo && user._id === userInfo._id}
              onRemove={handleRemoveUser}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.createButton, createSplitLoading && styles.disabledButton]}
          onPress={handleCreateSplit}
          disabled={createSplitLoading}
        >
          {createSplitLoading ? (
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
  },
  searchIcon: {
    padding: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
  },
});

export default CreateSplit; 