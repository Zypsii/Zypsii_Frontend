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
  Dimensions,
  ScrollView
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
import { markStorySeen, setSeenStories } from '../../redux/reducers/storiesReducer';

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
      
      // Fetch stories
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

        // Fetch seen stories from API
        const seenResponse = await fetch(`${base_url}/story/seen-stories`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        const seenData = await seenResponse.json();
        let seenStoriesMap = {};
        
        if (seenData.status && seenData.data) {
          // Transform seen stories data into the format we need
          seenStoriesMap = seenData.data.reduce((acc, story) => {
            if (!acc[story.userId]) {
              acc[story.userId] = [];
            }
            acc[story.userId].push(story.storyId);
            return acc;
          }, {});
          
          // Update Redux with seen stories
          dispatch(setSeenStories(seenStoriesMap));
          
          // Save to AsyncStorage
          await AsyncStorage.setItem('seenStories', JSON.stringify(seenStoriesMap));
        }

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
              createdAt: story.createdAt,
              mediaType: story.mediaType || 'image'
            }))
          };

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

  // Load seen stories from AsyncStorage on component mount
  useEffect(() => {
    loadSeenStories();
  }, []);

  const loadSeenStories = async () => {
    try {
      const seenStoriesData = await AsyncStorage.getItem('seenStories');
      if (seenStoriesData) {
        const parsedSeenStories = JSON.parse(seenStoriesData);
        dispatch(setSeenStories(parsedSeenStories));
      }
    } catch (error) {
      console.error('Error loading seen stories:', error);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "You need to allow access to photos to upload media.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        await uploadStory(asset);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media. Please try again.');
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
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        await uploadStory(asset);
      }
    } catch (error) {
      console.error('Error capturing media:', error);
      Alert.alert('Error', 'Failed to capture media. Please try again.');
    }
  };

  const trimVideo = async (videoUri) => {
    try {
      // For now, we'll just return the original video URI
      // The 30-second limit will be enforced during playback
      return videoUri;
    } catch (error) {
      console.error('Error processing video:', error);
      return videoUri;
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
      if (!accessToken) {
        throw new Error('No access token found');
      }

      // Create form data
      const uploadFormData = new FormData();
      let fileUri = mediaAsset.uri;
      
      // Get file extension and set appropriate MIME type
      const fileExtension = fileUri.split('.').pop().toLowerCase();
      const isVideo = mediaAsset.type?.includes('video');
      const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';

      // Create file object for upload
      uploadFormData.append('mediaFile', {
        uri: fileUri,
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

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }

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
        duration: isVideo ? 30 : 0,
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

      if (!response.ok) {
        throw new Error(`Story creation failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (response.ok) {
        console.log('Story uploaded successfully:', data.data);
        Alert.alert('Success', 'Story uploaded successfully');
        fetchStories();
        setShowImagePickerModal(false);
      } else {
        throw new Error(data.message || 'Failed to create story');
      }
    } catch (error) {
      console.error('Error uploading story:', error);
      Alert.alert(
        'Error',
        'Failed to upload story. Please check your internet connection and try again.'
      );
    }
  };

  const isStorySeen = (userId, storyId) => {
    return seenStories[userId]?.includes(storyId) || false;
  };

  const markStoryAsSeen = async (userId, storyId) => {
    if (!isStorySeen(userId, storyId)) {
      try {
        // Update Redux state
        dispatch(markStorySeen({ userId, storyId }));

        // Get current seen stories from Redux
        const currentSeenStories = { ...seenStories };
        
        // Update the seen stories for this user
        if (!currentSeenStories[userId]) {
          currentSeenStories[userId] = [];
        }
        if (!currentSeenStories[userId].includes(storyId)) {
          currentSeenStories[userId].push(storyId);
        }

        // Save to AsyncStorage
        await AsyncStorage.setItem('seenStories', JSON.stringify(currentSeenStories));

        // Update backend
        const accessToken = await AsyncStorage.getItem('accessToken');
        await fetch(`${base_url}/story/mark-seen`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            storyIds: [storyId],
            userId: userId 
          }),
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
    startStoryTimer(); // Start timer immediately when story is opened
  };

  const handleNextStory = () => {
    if (selectedUser && selectedUser.stories) {
      if (currentStoryIndex < selectedUser.stories.length - 1) {
        const currentStory = selectedUser.stories[currentStoryIndex];
        markStoryAsSeen(selectedUser.user_id, currentStory.story_id);
        setCurrentStoryIndex(currentStoryIndex + 1);
        setProgress(0);
      } else {
        // Current user's stories are complete, move to next user
        const currentStory = selectedUser.stories[currentStoryIndex];
        markStoryAsSeen(selectedUser.user_id, currentStory.story_id);
        
        // Find the index of current user in stories array
        const currentUserIndex = stories.findIndex(user => user.user_id === selectedUser.user_id);
        
        if (currentUserIndex < stories.length - 1) {
          // Move to next user's stories
          const nextUser = stories[currentUserIndex + 1];
          setSelectedUser(nextUser);
          setCurrentStoryIndex(0);
          setProgress(0);
        } else {
          // No more users, close the story view
          setShowStories(false);
          setSelectedUser(null);
          setCurrentStoryIndex(0);
          setProgress(0);
        }
      }
    }
  };

  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    } else {
      // Find the index of current user in stories array
      const currentUserIndex = stories.findIndex(user => user.user_id === selectedUser.user_id);
      
      if (currentUserIndex > 0) {
        // Move to previous user's last story
        const previousUser = stories[currentUserIndex - 1];
        setSelectedUser(previousUser);
        setCurrentStoryIndex(previousUser.stories.length - 1);
        setProgress(0);
      }
    }
  };

  const handleDeleteStory = async (storyId) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${base_url}/story/delete/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (data.status) {
        // Remove the story from the local state
        const updatedStories = myStories.map(userStory => {
          if (userStory.user_id === userId) {
            return {
              ...userStory,
              stories: userStory.stories.filter(story => story.story_id !== storyId)
            };
          }
          return userStory;
        });

        setMyStories(updatedStories);

        // If we deleted the last story, close the story view
        if (selectedUser.stories.length === 1) {
          setShowStories(false);
          setSelectedUser(null);
          setCurrentStoryIndex(0);
        } else {
          // Move to the next story or previous story
          if (currentStoryIndex === selectedUser.stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex - 1);
          }
        }

        Alert.alert('Success', 'Story deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete story');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      Alert.alert('Error', 'Failed to delete story. Please try again.');
    }
  };

  const renderStoryContent = () => {
    if (!selectedUser || !selectedUser.stories || !selectedUser.stories[currentStoryIndex]) return null;

    const currentStory = selectedUser.stories[currentStoryIndex];
    const isVideo = currentStory.mediaType === 'video';
    const isMyStory = selectedUser.user_id === userId;

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
              setTimeout(() => {
                handleNextStory();
              }, VIDEO_DURATION);
            }}
          />
        ) : (
          <Image
            source={{ uri: currentStory.story_image }}
            style={styles.storyMedia}
            resizeMode="cover"
            onLoadStart={() => {
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
          <View style={styles.storyHeaderButtons}>
            {isMyStory && (
              <TouchableOpacity 
                onPress={() => handleDeleteStory(currentStory.story_id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => {
                if (storyTimer) {
                  clearInterval(storyTimer);
                }
                setShowStories(false);
                setSelectedUser(null);
                setCurrentStoryIndex(0);
              }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
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
        <View style={styles.storyNavigationContainer}>
          <TouchableOpacity
            style={styles.storyNavigationArea}
            onPress={() => {
              if (storyTimer) {
                clearInterval(storyTimer);
              }
              handlePreviousStory();
            }}
          />
          <TouchableOpacity
            style={styles.storyNavigationArea}
            onPress={() => {
              if (storyTimer) {
                clearInterval(storyTimer);
              }
              handleNextStory();
            }}
          />
        </View>
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
          isSeen && styles.seenStoryCircle,
          !isSeen && hasStories && styles.unseenStoryCircle
        ]}>
          <Image
            source={{ uri: item.user_image }}
            style={styles.storyImage}
          />
        </View>
        <Text style={[
          styles.storyName,
          isSeen && styles.seenStoryName,
          !isSeen && hasStories && styles.unseenStoryName
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

          {stories.length > 4 ? (
            <ScrollView
              horizontal
              scrollEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.storiesRightSection}
            >
              {stories.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.storyItemContainer}
                  onPress={() => handleStoryPress(item)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.storyCircle,
                      !item.stories?.length && styles.disabledStoryCircle,
                      item.stories?.length > 0 && !isStorySeen(item.user_id, item.stories[0].story_id) && styles.unseenStoryCircle,
                      item.stories?.length > 0 && isStorySeen(item.user_id, item.stories[0].story_id) && styles.seenStoryCircle
                    ]}
                  >
                    <Image source={{ uri: item.user_image }} style={styles.storyImage} />
                  </View>
                  <Text 
                    style={[
                      styles.storyName,
                      item.stories?.length > 0 && !isStorySeen(item.user_id, item.stories[0].story_id) && styles.unseenStoryName,
                      item.stories?.length > 0 && isStorySeen(item.user_id, item.stories[0].story_id) && styles.seenStoryName
                    ]}
                  >
                    {item.user_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.storiesRightSection, { flexDirection: 'row' }]}>
              {stories.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.storyItemContainer}
                  onPress={() => handleStoryPress(item)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.storyCircle,
                      !item.stories?.length && styles.disabledStoryCircle,
                      item.stories?.length > 0 && !isStorySeen(item.user_id, item.stories[0].story_id) && styles.unseenStoryCircle,
                      item.stories?.length > 0 && isStorySeen(item.user_id, item.stories[0].story_id) && styles.seenStoryCircle
                    ]}
                  >
                    <Image source={{ uri: item.user_image }} style={styles.storyImage} />
                  </View>
                  <Text 
                    style={[
                      styles.storyName,
                      item.stories?.length > 0 && !isStorySeen(item.user_id, item.stories[0].story_id) && styles.unseenStoryName,
                      item.stories?.length > 0 && isStorySeen(item.user_id, item.stories[0].story_id) && styles.seenStoryName
                    ]}
                  >
                    {item.user_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Modal
          visible={showStories}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowStories(false);
            setSelectedUser(null);
            setCurrentStoryIndex(0);
          }}
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
    color: '#9B9B9B',
    fontWeight: '400',
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
    alignItems: 'center',
  },
  storiesLeftSection: {
    marginRight: 15,
  },
  storiesRightSection: {
    flex: 1,
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
  storyNavigationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  storyNavigationArea: {
    flex: 1,
    height: '100%',
  },
  unseenStoryCircle: {
    borderColor: '#870E6B',
    borderWidth: 2.5,
  },
  seenStoryCircle: {
    borderColor: '#9B9B9B',
    borderWidth: 2,
    opacity: 0.9,
  },
  unseenStoryName: {
    color: '#870E6B',
    fontWeight: '600',
  },
  seenStoryName: {
    color: '#9B9B9B',
    fontWeight: '400',
  },
  storyHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginRight: 15,
  },
});

export default Stories;
