import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity,
  Image, 
  Alert, 
  StyleSheet,
  Button,
  Modal,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SkeletonLoader from '../Loader/SkeletonLoader';
import { base_url } from '../../utils/base_url';
import InstaStory from 'react-native-insta-story';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { markStorySeen } from '../../redux/reducers/storiesReducer';

const { width } = Dimensions.get('window');

const Stories = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const seenStories = useSelector(state => state.stories?.seenStories || {});
  const [image, setImage] = useState(null);
  const [storyInfo, setStoryInfo] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState();
  const [showStories, setShowStories] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyTimer, setStoryTimer] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [myStories, setMyStories] = useState([]);
  const [mediaType, setMediaType] = useState(null);
  const [stories, setStories] = useState([]);
  const STORY_DURATION = 10000; // 10 seconds for images
  const VIDEO_DURATION = 30000; // 30 seconds for videos
  const PROGRESS_INTERVAL = 100;

  const loadUserId = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      const parsedUser = user ? JSON.parse(user) : null;

      if (parsedUser && parsedUser._id) {
        setUserId(parsedUser._id);
      } else {
        console.error('User not found or user ID is missing');
      }
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${base_url}/story/list`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      const data = await response.json();
      
      if (data.status) {
        // Get current user ID
        const user = await AsyncStorage.getItem('user');
        const currentUserId = user ? JSON.parse(user)._id : null;

        // Separate stories into user's stories and other stories
        const userStories = [];
        const otherStories = [];

        data.data.stories.forEach(userStory => {
          const transformedStory = {
            user_id: userStory.userId,
            user_image: userStory.stories[0]?.thumbnailUrl || 'https://via.placeholder.com/150',
            user_name: userStory.userName,
            stories: userStory.stories.map(story => ({
              story_id: story._id || Date.now(),
              story_image: story.videoUrl,
              swipeText: story.description,
              onPress: () => console.log('story swiped'),
              viewsCount: story.viewsCount,
              likesCount: story.likesCount,
              commentsCount: story.commentsCount,
              createdAt: story.createdAt
            }))
          };
         console.log(currentUserId)
          // Check if the story belongs to the current user
          if (userStory.userId === currentUserId) {
            userStories.push(transformedStory);
          } else {
            otherStories.push(transformedStory);
          }
        });

        // Set user's stories for create page
        setMyStories(userStories);
        // Set other users' stories for story circle
        setStories(otherStories);
      } else {
        setError(data.message || 'Failed to fetch stories');
      }
    } catch (error) {
      setError('Error fetching stories: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (showStories && selectedUser) {
      startStoryTimer();
    }
    return () => {
      if (storyTimer) {
        clearTimeout(storyTimer);
      }
    };
  }, [showStories, currentStoryIndex]);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "You need to allow access to photos to upload media.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        await uploadStory(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "You need to allow access to camera to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        await uploadStory(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const getStoryDuration = (mediaType) => {
    return mediaType === 'video' ? VIDEO_DURATION : STORY_DURATION;
  };

  const startStoryTimer = () => {
    if (storyTimer) {
      clearInterval(storyTimer);
    }
    setProgress(0);

    if (!selectedUser || !selectedUser.stories || !selectedUser.stories[currentStoryIndex]) {
      console.warn('No story available to display');
      return;
    }

    const currentStory = selectedUser.stories[currentStoryIndex];
    const duration = currentStory.mediaType === 'video' ? VIDEO_DURATION : STORY_DURATION;

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(timer);
        handleNextStory();
      }
    }, PROGRESS_INTERVAL);

    setStoryTimer(timer);
  };

  const uploadStory = async (mediaAsset) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      // Create form data
      const uploadFormData = new FormData();
      const fileUri = mediaAsset.uri.replace('file://', '');
      
      // Get file extension and set appropriate MIME type
      const fileExtension = fileUri.split('.').pop().toLowerCase();
      const isVideo = mediaAsset.type?.includes('video');
      const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
      
      // Create file object for upload
      uploadFormData.append('mediaFile', {
        uri: mediaAsset.uri,
        type: mimeType,
        name: `story.${fileExtension}`
      });

      // Upload the media file
      const uploadResponse = await fetch(`${base_url}/uploadFile?mediaType=story`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: uploadFormData,
      });

      const uploadResponseData = await uploadResponse.json();

      if (!uploadResponseData.status || !uploadResponseData.urls || !uploadResponseData.urls[0]) {
        throw new Error('Failed to upload media file');
      }

      // Create the story with the uploaded file URL
      const storyData = {
        title: "My Story",
        description: "Check out my story!",
        videoUrl: uploadResponseData.urls[0],
        thumbnailUrl: uploadResponseData.urls[0],
        mediaType: isVideo ? 'video' : 'image',
        duration: isVideo ? VIDEO_DURATION : 0,
        tags: []
      };

      const response = await fetch(`${base_url}/story/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Story uploaded successfully:', data.data);
        alert('Story uploaded successfully');
        fetchStories();
        setShowImagePickerModal(false);
      } else {
        throw new Error(data.message || 'Failed to create story');
      }
    } catch (error) {
      console.error('Error uploading story:', error);
      Alert.alert('Error', 'Failed to upload story. Please try again.');
    }
  };

  const isStorySeen = (userId, storyId) => {
    return seenStories[userId]?.includes(storyId) || false;
  };

  const markStoryAsSeen = async (userId, storyId) => {
    if (!isStorySeen(userId, storyId)) {
      dispatch(markStorySeen({ userId, storyId }));
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        await fetch(`${base_url}/story/mark-seen`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ storyIds: [storyId] }),
        });
      } catch (error) {
        console.error('Error marking story as seen:', error);
      }
    }
  };

  const handleStoryPress = (user) => {
    if (!user || !user.stories || user.stories.length === 0) return;
    
    setSelectedUser(user);
    setCurrentStoryIndex(0);
    setProgress(0);
    setShowStories(true);
  };

  const handleNextStory = () => {
    if (selectedUser && selectedUser.stories) {
      if (currentStoryIndex < selectedUser.stories.length - 1) {
        const currentStory = selectedUser.stories[currentStoryIndex];
        markStoryAsSeen(selectedUser.user_id, currentStory.story_id);
        setCurrentStoryIndex(currentStoryIndex + 1);
        setProgress(0);
      } else {
        const currentStory = selectedUser.stories[currentStoryIndex];
        markStoryAsSeen(selectedUser.user_id, currentStory.story_id);
        setShowStories(false);
        setSelectedUser(null);
        setCurrentStoryIndex(0);
        setProgress(0);
      }
    }
  };

  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  };

  const renderStoryContent = () => {
    if (!selectedUser || !selectedUser.stories || !selectedUser.stories[currentStoryIndex]) return null;

    const currentStory = selectedUser.stories[currentStoryIndex];
    const isVideo = currentStory.mediaType === 'video';

    return (
      <View style={styles.storyContentContainer}>
        {isVideo ? (
          <Video
            source={{ uri: currentStory.story_image }}
            style={styles.storyMedia}
            resizeMode="cover"
            shouldPlay
            isLooping={false}
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                handleNextStory();
              }
            }}
            onLoad={(data) => {
              // Ensure video doesn't exceed 30 seconds
              if (data.durationMillis > VIDEO_DURATION) {
                // You might want to implement video trimming here
                console.log('Video exceeds 30 seconds');
              }
            }}
          />
        ) : (
          <Image
            source={{ uri: currentStory.story_image }}
            style={styles.storyMedia}
            resizeMode="cover"
            onLoadStart={() => {
              // Reset progress when new image starts loading
              setProgress(0);
            }}
          />
        )}
        <View style={styles.storyHeader}>
          <View style={styles.storyUserInfo}>
            <Image
              source={{ uri: selectedUser.user_image }}
              style={styles.storyUserImage}
            />
            <Text style={styles.storyUserName}>{selectedUser.user_name}</Text>
          </View>
          <TouchableOpacity onPress={() => {
            if (storyTimer) {
              clearInterval(storyTimer);
            }
            setShowStories(false);
          }}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.storyProgress}>
          {selectedUser.stories.map((story, index) => (
            <View
              key={index}
              style={[
                styles.progressBar,
                index === currentStoryIndex && styles.progressBarActive,
                index < currentStoryIndex && styles.progressBarCompleted
              ]}
            >
              {index === currentStoryIndex && (
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${progress}%` }
                  ]}
                />
              )}
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.storyTouchArea, styles.storyLeftArea]}
          onPress={() => {
            if (storyTimer) {
              clearInterval(storyTimer);
            }
            handlePreviousStory();
          }}
        />
        <TouchableOpacity
          style={[styles.storyTouchArea, styles.storyRightArea]}
          onPress={() => {
            if (storyTimer) {
              clearInterval(storyTimer);
            }
            handleNextStory();
          }}
        />
      </View>
    );
  };

  const renderStoryItem = ({ item }) => {
    const hasStories = item.stories && item.stories.length > 0;
    const isSeen = hasStories && item.stories.every(story => 
      isStorySeen(item.user_id, story.story_id)
    );
    
    return (
      <TouchableOpacity 
        onPress={() => hasStories && handleStoryPress(item)}
        style={styles.storyItemContainer}
      >
        <View style={[
          styles.storyCircle,
          !hasStories && styles.disabledStoryCircle,
          isSeen && styles.seenStoryCircle
        ]}>
          <Image
            source={{ uri: item.user_image }}
            style={styles.storyImage}
          />
        </View>
        <Text style={[
          styles.storyName,
          isSeen && styles.seenStoryName
        ]}>{item.user_name}</Text>
      </TouchableOpacity>
    );
  };

  const renderYourStory = () => {
    const hasStories = myStories.length > 0;
    return (
      <TouchableOpacity 
        style={styles.yourStoryContainer}
        onPress={() => {
          if (hasStories) {
            setSelectedUser(myStories[0]);
            setShowStories(true);
          } else {
            setShowImagePickerModal(true);
          }
        }}
      >
        <View style={[
          styles.storyCircle,
          !hasStories && styles.emptyStoryCircle
        ]}>
          {hasStories ? (
            <Image
              source={{ uri: myStories[0]?.user_image || 'https://via.placeholder.com/150' }}
              style={styles.storyImage}
            />
          ) : (
            <View style={styles.emptyStoryContent}>
              <Ionicons name="add" size={24} color="#666" />
            </View>
          )}
          {hasStories && (
            <TouchableOpacity 
              style={styles.addIconContainer}
              onPress={(e) => {
                e.stopPropagation();
                setShowImagePickerModal(true);
              }}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[
          styles.storyUsername,
          !hasStories && styles.emptyStoryUsername
        ]}>Your Story</Text>
      </TouchableOpacity>
    );
  };

  const renderImagePickerModal = () => (
    <Modal
      visible={showImagePickerModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowImagePickerModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={takePhoto}
          >
            <Ionicons name="camera" size={24} color="#000" />
            <Text style={styles.modalButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={pickImage}
          >
            <Ionicons name="image" size={24} color="#000" />
            <Text style={styles.modalButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setShowImagePickerModal(false)}
          >
            <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              setStoryInfo([]);
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isLoading) {
      return (
        <SkeletonLoader
          count={6}
          circleSize={68}
          textWidth={40}
          textHeight={10}
          containerStyle={styles.skeletonContainer}
        />
      );
    }

    return (
      <View style={styles.container}>
        {renderImagePickerModal()}
        <View style={styles.storiesContainer}>
          <View style={styles.storiesLeftSection}>
            {renderYourStory()}
          </View>
          <View style={styles.storiesRightSection}>
            {stories.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.storyItemContainer}
                onPress={() => handleStoryPress(item)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.storyCircle,
                  !item.stories?.length && styles.disabledStoryCircle
                ]}>
                  <Image
                    source={{ uri: item.user_image }}
                    style={styles.storyImage}
                  />
                </View>
                <Text style={styles.storyName}>{item.user_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Modal
          visible={showStories}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStories(false)}
        >
          {renderStoryContent()}
        </Modal>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  storiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  storyItemContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  storyCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  storyImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  storyName: {
    textAlign: 'center',
    fontSize: 10,
    color: '#000',
  },
  seenStoryName: {
    color: '#666',
  },
  addStoryButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderWidth: 1.8,
    borderRadius: 100,
    borderColor: '#c13584',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },
  addIcon: {
    fontSize: 20,
    color: '#c13584',
  },
  closeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  textContainer: {
    padding: 10,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  profileName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instaStory: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  retryButton: {
    padding: 10,
    backgroundColor: '#870E6B',
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
  },
  skeletonContainer: {
    paddingHorizontal: 8,
  },
  disabledStoryCircle: {
    opacity: 0.5,
    borderColor: '#ccc',
  },
  yourStoryContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  storyCircleActive: {
    borderColor: '#3897f0',
  },
  storyUsername: {
    fontSize: 12,
    color: '#000',
  },
  addIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#a60f93',
    borderRadius: 100,
    padding: 0.1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalButtonText: {
    marginLeft: 10,
    fontSize: 16,
  },
  cancelButton: {
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#ff0000',
  },
  storiesContainer: {
    flexDirection: 'row',
    padding: 10,
  },
  storiesLeftSection: {
    marginRight: 15,
  },
  storiesRightSection: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  storyVideo: {
    width: '100%',
    height: '100%',
  },
  storyThumbnail: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 2,
  },
  emptyStoryCircle: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
  },
  emptyStoryContent: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  emptyStoryUsername: {
    color: '#666',
  },
  modalStoryContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  shareButton: {
    padding: 10,
  },
  closeButton: {
    padding: 10,
  },
  storyText: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  storyViewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyContentContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyMedia: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  storyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    zIndex: 1,
  },
  storyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  storyUserName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  storyProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 10,
    zIndex: 1,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
    overflow: 'hidden',
  },
  progressBarActive: {
    backgroundColor: '#fff',
  },
  progressBarCompleted: {
    backgroundColor: '#fff',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    position: 'absolute',
    left: 0,
    top: 0,
    transition: 'width 0.1s linear',
  },
  storyTouchArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
  },
  storyLeftArea: {
    left: 0,
  },
  storyRightArea: {
    right: 0,
  },
  seenStoryCircle: {
    borderColor: '#666',
    opacity: 0.7,
  },
});

export default Stories;
