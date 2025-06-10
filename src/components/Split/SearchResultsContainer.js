import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors } from '../../utils';
import UserSearchResult from './UserSearchResult';

const SearchResultsContainer = ({ 
  searchResults, 
  tempSelectedUsers, 
  selectedUsers, 
  hasMore, 
  onToggleUser, 
  onLoadMore, 
  onAddSelected 
}) => {
  return (
    <View style={styles.searchResultsContainer}>
      {searchResults.map(user => (
        <UserSearchResult
          key={user._id}
          user={user}
          isSelected={tempSelectedUsers.some(u => u._id === user._id)}
          isAlreadySelected={selectedUsers.some(u => u._id === user._id)}
          onToggle={onToggleUser}
        />
      ))}
      {hasMore && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={onLoadMore}
        >
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>
      )}
      {tempSelectedUsers.length > 0 && (
        <TouchableOpacity
          style={styles.addSelectedButton}
          onPress={onAddSelected}
        >
          <Text style={styles.addSelectedButtonText}>
            Add Selected ({tempSelectedUsers.length})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchResultsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.grayLinesColor,
    overflow: 'hidden',
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
});

export default SearchResultsContainer; 