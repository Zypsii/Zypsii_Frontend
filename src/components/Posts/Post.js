import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, FlatList, Dimensions, Modal, Alert } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionic from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';
import FollowButton from '../Follow/FollowButton';
import io from 'socket.io-client';
import { SOCKET_URL } from '../../config';

const { width } = Dimensions.get('window');

const Post = ({ item, isFromProfile, onDelete, isVisible }) => {
  const [like, setLike] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likesCount || 0);
  const socketRef = useRef(null);
  const isRoomJoined = useRef(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem('user');
        if (userId) {
          const userData = JSON.parse(userId);
          setCurrentUserId(userData._id);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };
    getCurrentUserId();

    // Initialize socket connection if not already connected
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
      console.log('Socket connected:', socketRef.current.id);

      // Set up socket event listeners
      setupSocketListeners();
    }

    return () => {
      if (socketRef.current && isRoomJoined.current) {
        leaveLikeRoom();
      }
    };
  }, []);

  // Handle post visibility changes
  useEffect(() => {
    if (isVisible && !isRoomJoined.current) {
      joinLikeRoom();
    } else if (!isVisible && isRoomJoined.current) {
      leaveLikeRoom();
    }
  }, [isVisible]);

  // Check like status when component mounts or becomes visible
  useEffect(() => {
    if (isVisible && socketRef.current && currentUserId) {
      console.log(`Post ${item._id} - Checking initial like status`);
      socketRef.current.emit('check-like-status', {
        moduleId: item._id,
        moduleType: 'post',
        userId: currentUserId
      });
    }
  }, [isVisible, currentUserId]);

  const setupSocketListeners = () => {
    // Listen for join-like-room-status
    socketRef.current.on('join-like-room-status', (data) => {
      console.log(`Post ${item._id} - Join room status:`, data);
      if (data.moduleId === item._id) {
        isRoomJoined.current = true;
        // Request initial like count after joining room
        requestLikeCount();
      }
    });

    // Listen for leave-like-room-status
    socketRef.current.on('leave-like-room-status', (data) => {
      console.log(`Post ${item._id} - Leave room status:`, data);
      if (data.moduleId === item._id) {
        isRoomJoined.current = false;
      }
    });

    // Listen for like-count-status
    socketRef.current.on('like-count-status', (data) => {
      if (data.moduleId === item._id) {
        console.log(`Post ${item._id} - Like count updated:`, data.likeCount);
        setLikeCount(data.likeCount);
      }
    });

    // Listen for like-status
    socketRef.current.on('like-status', (data) => {
      if (data.moduleId === item._id) {
        console.log(`Post ${item._id} - Like status response:`, data);
        if (data.liked !== undefined) {
          setLike(data.liked);
        } else if (data.message) {
          // Handle like/unlike action response
          if (data.message.includes('liked')) {
            setLike(true);
          } else if (data.message.includes('unliked')) {
            setLike(false);
          }
        }
        setIsLiking(false);
        // Request updated like count
        requestLikeCount();
      }
    });

    // Listen for like-count-error
    socketRef.current.on('like-count-error', (error) => {
      console.error(`Post ${item._id} - Like count error:`, error);
      Alert.alert('Error', 'Failed to update like count');
      setIsLiking(false);
    });

    // Listen for like-status-error
    socketRef.current.on('like-status-error', (error) => {
      console.error(`Post ${item._id} - Like status error:`, error);
      Alert.alert('Error', 'Failed to check like status');
      setIsLiking(false);
    });

    // Listen for like-error
    socketRef.current.on('like-error', (error) => {
      console.error(`Post ${item._id} - Like error:`, error);
      Alert.alert('Error', 'Failed to like post');
      setIsLiking(false);
      // Revert like state on error
      setLike(!like);
    });

    // Listen for unlike-error
    socketRef.current.on('unlike-error', (error) => {
      console.error(`Post ${item._id} - Unlike error:`, error);
      Alert.alert('Error', 'Failed to unlike post');
      setIsLiking(false);
      // Revert like state on error
      setLike(!like);
    });
  };

  const joinLikeRoom = () => {
    if (socketRef.current && !isRoomJoined.current) {
      console.log(`Post ${item._id} - Joining like room`);
      socketRef.current.emit('join-like-room', {
        moduleId: item._id,
        moduleType: 'post'
      });
    }
  };

  const leaveLikeRoom = () => {
    if (socketRef.current && isRoomJoined.current) {
      console.log(`Post ${item._id} - Leaving like room`);
      socketRef.current.emit('leave-like-room', {
        moduleId: item._id,
        moduleType: 'post'
      });
    }
  };

  const requestLikeCount = () => {
    if (socketRef.current) {
      console.log(`Post ${item._id} - Requesting like count`);
      socketRef.current.emit('like-count', {
        moduleType: 'post',
        moduleId: item._id
      });
    }
  };

  const handleLike = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'Please login to like posts');
      return;
    }

    if (isLiking) {
      return; // Prevent multiple clicks while processing
    }

    try {
      setIsLiking(true);
      
      if (like) {
        // Unlike
        console.log(`Post ${item._id} - Emitting unlike event`);
        socketRef.current.emit('unlike', {
          likedBy: currentUserId,
          moduleType: 'post',
          moduleId: item._id,
          moduleCreatedBy: item.createdBy
        });
      } else {
        // Like
        console.log(`Post ${item._id} - Emitting like event`);
        socketRef.current.emit('like', {
          likedBy: currentUserId,
          moduleType: 'post',
          moduleId: item._id,
          moduleCreatedBy: item.createdBy
        });
      }
    } catch (error) {
      console.error('Like/Unlike Error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
      // Revert optimistic update on error
      setLike(like);
      setLikeCount(prevCount => like ? prevCount + 1 : prevCount - 1);
      setIsLiking(false);
    }
  };

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
        if (isFromProfile) {
          if (typeof onDelete === 'function') {
            onDelete(item.id);
          }
        }
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

  const handleSavePost = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      const response = await fetch(`${base_url}/post/save/${item._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log(data)

      if (response.ok && data.status) {
        setIsSaved(!isSaved);
        Alert.alert('Success', isSaved ? 'Post unsaved successfully' : 'Post saved successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to save post');
      }
    } catch (error) {
      console.error('Save Error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
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
  console.log(currentUserId)

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
          {currentUserId !== item.createdBy && (
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
          <TouchableOpacity 
            onPress={handleLike}
            disabled={isLiking}
          >
            <AntDesign
              name={like ? 'heart' : 'hearto'}
              style={[
                styles.likeIcon, 
                { 
                  color: like ? 'red' : 'black',
                  opacity: isLiking ? 0.5 : 1 
                }
              ]}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionic name="chatbubble-outline" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Feather name="navigation" style={styles.icon} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleSavePost}>
          <Feather 
            name="bookmark"
            style={[styles.bookmarkIcon, { color: isSaved ? '#A60F93' : '#000' }]} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.likesContainer}>
        <Text style={styles.statsText}>
          {likeCount} likes • {item.commentsCount} comments • {item.shareCount} shares
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
    width: width,
    alignSelf: 'center',
    paddingBottom: 10,
    borderBottomColor: 'gray',
    borderBottomWidth: 0.1,
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
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
    marginLeft: 5,
  },
  followButtonContainer: {
    marginRight: 5,
  },
  moreIcon: {
    fontSize: 20,
    paddingHorizontal: 3,
  },
  postImageContainer: {
    width: width,
    alignSelf: 'center',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    //borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  postImage: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
    //borderRadius: 10,
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
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeIcon: {
    paddingRight: 8,
    fontSize: 20,
  },
  icon: {
    fontSize: 20,
    paddingRight: 8,
  },
  bookmarkIcon: {
    fontSize: 20,
    marginLeft: 5,
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
    paddingTop: 8,
  },
  commentInputContainer: {
    flex: 1,
    marginRight: 8,
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
