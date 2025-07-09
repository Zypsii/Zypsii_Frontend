import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, FlatList, Dimensions, Modal, ActivityIndicator ,Alert} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionic from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url, socket_url } from '../../utils/base_url';
import FollowButton from '../Follow/FollowButton';
import io from 'socket.io-client';
import Toast from '../Toast/Toast';
const { width } = Dimensions.get('window');

const Post = ({ item, isFromProfile, onDelete, isVisible }) => {
  const [like, setLike] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likesCount || 0);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const socketRef = useRef(null);
  const isRoomJoined = useRef(false);
  const isCommentRoomJoined = useRef(false);
  const [isLiking, setIsLiking] = useState(false);
  const [shareCount, setShareCount] = useState(item.shareCount || 0);
  const isShareRoomJoined = useRef(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem('user');
        if (userId) {
          const userData = JSON.parse(userId);
          setCurrentUserId(userData._id);
          // Check like status after getting user ID
          checkLikeStatus();
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };
    getCurrentUserId();
    console.log(item)

    // Initialize socket connection if not already connected
    if (!socketRef.current) {
      socketRef.current = io(socket_url);

      // Wait for socket to connect before setting up listeners
      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current.id);
        setupSocketListeners();
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }

    return () => {
      if (socketRef.current) {
        if (isRoomJoined.current) {
          leaveLikeRoom();
        }
        if (isCommentRoomJoined.current) {
          leaveCommentRoom();
        }
        if (isShareRoomJoined.current) {
          leaveShareRoom();
        }
        // Remove all listeners
        socketRef.current.removeAllListeners();
      }
    };
  }, []);

  // Handle post visibility changes
  useEffect(() => {
    if (isVisible && !isRoomJoined.current) {
      joinLikeRoom();
      checkLikeStatus();
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

  // Setup socket listeners
  const setupSocketListeners = () => {
    if (!socketRef.current) return;

    // Like-related listeners
    socketRef.current.on('join-like-room-status', (data) => {
      console.log(`Post ${item._id} - Join room status:`, data);
      if (data.moduleId === item._id) {
        isRoomJoined.current = true;
        requestLikeCount();
      }
    });

    socketRef.current.on('leave-like-room-status', (data) => {
      console.log(`Post ${item._id} - Leave room status:`, data);
      if (data.moduleId === item._id) {
        isRoomJoined.current = false;
      }
    });

    socketRef.current.on('like-count-status', (data) => {
      if (data.moduleId === item._id) {
        console.log(`Post ${item._id} - Like count updated:`, data.likeCount);
        setLikeCount(data.likeCount);
      }
    });

    socketRef.current.on('like-status', (data) => {
      if (data.moduleId === item._id) {
        console.log(`Post ${item._id} - Like status response:`, data);
        if (data.liked !== undefined) {
          setLike(data.liked);
        } else if (data.message) {
          if (data.message.includes('liked')) {
            setLike(true);
          } else if (data.message.includes('unliked')) {
            setLike(false);
          }
        }
        setIsLiking(false);
        requestLikeCount();
      }
    });

    // Comment-related listeners
    socketRef.current.on('join-comment-room-status', (data) => {
      console.log('Joined comment room:', data);
      isCommentRoomJoined.current = true;
    });

    socketRef.current.on('leave-comment-room-status', (data) => {
      console.log('Left comment room:', data);
      isCommentRoomJoined.current = false;
    });

    socketRef.current.on('comment-status', (data) => {
      console.log('Received comment status:', data);
      if (data.comment) {
        setComments(prevComments => [data.comment, ...prevComments]);
        setCommentText('');
        setIsCommenting(false);
      }
    });

    socketRef.current.on('comment-list', (data) => {
      console.log('Comment list received:', data);
      if (data.comments) {
        setComments(data.comments);
      }
    });

    socketRef.current.on('comment-error', (error) => {
      console.error('Comment error:', error);
      setIsCommenting(false);
      showToast('Failed to add comment', 'error');
    });

    socketRef.current.on('comment-deleted', (data) => {
      console.log('Comment deleted:', data);
      // Refresh the comment list after successful deletion
      handleListComments();
    });

    socketRef.current.on('comment-delete-error', (error) => {
      console.error('Comment delete error:', error);
      showToast('Failed to delete comment', 'error');
    });

    // Share-related listeners
    socketRef.current.on('join-share-room-status', (data) => {
      console.log(`Post ${item._id} - Join share room status:`, data);
      if (data.moduleId === item._id) {
        isShareRoomJoined.current = true;
        requestShareCount();
      }
    });

    socketRef.current.on('leave-share-room-status', (data) => {
      console.log(`Post ${item._id} - Leave share room status:`, data);
      if (data.moduleId === item._id) {
        isShareRoomJoined.current = false;
      }
    });

    socketRef.current.on('share-count', (data) => {
      if (data.moduleId === item._id) {
        console.log(`Post ${item._id} - Share count updated:`, data.count);
        setShareCount(data.count);
      }
    });

    socketRef.current.on('share-count-status', (data) => {
      if (data.moduleId === item._id) {
        console.log(`Post ${item._id} - Share count status updated:`, data.count);
        setShareCount(data.count);
      }
    });

    socketRef.current.on('share-error', (error) => {
      console.error('Share error:', error);
      showToast('Failed to share post', 'error');
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

  const joinCommentRoom = () => {
    if (socketRef.current && !isCommentRoomJoined.current) {
      console.log(`Post ${item._id} - Joining comment room`);
      socketRef.current.emit('join-comment-room', {
        moduleId: item._id,
        moduleType: 'post'
      });
    }
  };

  const leaveCommentRoom = () => {
    if (socketRef.current && isCommentRoomJoined.current) {
      console.log(`Post ${item._id} - Leaving comment room`);
      socketRef.current.emit('leave-comment-room', {
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
      showToast('Please login to like posts', 'error');
      return;
    }

    if (isLiking) {
      return;
    }

    try {
      setIsLiking(true);
      
      // Optimistic update - immediately update the UI
      const newLikeState = !like;
      setLike(newLikeState);
      setLikeCount(prevCount => newLikeState ? prevCount + 1 : prevCount - 1);

      if (like) {
        socketRef.current.emit('unlike', {
          likedBy: currentUserId,
          moduleType: 'post',
          moduleId: item._id,
          moduleCreatedBy: item.createdBy
        });
      } else {
        socketRef.current.emit('like', {
          likedBy: currentUserId,
          moduleType: 'post',
          moduleId: item._id,
          moduleCreatedBy: item.createdBy
        });
      }

      // Call checkLikeStatus after a short delay to ensure the backend has processed the action
      setTimeout(() => {
        checkLikeStatus();
      }, 500);

    } catch (error) {
      console.error('Like/Unlike Error:', error);
      showToast('Network error. Please check your connection and try again.', 'error');
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
        showToast('Authentication token not found', 'error');
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
        showToast('Post deleted successfully', 'success');
        if (isFromProfile) {
          if (typeof onDelete === 'function') {
            onDelete(item.id);
          }
        }
      } else {
        showToast(data.message || 'Failed to delete post', 'error');
      }
    } catch (error) {
      console.error('Delete Error:', error);
      showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // const handleSavePost = async () => {
  //   try {
  //     const token = await AsyncStorage.getItem('accessToken');

  //     if (!token) {
  //       Alert.alert('Error', 'Authentication token not found');
  //       return;
  //     }

  //     const response = await fetch(`${base_url}/post/save/${item._id}`, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     const data = await response.json();
  //     console.log(data)

  //     if (response.ok && data.status) {
  //       setIsSaved(!isSaved);
  //       Alert.alert('Success', isSaved ? 'Post unsaved successfully' : 'Post saved successfully');
  //     } else {
  //       Alert.alert('Error', data.message || 'Failed to save post');
  //     }
  //   } catch (error) {
  //     console.error('Save Error:', error);
  //     Alert.alert('Error', 'Network error. Please check your connection and try again.');
  //   }
  // };

  // const renderImage = ({ item: imageUrl }) => {
  //   let processedUrl = imageUrl;

  //   try {
  //     // If the URL is a stringified array
  //     if (typeof imageUrl === 'string' && imageUrl.startsWith('[')) {
  //       const parsedUrls = JSON.parse(imageUrl);
  //       processedUrl = parsedUrls[0];
  //     }

  //     // Clean up the URL
  //     if (processedUrl.startsWith('/data/')) {
  //       processedUrl = `file://${processedUrl}`;
  //     } else if (processedUrl.includes('file:///data/')) {
  //       processedUrl = processedUrl.replace('file:///', 'file://');
  //     }

  //     console.log('Processed URL:', processedUrl);
  //   } catch (e) {
  //     console.log('Error processing URL:', e);
  //     processedUrl = imageUrl;
  //   }

  //   return (
  //     <View style={styles.postImageContainer}>
  //       <Image
  //         source={{ uri: processedUrl }}
  //         style={styles.postImage}
  //         resizeMode="cover"
  //       />
  //     </View>
  //   );
  // };

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
  const hasImages = (item.mediaType === 'image' || item.imageUrl) && item.imageUrl && item.imageUrl.length > 0;
  const isSingleImage = hasImages && item.imageUrl.length === 1;

  // Defensive check for first image URL (now using imageUrl)
  const firstImageUrl =
    Array.isArray(item.imageUrl) && item.imageUrl.length > 0 && typeof item.imageUrl[0] === 'string' && item.imageUrl[0].trim() !== ''
      ? item.imageUrl[0]
      : null;

  // Handle comment modal visibility
  useEffect(() => {
    if (showCommentModal) {
      joinCommentRoom();
      // Load comments when modal opens with a slight delay
      setTimeout(() => {
        handleListComments();
      }, 300);
    } else {
      leaveCommentRoom();
    }
  }, [showCommentModal]);

  // Function to handle comment deletion (add this new function)
  const handleDeleteComment = (commentId) => {
    if (!currentUserId) {
      showToast('Please login to delete comments', 'error');
      return;
    }

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            socketRef.current.emit('delete-comment', {
              commentId,
              commentedBy: currentUserId
            });
          }
        }
      ]
    );
  };

  // Updated comment submission handler
  const handleCommentSubmit = async () => {
    if (!currentUserId) {
      showToast('Please login to comment', 'error');
      return;
    }

    if (!commentText.trim()) {
      showToast('Comment cannot be empty', 'error');
      return;
    }

    if (isCommenting) {
      return;
    }

    try {
      setIsCommenting(true);
      console.log('Submitting comment for post:', item._id);

      const commentPayload = {
        moduleId: item._id,
        moduleType: 'post',
        moduleCreatedBy: item.createdBy,
        commentedBy: currentUserId,
        commentDataValue: commentText.trim()
      };

      socketRef.current.emit('comment', commentPayload);

      setTimeout(() => {
        if (isCommenting) {
          setIsCommenting(false);
          showToast('Comment submission timed out. Please try again.', 'error');
        }
      }, 5000);

    } catch (error) {
      console.error('Error submitting comment:', error);
      setIsCommenting(false);
      showToast('Failed to submit comment. Please try again.', 'error');
    }
  };

  // Updated comment item render (modify the FlatList renderItem in your JSX)
  const renderCommentItem = ({ item: comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUserInfo}>
          <Image
            source={{
              uri: comment.commentedBy?.profilePicture || 'https://via.placeholder.com/40'
            }}
            style={styles.commentUserImage}
          />
          <View style={styles.commentUserDetails}>
            <Text style={styles.commentUser}>
              {comment.commentedBy?.fullName || comment.commentedBy?.username}
            </Text>
            <Text style={styles.commentDate}>
              {formatDate(comment.createdAt)}
            </Text>
          </View>
        </View>
        {comment.commentedBy?._id === currentUserId && (
          <TouchableOpacity
            onPress={() => handleDeleteComment(comment._id)}
            style={styles.deleteCommentButton}
          >
            <Feather name="trash-2" size={16} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.commentText}>{comment.commentData}</Text>
    </View>
  );

  // Updated comment list handler
  const handleListComments = () => {
    if (socketRef.current && item._id) {
      console.log('Requesting comments for post:', item._id);
      socketRef.current.emit('list-comment', {
        moduleId: item._id,
        moduleType: 'post'
      });
    }
  };

  // Add fetchFollowers function
  const fetchFollowers = async () => {
    try {
      setIsLoadingFollowers(true);
      const token = await AsyncStorage.getItem('accessToken');

      if (!token) {
        showToast('Authentication token not found', 'error');
        return;
      }

      const response = await fetch(`${base_url}/follow/getFollowers/${currentUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.status) {
        setFollowers(data.followers);
      } else {
        showToast(data.message || 'Failed to fetch followers', 'error');
      }
    } catch (error) {
      console.error('Fetch Followers Error:', error);
      showToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  // Add handleShare function
  const handleShare = async () => {
    if (!currentUserId) {
      showToast('Please login to share posts', 'error');
      return;
    }
    setShowShareModal(true);
    await fetchFollowers();
    joinShareRoom();
  };

  // Add joinShareRoom function
  const joinShareRoom = () => {
    if (socketRef.current && !isShareRoomJoined.current) {
      console.log(`Post ${item._id} - Joining share room`);
      socketRef.current.emit('join-share-room', {
        moduleId: item._id,
        moduleType: 'post',
        senderId: currentUserId,
        receiverId: item.createdBy
      });
    }
  };

  // Add leaveShareRoom function
  const leaveShareRoom = () => {
    if (socketRef.current && isShareRoomJoined.current) {
      console.log(`Post ${item._id} - Leaving share room`);
      socketRef.current.emit('leave-share-room', {
        moduleId: item._id,
        moduleType: 'post',
        senderId: currentUserId,
        receiverId: item.createdBy
      });
    }
  };

  // Add requestShareCount function
  const requestShareCount = () => {
    if (socketRef.current) {
      console.log(`Post ${item._id} - Requesting share count`);
      socketRef.current.emit('share-count', {
        moduleId: item._id,
        moduleType: 'post'
      });
    }
  };

  // Add handleShareWithFollower function
  const handleShareWithFollower = (follower) => {
    if (!currentUserId) {
      showToast('Please login to share posts', 'error');
      return;
    }

    socketRef.current.emit('share', {
      moduleId: item._id,
      moduleType: 'post',
      moduleCreatedBy: item.createdBy,
      senderId: currentUserId,
      receiverId: follower._id
    });

    setShowShareModal(false);
    showToast('Post shared successfully', 'success');
  };

  // Add renderFollowerItem function
  const renderFollowerItem = ({ item: follower }) => (
    <TouchableOpacity
      style={styles.followerItem}
      onPress={() => handleShareWithFollower(follower)}
    >
      <Image
        source={{
          uri: follower.profilePicture || 'https://via.placeholder.com/50'
        }}
        style={styles.followerImage}
      />
      <View style={styles.followerInfo}>
        <Text style={styles.followerName}>{follower.fullName}</Text>
        <Text style={styles.followerUsername}>{follower.userName}</Text>
      </View>
    </TouchableOpacity>
  );
 
  const checkLikeStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${base_url}/like-status?moduleType=post&moduleId=${item._id}&moduleCreatedBy=${item.createdBy}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
   
      const data = await response.json();
      
      if (response.ok && data.success) {
        setLike(data.data.liked);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  // Log the URL before rendering
  return (
    <View style={styles.postContainer}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
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
      {hasImages && firstImageUrl && (
        <TouchableOpacity
          style={styles.postImageContainer}
          onPress={() => setShowFullImage(true)}
        >
          <Image
            source={{ uri: firstImageUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
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
          <TouchableOpacity onPress={() => setShowCommentModal(true)}>
            <Ionic name="chatbubble-outline" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Feather name="navigation" style={styles.icon} />
          </TouchableOpacity>
        </View>
        {/* <TouchableOpacity onPress={handleSavePost}>
          <Feather 
            name="bookmark"
            style={[styles.bookmarkIcon, { color: isSaved ? '#ff3873' : '#000' }]} 
          />
        </TouchableOpacity> */}
      </View>

      <View style={styles.likesContainer}>
        <Text style={styles.statsText}>
          {likeCount} likes • {item.commentsCount} comments • {shareCount} shares
        </Text>
        {/* {item.tags && item.tags.length > 0 && (
          <Text style={styles.tagsText}>
            Tags: {item.tags.join(', ')}
          </Text>
        )} */}
      </View>

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowCommentModal(false)}
          />
          <View style={styles.commentModalContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.commentModalContent}>
              <View style={styles.commentInputContainer}>
                <TextInput
                  placeholder="Add a comment..."
                  style={styles.commentInput}
                  multiline
                  value={commentText}
                  onChangeText={setCommentText}
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.commentSubmitButton,
                    { opacity: commentText.trim() ? 1 : 0.5 }
                  ]}
                  onPress={handleCommentSubmit}
                  disabled={isCommenting || !commentText.trim()}
                >
                  <Text style={styles.commentSubmitText}>
                    {isCommenting ? 'Posting...' : 'Post'}
                  </Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={comments}
                keyExtractor={(comment, index) => comment._id || index.toString()}
                renderItem={renderCommentItem}
                style={styles.commentsList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </View>
      </Modal>

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

      {/* Full Screen Image Modal */}
      <Modal
        visible={showFullImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFullImage(false)}
          >
            <Ionic name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: firstImageUrl }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowShareModal(false);
          leaveShareRoom();
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowShareModal(false);
              leaveShareRoom();
            }}
          />
          <View style={styles.shareModalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.shareModalTitle}>Share with followers</Text>
            {isLoadingFollowers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff3873" />
              </View>
            ) : (
              <FlatList
                data={followers}
                keyExtractor={(item) => item._id}
                renderItem={renderFollowerItem}
                style={styles.followersList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
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
  commentModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: '60%',
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  commentModalContent: {
    flex: 1,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  commentSubmitButton: {
    backgroundColor: '#ff3873',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  commentSubmitText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentsList: {
    flex: 1,
  },
  commentItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  commentText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 50, // Align with the comment text after the profile image
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  deleteCommentButton: {
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  shareModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: '60%',
    maxHeight: '80%',
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followersList: {
    flex: 1,
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  followerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  followerInfo: {
    flex: 1,
  },
  followerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  followerUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default Post;