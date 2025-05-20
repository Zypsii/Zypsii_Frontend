import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, FlatList, Dimensions, Modal, Alert } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionic from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';
import FollowButton from '../Follow/FollowButton';

const { width } = Dimensions.get('window');

const Post = ({ item, isFromProfile }) => {
  const [like, setLike] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setShowMenu(false);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      const response = await fetch(`${base_url}/post/delete/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.status) {
        Alert.alert('Success', 'Post deleted successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Delete Error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderImage = ({ item: imageUrl }) => {
    let processedUrl = imageUrl;
    
    try {
      // If the URL is a stringified array
      if (typeof imageUrl === 'string' && imageUrl.startsWith('[')) {
        const parsedUrls = JSON.parse(imageUrl);
        processedUrl = parsedUrls[0];
      }

      // Clean up the URL
      if (processedUrl.startsWith('/data/')) {
        processedUrl = `file://${processedUrl}`;
      } else if (processedUrl.includes('file:///data/')) {
        processedUrl = processedUrl.replace('file:///', 'file://');
      }

      console.log('Processed URL:', processedUrl);
    } catch (e) {
      console.log('Error processing URL:', e);
      processedUrl = imageUrl;
    }

    return (
      <View style={styles.postImageContainer}>
        <Image
          source={{ uri: processedUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      </View>
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return dateString;
    }
  };

  // Render image directly if only one image, else use FlatList
  const hasImages = item.mediaType === 'image' && item.imageUrl && item.imageUrl.length > 0;
  const isSingleImage = hasImages && item.imageUrl.length === 1;

  // Defensive check for first image URL (now using imageUrl)
  const firstImageUrl =
    Array.isArray(item.imageUrl) && item.imageUrl.length > 0 && typeof item.imageUrl[0] === 'string' && item.imageUrl[0].trim() !== ''
      ? item.imageUrl[0]
      : 'https://via.placeholder.com/150';

  // Log the URL before rendering
  return (
    <View style={styles.postContainer}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.postTitle}</Text>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.headerActions}>
          {!isFromProfile && (
            <View style={styles.followButtonContainer}>
              <FollowButton userId={item.createdBy} />
            </View>
          )}
          {isFromProfile && (
            <TouchableOpacity onPress={() => setShowMenu(true)}>
              <Feather name="more-vertical" style={styles.moreIcon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Only render the image if the URL is a non-empty string */}
      {hasImages && firstImageUrl && firstImageUrl !== '' && (
        <View style={styles.postImageContainer}>
          <Image
            source={{ uri: firstImageUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.actionsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={() => setLike(!like)}>
            <AntDesign
              name={like ? 'heart' : 'hearto'}
              style={[styles.likeIcon, { color: like ? 'red' : 'black' }]}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionic name="chatbubble-outline" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Feather name="navigation" style={styles.icon} />
          </TouchableOpacity>
        </View>
        <Feather name="bookmark" style={styles.bookmarkIcon} />
      </View>

      <View style={styles.likesContainer}>
        <Text style={styles.statsText}>
          {item.likesCount} likes • {item.commentsCount} comments • {item.shareCount} shares
        </Text>
        {item.tags && item.tags.length > 0 && (
          <Text style={styles.tagsText}>
            Tags: {item.tags.join(', ')}
          </Text>
        )}
      </View>

      <View style={styles.commentSection}>
        <View style={styles.commentInputContainer}>
          <TextInput
            placeholder="Add a comment"
            style={styles.commentInput}
          />
        </View>
        <View style={styles.emojiContainer}>
          <Entypo name="emoji-happy" style={[styles.emojiIcon, { color: 'lightgreen' }]} />
          <Entypo name="emoji-neutral" style={[styles.emojiIcon, { color: 'pink' }]} />
          <Entypo name="emoji-sad" style={[styles.emojiIcon, { color: 'red' }]} />
        </View>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={[styles.menuItem, styles.deleteMenuItem]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              <Feather name="trash-2" size={20} color="#FF3B30" />
              <Text style={[styles.menuText, styles.deleteMenuText]}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    paddingBottom: 10,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.1,
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  userInfo: {
    flex: 1,
    marginRight: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButtonContainer: {
    marginRight: 10,
  },
  moreIcon: {
    fontSize: 20,
    paddingHorizontal: 5,
  },
  postImageContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 16,
    marginLeft: 0,
    marginRight: 15,
  },
  postImage: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
    borderRadius: 10,
  },
  imageList: {
    width: '100%',
    padding: 0,
    margin: 0,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeIcon: {
    paddingRight: 10,
    fontSize: 20,
  },
  icon: {
    fontSize: 20,
    paddingRight: 10,
  },
  bookmarkIcon: {
    fontSize: 20,
  },
  likesContainer: {
    paddingHorizontal: 15,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  tagsText: {
    fontSize: 14,
    color: '#1e88e5',
    marginTop: 5,
  },
  commentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  commentInputContainer: {
    flex: 1,
    marginRight: 10,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
  },
  emojiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 20,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    width: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  menuText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  deleteMenuItem: {
    marginTop: 5,
  },
  deleteMenuText: {
    color: '#FF3B30',
  },

});

export default Post;
