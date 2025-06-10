import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils';
import { base_url } from '../../utils/base_url';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FollowButton from '../../components/Follow/FollowButton';
import { useFollow } from '../../components/Follow/FollowContext';

const FollowersList = ({ navigation, route }) => {
  const { isFollowing } = useFollow();
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'Followers');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowData();
  }, [isFollowing]); // Refresh when follow status changes

  const fetchFollowData = async () => {
    try {
      const storedUserString = await AsyncStorage.getItem('user');
      const storedUser = JSON.parse(storedUserString);
      console.log('Stored user:', storedUser);

      const accessToken = await AsyncStorage.getItem('accessToken');
      
      // Fetch followers
      const followersResponse = await fetch(`${base_url}/follow/getFollowers/${storedUser._id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
       console.log(followersResponse.error);
      
      // Fetch following
      const followingResponse = await fetch(`${base_url}/follow/getFollowing/${storedUser._id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      } );
      console.log(followingResponse.error);

      // if (!followersResponse.ok || !followingResponse.ok) {
      //   throw new Error('Failed to fetch follow data');
      // }

      const followersData = await followersResponse.json();
      const followingData = await followingResponse.json();
      
      console.log('Followers data:', followersData);
      console.log('Following data:', followingData);

      // Extract the actual arrays from the nested response
      setFollowers(followersData.followers || []);
      setFollowing(followingData.following || []);
    } catch (error) {
      console.error('Error fetching follow data:', error);
      // Set empty arrays in case of error
      setFollowers([]);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => navigation.navigate('DummyScreen', { userId: item._id })}
    >
      <Image 
        source={item.profileImage ? { uri: item.profileImage } : require('../../assets/profileimage.jpg')} 
        style={styles.userImage} 
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName || 'User'}</Text>
        <Text style={styles.userHandle}>{item.userName || '@user'}</Text>
      </View>
      <FollowButton userId={item._id} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.btncolor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeTab === 'Followers' ? 'Followers' : 'Following'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Followers' && styles.activeTab]}
          onPress={() => setActiveTab('Followers')}
        >
          <Text style={[styles.tabText, activeTab === 'Followers' && styles.activeTabText]}>
            Followers ({followers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Following' && styles.activeTab]}
          onPress={() => setActiveTab('Following')}
        >
          <Text style={[styles.tabText, activeTab === 'Following' && styles.activeTabText]}>
            Following ({following.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={activeTab === 'Followers' ? followers : following}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {activeTab === 'Followers' 
              ? 'No followers yet' 
              : 'Not following anyone yet'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.btncolor,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: colors.btncolor,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingVertical: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userHandle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.btncolor,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontSize: 16,
  },
});

export default FollowersList;