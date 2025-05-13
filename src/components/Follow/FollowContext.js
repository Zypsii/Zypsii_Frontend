import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';

const FollowContext = createContext();

export const FollowProvider = ({ children }) => {
  const [following, setFollowing] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});

  // Load followed users from storage when app starts
  useEffect(() => {
    const loadFollowing = async () => {
      try {
        const storedFollowing = await AsyncStorage.getItem('following');
        if (storedFollowing) {
          setFollowing(JSON.parse(storedFollowing));
        }
      } catch (error) {
        console.error('Error loading following data:', error);
      }
    };
    loadFollowing();
  }, []);

  const setLoading = (userId, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [userId]: isLoading
    }));
  };

  const followUser = async (followerId, followingId) => {
    if (!followerId || !followingId) {
      console.error('Invalid IDs:', { followerId, followingId });
      return;
    }

    setLoading(followingId, true);
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      console.log('Following user with data:', {
        followerId,
        followingId,
        url: `${base_url}/follow/followUser/${followerId}/${followingId}`
      });

      const response = await fetch(
        `${base_url}/follow/followUser/${followerId}/${followingId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      console.log('Follow response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to follow user');
      }

      // Accept both 'success' and 'status' as true
      if (data.success === true || data.status === true) {
        setFollowing(prev => [...new Set([...prev, followingId])]);
        await AsyncStorage.setItem('following', JSON.stringify([...new Set([...following, followingId])]));
      } else if (data.message && data.message.toLowerCase().includes('already follow')) {
        // If already following, just update state
        setFollowing(prev => [...new Set([...prev, followingId])]);
      } else {
        throw new Error(data.message || 'Follow operation failed');
      }
    } catch (error) {
      console.error('Error following user:', error);
      throw error; // Re-throw to handle in the component
    } finally {
      setLoading(followingId, false);
    }
  };

  const unfollowUser = async (followerId, followingId) => {
    if (!followerId || !followingId) {
      console.error('Invalid IDs:', { followerId, followingId });
      return;
    }

    setLoading(followingId, true);
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      console.log('Unfollowing user with data:', {
        followerId,
        followingId,
        url: `${base_url}/follow/unfollowUser/${followerId}/${followingId}`
      });

      const response = await fetch(
        `${base_url}/follow/unfollowUser/${followerId}/${followingId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      console.log('Unfollow response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to unfollow user');
      }

      // Accept both 'success' and 'status' as true
      if (data.success === true || data.status === true) {
        setFollowing(prev => prev.filter(id => id !== followingId));
        await AsyncStorage.setItem('following', JSON.stringify(following.filter(id => id !== followingId)));
      } else if (data.message && data.message.toLowerCase().includes('not following')) {
        // If already not following, just update state
        setFollowing(prev => prev.filter(id => id !== followingId));
      } else {
        throw new Error(data.message || 'Unfollow operation failed');
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error; // Re-throw to handle in the component
    } finally {
      setLoading(followingId, false);
    }
  };

  const isFollowing = (userId) => following.includes(userId);
  const isLoading = (userId) => loadingStates[userId] || false;

  return (
    <FollowContext.Provider value={{ 
      following, 
      followUser, 
      unfollowUser, 
      isFollowing,
      isLoading 
    }}>
      {children}
    </FollowContext.Provider>
  );
};

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
};