import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFollow } from './FollowContext';
import { useAuth } from '../Auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';

const FollowButton = ({ userId }) => {
  const { user } = useAuth();
  const { 
    isFollowing, 
    followUser, 
    unfollowUser, 
    isLoading 
  } = useFollow();
  const [error, setError] = useState(null);

  const handlePress = async () => {
    if (!user?._id) {
      Alert.alert('Error', 'Please log in to follow users');
      return;
    }
    
    try {
      setError(null);
      const isCurrentlyFollowing = isFollowing(userId);
      
      if (isCurrentlyFollowing) {
        await unfollowUser(user._id, userId);
      } else {
        try {
          await followUser(user._id, userId);
        } catch (followError) {
          // If the error indicates user is already following, trigger unfollow
          if (followError.message === 'You already follow this user') {
            await unfollowUser(user._id, userId);
          } else {
            throw followError;
          }
        }
      }
    } catch (error) {
      console.error("Follow action failed:", error.message);
      setError(error.message);
      Alert.alert('Error', error.message || 'Failed to update follow status');
    }
  };

  const buttonLoading = isLoading(userId);
  const following = isFollowing(userId);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        following ? styles.following : styles.notFollowing,
        buttonLoading && styles.disabled,
        error && styles.error
      ]}
      onPress={handlePress}
      disabled={buttonLoading || !user?._id}
    >
      {buttonLoading ? (
        <ActivityIndicator size="small" color={following ? '#fff' : colors.primary} />
      ) : (
        <>
          <Ionicons 
            name={following ? 'remove' : 'add'} 
            size={16} 
            color={following ? '#fff' : colors.primary} 
          />
          <Text style={[
            styles.buttonText,
            following && styles.followingText,
            error && styles.errorText
          ]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  following: {
    backgroundColor: colors.primary,
  },
  notFollowing: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    borderColor: 'red',
  },
  buttonText: {
    marginLeft: 5,
    fontSize: 14,
    color: colors.primary,
  },
  followingText: {
    color: '#fff',
  },
  errorText: {
    color: 'red',
  },
});

export default FollowButton;